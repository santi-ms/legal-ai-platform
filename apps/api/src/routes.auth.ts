import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomInt } from "crypto";
import { sanitizeInput } from "./utils/sanitize.js";
import { prisma } from "./db.js";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema,
  verifyEmailSchema,
  verifyEmailCodeSchema,
  resendVerificationCodeSchema,
} from "./schemas/auth.js";
import {
  sendEmail,
  generateToken,
  getVerificationEmailHtml,
  getVerificationEmailText,
  getVerificationCodeEmailHtml,
  getVerificationCodeEmailText,
  getResetPasswordEmailHtml,
  getResetPasswordEmailText,
} from "./services/email.js";

// AUTH_DEBUG flag para logs detallados
const AUTH_DEBUG = process.env.AUTH_DEBUG === "true";
const EMAIL_VERIFICATION_CODE_LENGTH = 6;
const EMAIL_VERIFICATION_EXPIRATION_MINUTES = 10;
const EMAIL_VERIFICATION_MAX_ATTEMPTS = 5;
const EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS = 60;

// Helper para logs seguros (sin credenciales)
function safeLog(obj: any) {
  try {
    const sanitized = { ...obj };
    // Remover campos sensibles
    if (sanitized.password) delete sanitized.password;
    if (sanitized.passwordHash) delete sanitized.passwordHash;
    if (sanitized.body?.password) delete sanitized.body.password;
    return JSON.stringify(sanitized);
  } catch {
    return String(obj);
  }
}

function getEmailVerificationPepper() {
  return (
    process.env.EMAIL_VERIFICATION_PEPPER ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "dev-email-verification-pepper"
  );
}

function normalizeEmail(email: string) {
  return sanitizeInput(email.trim().toLowerCase());
}

function generateVerificationCode() {
  return randomInt(0, 1_000_000)
    .toString()
    .padStart(EMAIL_VERIFICATION_CODE_LENGTH, "0");
}

function hashVerificationCode(userId: string, code: string) {
  return createHash("sha256")
    .update(`${userId}:${code}:${getEmailVerificationPepper()}`)
    .digest("hex");
}

function buildVerificationPayload(
  email: string,
  expiresAt: Date | null,
  resendAvailableAt: Date | null,
  delivery?: string,
) {
  return {
    email,
    expiresAt: expiresAt?.toISOString() ?? null,
    resendAvailableAt: resendAvailableAt?.toISOString() ?? null,
    maxAttempts: EMAIL_VERIFICATION_MAX_ATTEMPTS,
    expiresInMinutes: EMAIL_VERIFICATION_EXPIRATION_MINUTES,
    resendCooldownSeconds: EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS,
    ...(delivery ? { delivery } : {}),
  };
}

async function issueVerificationCode(user: { id: string; email: string }) {
  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(user.id, code);
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + EMAIL_VERIFICATION_EXPIRATION_MINUTES * 60 * 1000,
  );
  const resendAvailableAt = new Date(
    now.getTime() + EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS * 1000,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerificationCodeHash: codeHash,
      emailVerificationExpiresAt: expiresAt,
      emailVerificationAttempts: 0,
      emailVerificationLastSentAt: now,
      emailVerificationResendAfter: resendAvailableAt,
    },
  });

  const delivery = await sendEmail({
    to: user.email,
    subject: "Codigo de verificacion - Legal AI Platform",
    html: getVerificationCodeEmailHtml(
      code,
      EMAIL_VERIFICATION_EXPIRATION_MINUTES,
    ),
    text: getVerificationCodeEmailText(
      code,
      EMAIL_VERIFICATION_EXPIRATION_MINUTES,
    ),
  });

  return buildVerificationPayload(
    user.email,
    expiresAt,
    resendAvailableAt,
    delivery.provider,
  );
}

// Helper para respuestas homogéneas
function sendSuccess(reply: any, message: string, data?: any) {
  return reply.status(200).send({
    ok: true,
    message,
    ...(data && { data }),
  });
}

function sendError(
  reply: any,
  statusCode: number,
  message: string,
  error?: string,
  fieldErrors?: Record<string, string[]>,
) {
  return reply.status(statusCode).send({
    ok: false,
    message,
    ...(error && { error }),
    ...(fieldErrors && { fieldErrors }),
  });
}

export async function registerAuthRoutes(app: FastifyInstance) {
  // Config de rate-limit por-ruta para endpoints sensibles (5 req / 5 min por IP).
  // IMPORTANT: no registramos @fastify/rate-limit aquí (ya está registrado
  // globalmente en server.ts). Registrarlo de nuevo sobrescribe los límites
  // globales para TODAS las rutas, causando bloqueos en navegación normal.
  const sensitiveRateLimit = {
    rateLimit: {
      max: 5,
      timeWindow: 5 * 60 * 1000, // 5 minutos
      errorResponseBuilder: () => ({
        ok: false,
        message: "Demasiados intentos. Por favor espera 5 minutos.",
        error: "too_many_attempts",
      }),
    },
  };

  // POST /api/register - Registro pendiente hasta verificar OTP por email
  const RegisterSchema = z.object({
    name: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    email: z.string().email(),
    company: z.string().optional().nullable(),
    professionalRole: z.string().min(1),
    password: z.string().min(6),
  });

  type RegisterBody = z.infer<typeof RegisterSchema>;
  app.post<{ Body: RegisterBody }>("/api/register", { config: sensitiveRateLimit }, async (request, reply) => {
    try {
      const { name, firstName, lastName, email, password, company, professionalRole } = RegisterSchema.parse(request.body);
      
      // Sanitizar inputs para prevenir XSS
      const sanitizedName = sanitizeInput(name || "");
      const sanitizedFirstName = sanitizeInput(firstName || "");
      const sanitizedLastName = sanitizeInput(lastName || "");
      const sanitizedEmail = sanitizeInput(email.trim().toLowerCase());
      const sanitizedCompany = company ? sanitizeInput(company) : null;
      const sanitizedProfessionalRole = sanitizeInput(professionalRole || "");
      
      const normEmail = normalizeEmail(sanitizedEmail);

      request.log.info({ event: "register:incoming", email: normEmail });

      // Verificar si el usuario ya existe
      let exists = null;
      try {
        exists = await prisma.user.findFirst({
          where: { email: normEmail },
          select: {
            id: true,
            email: true,
            name: true,
            emailVerified: true,
            emailVerificationExpiresAt: true,
            emailVerificationResendAfter: true,
          },
        });
      } catch (dbError: any) {
        request.log.error({
          event: "register:db_error",
          error: dbError?.message,
          code: dbError?.code,
          meta: dbError?.meta,
          stack: dbError?.stack,
        });
        // Si es un error de conexión o tabla no encontrada, devolver error más claro
        if (dbError?.code === "P1001" || dbError?.message?.includes("not found") || dbError?.message?.includes("FATAL")) {
          return reply.code(500).send({
            ok: false,
            message: "Error de conexión con la base de datos. Verificá que las migraciones se hayan ejecutado correctamente.",
            error: "database_connection_error",
          });
        }
        // Si es un error de columna faltante, continuar (las migraciones no están aplicadas pero podemos intentar crear sin esa columna)
        if (dbError?.code === "P2022" || dbError?.message?.includes("does not exist")) {
          request.log.warn({
            event: "register:schema_mismatch",
            error: dbError?.message,
            message: "Schema no está actualizado, continuando sin columnas opcionales",
          });
          // Continuar, no lanzar error
        } else {
          throw dbError;
        }
      }

      if (exists) {
        if (exists.emailVerified) {
          request.log.warn({ event: "register:email_exists", email: normEmail });
          return reply.code(409).send({
            ok: false,
            message: "El email ya está registrado",
            error: "email_exists",
          });
        }

        request.log.info({
          event: "register:pending_verification",
          email: normEmail,
          userId: exists.id,
        });

        return reply.code(409).send({
          ok: false,
          message: "Tu cuenta ya está pendiente de verificación",
          error: "email_pending_verification",
          verification: buildVerificationPayload(
            normEmail,
            exists.emailVerificationExpiresAt,
            exists.emailVerificationResendAfter,
          ),
        });
      }

      // Hashear contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear o encontrar tenant si se proporciona una compañía
      let tenantId: string | undefined = undefined;
      try {
        if (sanitizedCompany && sanitizedCompany.trim().length > 0) {
          // Buscar tenant existente o crear uno nuevo
          const existingTenant = await prisma.tenant.findFirst({
            where: { name: sanitizedCompany },
          });
          const tenant =
            existingTenant ??
            (await prisma.tenant.create({ data: { name: sanitizedCompany } }));
          tenantId = tenant.id;
        }
      } catch (e) {
        request.log.warn({
          event: "register:tenant_warning",
          error: (e as any)?.message,
        });
        // si falla la creación del tenant, seguimos sin bloquear el alta de usuario
      }

      const baseData: any = {
        name: sanitizedName,
        firstName: sanitizedFirstName,
        lastName: sanitizedLastName,
        email: normEmail,
        passwordHash,
        company: sanitizedCompany,
        role: "user",
        professionalRole: sanitizedProfessionalRole,
        emailVerified: null,
      };

      const dataBase: Prisma.UserCreateInput = tenantId
        ? {
            ...baseData,
            tenant: { connect: { id: tenantId } },
          }
        : (baseData as Prisma.UserCreateInput);

      let created: any = null;
      try {
        created = await prisma.user.create({
          data: dataBase,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tenantId: true,
          },
        });
      } catch (e: any) {
        if (e?.code === "P1001" || e?.message?.includes("not found") || e?.message?.includes("FATAL")) {
          // Error de conexión a la base de datos
          request.log.error({
            event: "register:db_connection_error",
            email: normEmail,
            error: e?.message,
            code: e?.code,
          });
          return reply.code(500).send({
            ok: false,
            message: "Error de conexión con la base de datos. Por favor, contactá al administrador.",
            error: "database_connection_error",
          });
        } else if (e?.code === "P2002" || e?.message?.includes("Unique constraint")) {
          // Usuario ya existe (aunque ya lo verificamos antes, puede haber race condition)
          request.log.warn({ event: "register:email_exists_race", email: normEmail });
          return reply.code(409).send({
            ok: false,
            message: "El email ya está registrado",
          });
        } else {
          throw e;
        }
      }

      let verification: ReturnType<typeof buildVerificationPayload>;
      try {
        verification = await issueVerificationCode({
          id: created.id,
          email: created.email,
        });
      } catch (emailError: any) {
        request.log.error({
          event: "register:verification_delivery_failed",
          userId: created.id,
          email: normEmail,
          error: emailError?.message,
        });

        return reply.code(500).send({
          ok: false,
          message: "No pudimos enviar el codigo de verificacion. Intenta nuevamente.",
          error: "verification_delivery_failed",
          verification: buildVerificationPayload(normEmail, null, null),
        });
      }

      request.log.info({
        event: "register:success",
        userId: created.id,
        tenantId: created.tenantId || null,
      });

      return reply.send({ 
        ok: true, 
        requiresVerification: true,
        verification,
        user: {
          id: created.id,
          email: created.email,
          name: created.name,
          role: created.role,
          tenantId: created.tenantId || null,
        }
      });
    } catch (err: any) {
      request.log.error({
        event: "register:exception",
        message: err?.message,
        code: err?.code,
        meta: err?.meta,
        stack: err?.stack,
      });
      
      // Errores de validación de Zod
      if (err?.name === "ZodError") {
        return reply.code(400).send({
          ok: false,
          message: "Body inválido",
          issues: err.issues,
        });
      }
      
      // Errores de Prisma - conexión o tabla no encontrada
      if (err?.code === "P1001" || err?.code === "P2022" || err?.message?.includes("not found")) {
        return reply.code(500).send({
          ok: false,
          message: "Error de conexión con la base de datos. Verificá que las migraciones se hayan ejecutado correctamente.",
          error: "database_error",
          details: err?.message,
        });
      }
      
      // Otros errores de Prisma
      if (err?.code?.startsWith("P")) {
        return reply.code(500).send({
          ok: false,
          message: "Error en la base de datos",
          error: "database_error",
          details: err?.message,
        });
      }
      
      return reply.code(500).send({
        ok: false,
        message: "Error interno al registrar usuario",
        error: "internal_error",
      });
    }
  });

  // GET /api/auth/verify-email - Verificar email con token
  app.get("/api/auth/verify-email", async (request, reply) => {
    try {
      const token = (request.query as any)?.token as string | undefined;
      if (!token) {
        return reply.code(400).send({
          ok: false,
          message: "Token requerido",
        });
      }

      // Validar con Zod
      const parsed = verifyEmailSchema.safeParse({ token });
      if (!parsed.success) {
        return reply.code(400).send({
          ok: false,
          message: "Token inválido",
        });
      }

      // Buscar token en la base de datos
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        return sendError(
          reply,
          400,
          "Token inválido o expirado",
          "invalid_token",
        );
      }

      // Verificar si el token expiró
      if (verificationToken.expires < new Date()) {
        // Eliminar token expirado
        await prisma.verificationToken.delete({
          where: { token },
        });

        return sendError(
          reply,
          400,
          "El token de verificación ha expirado",
          "token_expired",
        );
      }

      // Buscar usuario por email
      const user = await prisma.user.findUnique({
        where: { email: verificationToken.identifier },
        select: {
          id: true,
          email: true,
          emailVerified: true, // Necesario para verificar estado
        },
      });

      if (!user) {
        return sendError(reply, 404, "Usuario no encontrado", "user_not_found");
      }

      // Si ya está verificado, no hacer nada pero retornar éxito
      if (user.emailVerified) {
        await prisma.verificationToken.delete({
          where: { token },
        });

        return sendSuccess(reply, "Email ya estaba verificado", {
          email: user.email,
        });
      }

      // Marcar email como verificado y eliminar token
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });

        await tx.verificationToken.delete({
          where: { token },
        });
      });

      return sendSuccess(reply, "Email verificado exitosamente", {
        email: user.email,
      });
    } catch (error: any) {
      request.log.error({ event: "verify_email:exception", error: error?.message, stack: error?.stack });
      if (error?.name === "ZodError") {
        return reply.code(400).send({
          ok: false,
          message: "Token inválido",
          issues: error.issues,
        });
      }
      return sendError(
        reply,
        500,
        "Error al verificar email",
        "internal_error",
      );
    }
  });

  // POST /api/auth/verify-email - Verificar email con OTP de 6 dígitos
  type VerifyEmailCodeBody = z.infer<typeof verifyEmailCodeSchema>;
  app.post<{ Body: VerifyEmailCodeBody }>("/api/auth/verify-email", async (request, reply) => {
    try {
      const { email, code } = verifyEmailCodeSchema.parse(request.body);
      const normEmail = normalizeEmail(email);

      const user = await prisma.user.findUnique({
        where: { email: normEmail },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          emailVerificationCodeHash: true,
          emailVerificationExpiresAt: true,
          emailVerificationAttempts: true,
          emailVerificationResendAfter: true,
        },
      });

      if (!user) {
        return sendError(reply, 400, "Codigo invalido o expirado", "invalid_code");
      }

      if (user.emailVerified) {
        return sendSuccess(reply, "El email ya estaba verificado", {
          verification: buildVerificationPayload(
            user.email,
            user.emailVerificationExpiresAt,
            user.emailVerificationResendAfter,
          ),
        });
      }

      if (!user.emailVerificationCodeHash || !user.emailVerificationExpiresAt) {
        return sendError(
          reply,
          400,
          "No hay un codigo activo. Solicita uno nuevo.",
          "verification_code_missing",
        );
      }

      if (user.emailVerificationExpiresAt < new Date()) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationCodeHash: null,
            emailVerificationExpiresAt: null,
            emailVerificationAttempts: 0,
          },
        });

        return sendError(reply, 400, "El codigo expiro. Solicita uno nuevo.", "code_expired");
      }

      if (user.emailVerificationAttempts >= EMAIL_VERIFICATION_MAX_ATTEMPTS) {
        return sendError(
          reply,
          429,
          "Alcanzaste el maximo de intentos. Solicita un nuevo codigo.",
          "too_many_attempts",
        );
      }

      const incomingHash = hashVerificationCode(user.id, code);
      if (incomingHash !== user.emailVerificationCodeHash) {
        const nextAttempts = user.emailVerificationAttempts + 1;
        const lockVerification = nextAttempts >= EMAIL_VERIFICATION_MAX_ATTEMPTS;

        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationAttempts: nextAttempts,
            ...(lockVerification
              ? {
                  emailVerificationCodeHash: null,
                  emailVerificationExpiresAt: null,
                }
              : {}),
          },
        });

        if (lockVerification) {
          return sendError(
            reply,
            429,
            "Alcanzaste el maximo de intentos. Solicita un nuevo codigo.",
            "too_many_attempts",
          );
        }

        return reply.code(400).send({
          ok: false,
          message: "Codigo incorrecto",
          error: "invalid_code",
          remainingAttempts: EMAIL_VERIFICATION_MAX_ATTEMPTS - nextAttempts,
        });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          emailVerificationCodeHash: null,
          emailVerificationExpiresAt: null,
          emailVerificationAttempts: 0,
          emailVerificationLastSentAt: null,
          emailVerificationResendAfter: null,
        },
      });

      return sendSuccess(reply, "Email verificado exitosamente", {
        email: user.email,
      });
    } catch (error: any) {
      request.log.error({
        event: "verify_email_code:exception",
        error: error?.message,
        stack: error?.stack,
      });
      if (error?.name === "ZodError") {
        return reply.code(400).send({
          ok: false,
          message: "Body invalido",
          issues: error.issues,
        });
      }
      return sendError(reply, 500, "Error al verificar el codigo", "internal_error");
    }
  });

  // POST /api/auth/verify-email/resend - Reenviar OTP de verificación
  type ResendVerificationCodeBody = z.infer<typeof resendVerificationCodeSchema>;
  app.post<{ Body: ResendVerificationCodeBody }>("/api/auth/verify-email/resend", { config: sensitiveRateLimit }, async (request, reply) => {
    try {
      const { email } = resendVerificationCodeSchema.parse(request.body);
      const normEmail = normalizeEmail(email);

      const user = await prisma.user.findUnique({
        where: { email: normEmail },
        select: {
          id: true,
          email: true,
          emailVerified: true,
          emailVerificationResendAfter: true,
        },
      });

      if (!user) {
        return sendSuccess(
          reply,
          "Si el email existe y esta pendiente, enviaremos un nuevo codigo.",
        );
      }

      if (user.emailVerified) {
        return sendSuccess(reply, "El email ya esta verificado", {
          email: user.email,
        });
      }

      if (user.emailVerificationResendAfter && user.emailVerificationResendAfter > new Date()) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil(
            (user.emailVerificationResendAfter.getTime() - Date.now()) / 1000,
          ),
        );

        return reply.code(429).send({
          ok: false,
          message: "Espera antes de solicitar un nuevo codigo.",
          error: "resend_cooldown_active",
          retryAfterSeconds,
          verification: buildVerificationPayload(
            user.email,
            null,
            user.emailVerificationResendAfter,
          ),
        });
      }

      const verification = await issueVerificationCode({ id: user.id, email: user.email });

      return sendSuccess(reply, "Te enviamos un nuevo codigo de verificacion", {
        verification,
      });
    } catch (error: any) {
      request.log.error({
        event: "resend_verification_code:exception",
        error: error?.message,
        stack: error?.stack,
      });
      if (error?.name === "ZodError") {
        return reply.code(400).send({
          ok: false,
          message: "Body invalido",
          issues: error.issues,
        });
      }
      return sendError(reply, 500, "Error al reenviar el codigo", "internal_error");
    }
  });

  // GET /api/auth/login - Handler defensivo (405)
  app.get("/api/auth/login", async (_, reply) => {
    return reply.code(405).send({
      ok: false,
      message: "Method Not Allowed",
    });
  });

  // POST /api/auth/login - Login con validación de email verificado
  type LoginBody = z.infer<typeof loginSchema>;
  app.post<{ Body: LoginBody }>("/api/auth/login", { config: sensitiveRateLimit }, async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);
      const normEmail = normalizeEmail(email);

      request.log.info({ event: "login:incoming", email: normEmail });

      // Intentar obtener usuario con emailVerified, si falla intentar sin él
      let user: any = null;
      try {
        user = await prisma.user.findFirst({
          where: { email: normEmail },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            tenantId: true,
            passwordHash: true,
            emailVerified: true,
          },
        });
      } catch (e: any) {
        // Si falla por columna faltante, intentar sin emailVerified
        if (e?.code === "P2022" || e?.message?.includes("emailVerified")) {
          request.log.warn({
            event: "login:emailVerified_missing",
            email: normEmail,
            error: e?.message,
          });
          user = await prisma.user.findFirst({
            where: { email: normEmail },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              tenantId: true,
              passwordHash: true,
            },
          });
          // Asignar emailVerified como null si no existe
          if (user) {
            user.emailVerified = null;
          }
        } else {
          throw e;
        }
      }

      if (!user) {
        request.log.warn({ event: "login:user_not_found", email: normEmail });
        return reply.code(401).send({
          ok: false,
          message: "Usuario no encontrado",
        });
      }

      const valid = await bcrypt.compare(password, user.passwordHash || "");
      if (!valid) {
        request.log.warn({ event: "login:invalid_password", email: normEmail });
        return reply.code(401).send({
          ok: false,
          message: "Contraseña incorrecta",
        });
      }

      if (!user.emailVerified) {
        request.log.warn({ event: "login:unverified_email", email: normEmail });
        return reply.code(403).send({
          ok: false,
          message: "Email no verificado",
          error: "email_not_verified",
          verification: buildVerificationPayload(
            user.email,
            null,
            null,
          ),
        });
      }

      request.log.info({
        event: "login:success",
        email: normEmail,
        userId: user.id,
      });

      return reply.send({
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || "",
          role: user.role,
          tenantId: user.tenantId,
        },
      });
    } catch (err: any) {
      // 🔎 Log de Prisma con detalle real
      request.log.error({
        event: "login:exception",
        message: err?.message,
        code: err?.code,
        meta: err?.meta,
        stack: err?.stack,
      });
      if (err?.name === "ZodError") {
        return reply.code(400).send({
          ok: false,
          message: "Body inválido",
          issues: err.issues,
        });
      }
      return reply.code(500).send({
        ok: false,
        message: "Error interno al iniciar sesión",
      });
    }
  });

  // POST /api/auth/reset/request - Solicitar reset de contraseña
  type ResetReqBody = z.infer<typeof resetRequestSchema>;
  app.post<{ Body: ResetReqBody }>("/api/auth/reset/request", { config: sensitiveRateLimit }, async (request, reply) => {
    try {
      const { email } = resetRequestSchema.parse(request.body);

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Por seguridad, siempre retornar éxito aunque el usuario no exista
      // (para evitar enumeración de emails)
      if (!user) {
        return sendSuccess(
          reply,
          "Si el email existe, recibirás un enlace para restablecer tu contraseña",
        );
      }

      // Eliminar tokens de reset previos para este usuario
      await prisma.verificationToken.deleteMany({
        where: {
          identifier: email,
          // Podríamos filtrar por un tipo si lo agregamos al schema
          // Por ahora eliminamos todos los tokens de este email
        },
      });

      // Generar nuevo token de reset
      const token = generateToken();
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Expira en 1 hora

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      // Enviar email de reset
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      const resetUrl = `${frontendUrl}/auth/reset/${token}`;

      try {
        await sendEmail({
          to: email,
          subject: "Restablecer contraseña - Legal AI Platform",
          html: getResetPasswordEmailHtml(resetUrl),
          text: getResetPasswordEmailText(resetUrl),
        });
      } catch (emailError: any) {
        app.log.error("Error enviando email de reset:", emailError);
        // No fallar la solicitud si el email falla
      }

      return sendSuccess(
        reply,
        "Si el email existe, recibirás un enlace para restablecer tu contraseña",
      );
    } catch (error: any) {
      request.log.error({ event: "reset_request:exception", error: error?.message, stack: error?.stack });
      if (error?.name === "ZodError") {
        return reply.code(400).send({
          ok: false,
          message: "Body inválido",
          issues: error.issues,
        });
      }
      return sendError(
        reply,
        500,
        "Error al procesar solicitud",
        "internal_error",
      );
    }
  });

  // POST /api/auth/reset/confirm - Confirmar reset de contraseña
  type ResetConfBody = z.infer<typeof resetConfirmSchema>;
  app.post<{ Body: ResetConfBody }>("/api/auth/reset/confirm", async (request, reply) => {
    try {
      const { token, password } = resetConfirmSchema.parse(request.body);

      // Buscar token
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        return sendError(
          reply,
          400,
          "Token inválido o expirado",
          "invalid_token",
        );
      }

      // Verificar si el token expiró
      if (verificationToken.expires < new Date()) {
        await prisma.verificationToken.delete({
          where: { token },
        });

        return sendError(
          reply,
          400,
          "El token de reset ha expirado",
          "token_expired",
        );
      }

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email: verificationToken.identifier },
      });

      if (!user) {
        return sendError(reply, 404, "Usuario no encontrado", "user_not_found");
      }

      // Hashear nueva contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Actualizar contraseña y eliminar token
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });

        await tx.verificationToken.delete({
          where: { token },
        });
      });

      return sendSuccess(reply, "Contraseña actualizada exitosamente");
    } catch (error: any) {
      request.log.error({ event: "reset_confirm:exception", error: error?.message, stack: error?.stack });
      if (error?.name === "ZodError") {
        return reply.code(400).send({
          ok: false,
          message: "Body inválido",
          issues: error.issues,
        });
      }
      return sendError(
        reply,
        500,
        "Error al restablecer contraseña",
        "internal_error",
      );
    }
  });

  // GET /api/_diagnostics/auth - Endpoint de diagnóstico para auth
  app.get("/api/_diagnostics/auth", async (request, reply) => {
    try {
      const one = await prisma.user.findFirst({
        select: {
          id: true,
          email: true,
          role: true,
          tenantId: true,
          emailVerified: true,
          passwordHash: true,
        },
      });
      return reply.send({
        ok: true,
        db: true,
        sampleUser: one
          ? {
              id: one.id,
              email: one.email,
              role: one.role,
              tenantId: one.tenantId,
              emailVerified: !!one.emailVerified,
              hasPasswordHash: !!one.passwordHash,
            }
          : null,
      });
    } catch (err) {
      request.log.error({ err: safeLog(err) }, "diag:auth");
      return reply.status(500).send({
        ok: false,
        db: false,
        message: "DB error",
      });
    }
  });

  // GET /api/_diagnostics/prisma-user - Endpoint de diagnóstico de Prisma User
  app.get("/api/_diagnostics/prisma-user", async (request, reply) => {
    try {
      const columnsUsers = await prisma.$queryRawUnsafe<any[]>(
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_schema = 'public' AND table_name IN ('users','User') 
         ORDER BY column_name`
      );
      let sample: any = null;
      try {
        sample = await prisma.user.findFirst({
          select: {
            id: true,
            email: true,
            emailVerified: true,
          },
        });
      } catch (e: any) {
        sample = { error: e?.message || String(e) };
      }
      return reply.send({ ok: true, columns: columnsUsers, sample });
    } catch (err: any) {
      request.log.error({ err }, "diag:prisma-user");
      return reply.code(500).send({
        ok: false,
        message: "diag failed",
        detail: err?.message,
      });
    }
  });
}
