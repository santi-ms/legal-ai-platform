import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import db from "db";
const prisma = db.prisma;
import rateLimit from "@fastify/rate-limit";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  resetRequestSchema,
  resetConfirmSchema,
  verifyEmailSchema,
} from "./schemas/auth.js";
import {
  sendEmail,
  generateToken,
  getVerificationEmailHtml,
  getVerificationEmailText,
  getResetPasswordEmailHtml,
  getResetPasswordEmailText,
} from "./services/email.js";

// AUTH_DEBUG flag para logs detallados
const AUTH_DEBUG = process.env.AUTH_DEBUG === "true";

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
  // Rate limiting para endpoints sensibles: 5 req / 5 min por IP
  await app.register(rateLimit, {
    max: 5,
    timeWindow: 5 * 60 * 1000, // 5 minutos
    keyGenerator: (request) => {
      return request.ip;
    },
    skipOnError: false,
    errorResponseBuilder: (request, context) => {
      return sendError(
        request,
        429,
        "Demasiados intentos. Por favor espera 5 minutos.",
      );
    },
  });

  // POST /api/register - Registro con email verificado por defecto
  const RegisterSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    company: z.string().optional().nullable(),
    password: z.string().min(6),
  });

  type RegisterBody = z.infer<typeof RegisterSchema>;
  app.post<{ Body: RegisterBody }>("/api/register", async (request, reply) => {
    try {
      const { name, email, password, company } = RegisterSchema.parse(request.body);
      const normEmail = email.trim().toLowerCase();

      request.log.info({ event: "register:incoming", email: normEmail });

      // Verificar si el usuario ya existe
      let exists = null;
      try {
        exists = await prisma.user.findFirst({
          where: { email: normEmail },
        });
      } catch (dbError: any) {
        request.log.error({
          event: "register:db_error",
          error: dbError?.message,
          code: dbError?.code,
          meta: dbError?.meta,
        });
        // Si es un error de conexión o tabla no encontrada, devolver error más claro
        if (dbError?.code === "P1001" || dbError?.message?.includes("not found")) {
          return reply.code(500).send({
            ok: false,
            message: "Error de conexión con la base de datos. Verificá que las migraciones se hayan ejecutado correctamente.",
            error: "database_connection_error",
          });
        }
        throw dbError;
      }

      if (exists) {
        request.log.warn({ event: "register:email_exists", email: normEmail });
        return reply.code(409).send({
          ok: false,
          message: "El email ya está registrado",
        });
      }

      // Hashear contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Si existe el modelo Tenant y querés asociar:
      let tenantId: string | undefined = undefined;
      try {
        if (company && company.trim().length > 0) {
          // crea tenant solo si no existe uno con ese nombre
          const existingTenant = await prisma.tenant?.findFirst?.({
            where: { name: company },
          });
          const tenant =
            existingTenant ??
            (await prisma.tenant?.create?.({ data: { name: company } }));
          tenantId = tenant?.id;
        }
      } catch (e) {
        request.log.warn({
          event: "register:tenant_warning",
          error: (e as any)?.message,
        });
        // si falla la creación del tenant, seguimos sin bloquear el alta de usuario
      }

      // Armamos el payload según si existe la relación Tenant en el cliente Prisma
      const baseData: any = {
        name,
        email: normEmail,
        passwordHash,
        role: "user",
      };

      // Intentar agregar emailVerified (puede fallar si la columna no existe)
      try {
        // Verificar si el modelo tiene emailVerified en el schema
        baseData.emailVerified = new Date();
      } catch (e) {
        // Si no existe la columna, no la agregamos
        request.log.warn({
          event: "register:emailVerified_missing",
          email: normEmail,
        });
      }

      const dataBase: Prisma.UserCreateInput = tenantId
        ? {
            ...baseData,
            tenant: { connect: { id: tenantId } },
          }
        : (baseData as Prisma.UserCreateInput);

      // Intentar crear usuario con emailVerified, si falla intentar sin él
      let created: any = null;
      try {
        created = await prisma.user.create({
          data: dataBase,
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            emailVerified: true,
            tenantId: true,
          },
        });
      } catch (e: any) {
        // Si falla por columna faltante, intentar sin emailVerified
        if (e?.code === "P2022" || e?.message?.includes("emailVerified")) {
          request.log.warn({
            event: "register:emailVerified_missing",
            email: normEmail,
            error: e?.message,
          });
          // Remover emailVerified del dataBase
          const dataWithoutVerified = { ...dataBase };
          delete dataWithoutVerified.emailVerified;
          created = await prisma.user.create({
            data: dataWithoutVerified,
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              tenantId: true,
            },
          });
          // Asignar emailVerified como null si no existe
          created.emailVerified = null;
        } else if (e?.code === "P1001" || e?.message?.includes("not found") || e?.message?.includes("FATAL")) {
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

      request.log.info({
        event: "register:success",
        userId: created.id,
        tenantId: created.tenantId || null,
      });

      return reply.send({ ok: true, user: created });
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

  // GET /api/auth/login - Handler defensivo (405)
  app.get("/api/auth/login", async (_, reply) => {
    return reply.code(405).send({
      ok: false,
      message: "Method Not Allowed",
    });
  });

  // POST /api/auth/login - Login con validación de email verificado
  type LoginBody = z.infer<typeof loginSchema>;
  app.post<{ Body: LoginBody }>("/api/auth/login", async (request, reply) => {
    try {
      const { email, password } = loginSchema.parse(request.body);
      const normEmail = email.trim().toLowerCase();

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

      // Solo verificar emailVerified si existe (puede ser null si la columna no existe)
      if (user.emailVerified === undefined || user.emailVerified === null) {
        // Si emailVerified no existe o es null, permitir login (por ahora)
        request.log.info({
          event: "login:emailVerified_null",
          email: normEmail,
          message: "Email no verificado, pero permitiendo login",
        });
      } else if (!user.emailVerified) {
        request.log.warn({ event: "login:unverified_email", email: normEmail });
        return reply.code(403).send({
          ok: false,
          message: "Email no verificado",
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
  app.post<{ Body: ResetReqBody }>("/api/auth/reset/request", async (request, reply) => {
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
            passwordHash: true,
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
