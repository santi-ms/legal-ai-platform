import { FastifyInstance } from "fastify";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import rateLimit from "@fastify/rate-limit";
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

const prisma = new PrismaClient();

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
  fieldErrors?: Record<string, string[]>
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
      return sendError(request, 429, "Demasiados intentos. Por favor espera 5 minutos.");
    },
  });

  // POST /api/register - Registro con verificación de email
  app.post("/api/register", async (request, reply) => {
    try {
      // Validar con Zod
      const parsed = registerSchema.safeParse(request.body);

      if (!parsed.success) {
        const fieldErrors: Record<string, string[]> = {};
        parsed.error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });

        return sendError(
          reply,
          400,
          "Errores de validación",
          "validation_error",
          fieldErrors
        );
      }

      const { name, email, password, companyName } = parsed.data;

      // Verificar si el usuario ya existe
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return sendError(
          reply,
          400,
          "El email ya está registrado",
          "user_exists"
        );
      }

      // Hashear contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Crear tenant y usuario en transacción
      const result = await prisma.$transaction(async (tx) => {
        // Crear tenant
        const tenant = await tx.tenant.create({
          data: {
            name: companyName,
          },
        });

        // Crear usuario (sin verificar aún)
        const user = await tx.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "owner", // Primer usuario de un tenant es owner
            tenantId: tenant.id,
            emailVerified: null, // No verificado aún
          },
        });

        // Generar token de verificación
        const token = generateToken();
        const expires = new Date();
        expires.setHours(expires.getHours() + 24); // Expira en 24 horas

        await tx.verificationToken.create({
          data: {
            identifier: email,
            token,
            expires,
          },
        });

        return { user, tenant, token };
      });

      // Enviar email de verificación
      const frontendUrl =
        process.env.FRONTEND_URL || "http://localhost:3000";
      const verificationUrl = `${frontendUrl}/auth/verify-email?token=${result.token}`;

      try {
        await sendEmail({
          to: email,
          subject: "Verifica tu cuenta - Legal AI Platform",
          html: getVerificationEmailHtml(verificationUrl),
          text: getVerificationEmailText(verificationUrl),
        });
      } catch (emailError: any) {
        app.log.error("Error enviando email de verificación:", emailError);
        // No fallar el registro si el email falla, solo loguear
      }

      return sendSuccess(
        reply,
        "Usuario creado exitosamente. Revisa tu email para verificar tu cuenta.",
        {
          userId: result.user.id,
          email: result.user.email,
        }
      );
    } catch (error: any) {
      app.log.error("Error en registro:", error);
      return sendError(
        reply,
        500,
        "Error al crear usuario",
        "internal_error"
      );
    }
  });

  // GET /api/auth/verify-email - Verificar email con token
  app.get("/api/auth/verify-email", async (request, reply) => {
    try {
      const { token } = request.query as { token?: string };

      if (!token) {
        return sendError(
          reply,
          400,
          "Token requerido",
          "token_required"
        );
      }

      // Validar con Zod
      const parsed = verifyEmailSchema.safeParse({ token });
      if (!parsed.success) {
        return sendError(
          reply,
          400,
          "Token inválido",
          "invalid_token"
        );
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
          "invalid_token"
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
          "token_expired"
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
        return sendError(
          reply,
          404,
          "Usuario no encontrado",
          "user_not_found"
        );
      }

      // Si ya está verificado, no hacer nada pero retornar éxito
      if (user.emailVerified) {
        await prisma.verificationToken.delete({
          where: { token },
        });

        return sendSuccess(
          reply,
          "Email ya estaba verificado",
          { email: user.email }
        );
      }

      // Marcar email como verificado y eliminar token
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        });

        await tx.verificationToken.delete({
          where: { token },
        });
      });

      return sendSuccess(
        reply,
        "Email verificado exitosamente",
        { email: user.email }
      );
    } catch (error: any) {
      app.log.error("Error verificando email:", error);
      return sendError(
        reply,
        500,
        "Error al verificar email",
        "internal_error"
      );
    }
  });

  // POST /api/auth/login - Login con validación de email verificado
  app.post("/api/auth/login", async (request, reply) => {
    try {
      // Validar con Zod
      const parsed = loginSchema.safeParse(request.body);

      if (!parsed.success) {
        const fieldErrors: Record<string, string[]> = {};
        parsed.error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });

        return sendError(
          reply,
          400,
          "Errores de validación",
          "validation_error",
          fieldErrors
        );
      }

      const { email, password } = parsed.data;

      // Buscar usuario con campos necesarios para validación
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          tenantId: true,
          passwordHash: true, // Necesario para comparar contraseña
          emailVerified: true, // Necesario para verificar email
          tenant: {
            select: {
              id: true,
              name: true,
              createdAt: true,
            },
          },
        },
      });

      if (!user) {
        return sendError(
          reply,
          401,
          "Email o contraseña incorrectos",
          "invalid_credentials"
        );
      }

      // Verificar contraseña (usando passwordHash)
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

      if (!isPasswordValid) {
        return sendError(
          reply,
          401,
          "Email o contraseña incorrectos",
          "invalid_credentials"
        );
      }

      // Verificar si el email está verificado
      if (!user.emailVerified) {
        return sendError(
          reply,
          403,
          "Debes verificar tu email antes de iniciar sesión",
          "email_not_verified"
        );
      }

      // Devolver usuario (sin passwordHash)
      return sendSuccess(reply, "Login exitoso", {
        id: user.id,
        email: user.email,
        name: user.name || "",
        role: user.role,
        tenantId: user.tenantId,
      });
    } catch (error: any) {
      app.log.error("Error en login:", error);
      return sendError(
        reply,
        500,
        "Error al iniciar sesión",
        "internal_error"
      );
    }
  });

  // POST /api/auth/reset/request - Solicitar reset de contraseña
  app.post("/api/auth/reset/request", async (request, reply) => {
    try {
      // Validar con Zod
      const parsed = resetRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        const fieldErrors: Record<string, string[]> = {};
        parsed.error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });

        return sendError(
          reply,
          400,
          "Errores de validación",
          "validation_error",
          fieldErrors
        );
      }

      const { email } = parsed.data;

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email },
      });

      // Por seguridad, siempre retornar éxito aunque el usuario no exista
      // (para evitar enumeración de emails)
      if (!user) {
        return sendSuccess(
          reply,
          "Si el email existe, recibirás un enlace para restablecer tu contraseña"
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
      const frontendUrl =
        process.env.FRONTEND_URL || "http://localhost:3000";
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
        "Si el email existe, recibirás un enlace para restablecer tu contraseña"
      );
    } catch (error: any) {
      app.log.error("Error en reset request:", error);
      return sendError(
        reply,
        500,
        "Error al procesar solicitud",
        "internal_error"
      );
    }
  });

  // POST /api/auth/reset/confirm - Confirmar reset de contraseña
  app.post("/api/auth/reset/confirm", async (request, reply) => {
    try {
      // Validar con Zod
      const parsed = resetConfirmSchema.safeParse(request.body);

      if (!parsed.success) {
        const fieldErrors: Record<string, string[]> = {};
        parsed.error.errors.forEach((err) => {
          const path = err.path.join(".");
          if (!fieldErrors[path]) fieldErrors[path] = [];
          fieldErrors[path].push(err.message);
        });

        return sendError(
          reply,
          400,
          "Errores de validación",
          "validation_error",
          fieldErrors
        );
      }

      const { token, password } = parsed.data;

      // Buscar token
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { token },
      });

      if (!verificationToken) {
        return sendError(
          reply,
          400,
          "Token inválido o expirado",
          "invalid_token"
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
          "token_expired"
        );
      }

      // Buscar usuario
      const user = await prisma.user.findUnique({
        where: { email: verificationToken.identifier },
      });

      if (!user) {
        return sendError(
          reply,
          404,
          "Usuario no encontrado",
          "user_not_found"
        );
      }

      // Hashear nueva contraseña
      const passwordHash = await bcrypt.hash(password, 10);

      // Actualizar contraseña y eliminar token
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { passwordHash },
        });

        await tx.verificationToken.delete({
          where: { token },
        });
      });

      return sendSuccess(
        reply,
        "Contraseña actualizada exitosamente"
      );
    } catch (error: any) {
      app.log.error("Error en reset confirm:", error);
      return sendError(
        reply,
        500,
        "Error al restablecer contraseña",
        "internal_error"
      );
    }
  });
}

