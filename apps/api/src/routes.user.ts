/**
 * User Profile Routes
 * 
 * Endpoints for managing user profile and preferences.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { requireAuth } from "./utils/auth.js";
import { prisma } from "./db.js";

// Schema for profile update
const UpdateProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  bio: z.string().max(1000, "La biografía no puede exceder 1000 caracteres").optional().nullable(),
  phone: z.string().max(30).optional().nullable(),
  matricula: z.string().max(100).optional().nullable(),
  especialidad: z.string().max(100).optional().nullable(),
  professionalRole: z.string().max(100).optional().nullable(),
});

// Schema for notification preferences
const NotificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  securityAlerts: z.boolean().optional(),
  productUpdates: z.boolean().optional(),
});

const UpdateSettingsSchema = z.object({
  profile: UpdateProfileSchema.optional(),
  notificationPreferences: NotificationPreferencesSchema.optional(),
});

const CompleteOnboardingSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  company: z.string().min(2, "La empresa o estudio debe tener al menos 2 caracteres"),
  professionalRole: z.string().optional(),
  promoCode: z.string().optional(),
});

type UpdateSettingsBody = z.infer<typeof UpdateSettingsSchema>;
type CompleteOnboardingBody = z.infer<typeof CompleteOnboardingSchema>;

function splitDisplayName(name: string | null | undefined) {
  const nameParts = name?.trim().split(/\s+/).filter(Boolean) || [];
  return {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" ") || "",
  };
}

function sendSuccess(reply: FastifyReply, message: string, data?: any) {
  return reply.status(200).send({
    ok: true,
    message,
    ...(data && { data }),
  });
}

function sendError(
  reply: FastifyReply,
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

export async function registerUserRoutes(app: FastifyInstance) {
  // GET /api/user/profile - Get current user profile
  app.get("/api/user/profile", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = requireAuth(request);

      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          bio: true,
          phone: true,
          matricula: true,
          especialidad: true,
          professionalRole: true,
          notificationPreferences: true,
          tenantId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!dbUser) {
        return sendError(reply, 404, "Usuario no encontrado", "user_not_found");
      }

      // Parse notification preferences if exists
      let notificationPreferences = {
        emailNotifications: true,
        securityAlerts: true,
        productUpdates: false,
      };

      if (dbUser.notificationPreferences) {
        try {
          const parsed = typeof dbUser.notificationPreferences === "string"
            ? JSON.parse(dbUser.notificationPreferences as string)
            : dbUser.notificationPreferences;
          notificationPreferences = {
            emailNotifications: parsed.emailNotifications ?? true,
            securityAlerts: parsed.securityAlerts ?? true,
            productUpdates: parsed.productUpdates ?? false,
          };
        } catch (e) {
          // Use defaults if parsing fails
        }
      }

      // Split name into firstName and lastName
      const fallbackName = splitDisplayName(dbUser.name);
      const firstName = dbUser.firstName || fallbackName.firstName;
      const lastName = dbUser.lastName || fallbackName.lastName;

      return sendSuccess(reply, "Perfil obtenido exitosamente", {
        id: dbUser.id,
        firstName,
        lastName,
        email: dbUser.email,
        company: dbUser.company,
        bio: dbUser.bio || "",
        phone: dbUser.phone || "",
        matricula: dbUser.matricula || "",
        especialidad: dbUser.especialidad || "",
        professionalRole: dbUser.professionalRole || "",
        tenantId: dbUser.tenantId || null,
        notificationPreferences,
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return sendError(reply, 401, "No autorizado", "unauthorized");
      }
      return sendError(reply, 500, "Error al obtener perfil", "internal_error");
    }
  });

  // PATCH /api/user/profile - Update user profile and preferences
  app.patch<{ Body: UpdateSettingsBody }>(
    "/api/user/profile",
    async (request: FastifyRequest<{ Body: UpdateSettingsBody }>, reply: FastifyReply) => {
      try {
        const user = requireAuth(request);

        const bodyParsed = UpdateSettingsSchema.safeParse(request.body);

        if (!bodyParsed.success) {
          return sendError(
            reply,
            400,
            "Datos inválidos",
            "invalid_body",
            bodyParsed.error.flatten().fieldErrors as any,
          );
        }

        const { profile, notificationPreferences } = bodyParsed.data;

        // Build update data
        const updateData: any = {};

        if (profile) {
          if (profile.name !== undefined) {
            updateData.name = profile.name;
            const parsedName = splitDisplayName(profile.name);
            updateData.firstName = parsedName.firstName || null;
            updateData.lastName = parsedName.lastName || null;
          }
          if (profile.email !== undefined) {
            // Check if email is already taken by another user
            const existingUser = await prisma.user.findFirst({
              where: {
                email: profile.email,
                id: { not: user.userId },
              },
            });

            if (existingUser) {
              return sendError(
                reply,
                400,
                "El email ya está en uso",
                "email_taken",
                { email: ["Este email ya está registrado"] },
              );
            }

            updateData.email = profile.email;
            // If email changed, mark as unverified
            updateData.emailVerified = null;
          }
          if (profile.bio !== undefined) {
            updateData.bio = profile.bio;
          }
          if (profile.phone !== undefined) {
            updateData.phone = profile.phone;
          }
          if (profile.matricula !== undefined) {
            updateData.matricula = profile.matricula;
          }
          if (profile.especialidad !== undefined) {
            updateData.especialidad = profile.especialidad;
          }
          if (profile.professionalRole !== undefined) {
            updateData.professionalRole = profile.professionalRole;
          }
        }

        if (notificationPreferences) {
          // Get current preferences
          const currentUser = await prisma.user.findUnique({
            where: { id: user.userId },
            select: { notificationPreferences: true },
          });

          let currentPrefs = {
            emailNotifications: true,
            securityAlerts: true,
            productUpdates: false,
          };

          if (currentUser?.notificationPreferences) {
            try {
              const parsed = typeof currentUser.notificationPreferences === "string"
                ? JSON.parse(currentUser.notificationPreferences as string)
                : currentUser.notificationPreferences;
              currentPrefs = { ...currentPrefs, ...parsed };
            } catch (e) {
              // Use defaults
            }
          }

          // Merge with new preferences
          const mergedPrefs = {
            ...currentPrefs,
            ...notificationPreferences,
          };

          updateData.notificationPreferences = mergedPrefs;
        }

        // Update user
        const updatedUser = await prisma.user.update({
          where: { id: user.userId },
          data: updateData,
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            bio: true,
            phone: true,
            matricula: true,
            especialidad: true,
            professionalRole: true,
            notificationPreferences: true,
          },
        });

        // Parse notification preferences for response
        let notificationPrefs = {
          emailNotifications: true,
          securityAlerts: true,
          productUpdates: false,
        };

        if (updatedUser.notificationPreferences) {
          try {
            const parsed = typeof updatedUser.notificationPreferences === "string"
              ? JSON.parse(updatedUser.notificationPreferences as string)
              : updatedUser.notificationPreferences;
            notificationPrefs = { ...notificationPrefs, ...parsed };
          } catch (e) {
            // Use defaults
          }
        }

        // Split name for response
        const fallbackName = splitDisplayName(updatedUser.name);
        const firstName = updatedUser.firstName || fallbackName.firstName;
        const lastName = updatedUser.lastName || fallbackName.lastName;

        return sendSuccess(reply, "Perfil actualizado exitosamente", {
          id: updatedUser.id,
          firstName,
          lastName,
          email: updatedUser.email,
          company: updatedUser.company,
          bio: updatedUser.bio || "",
          phone: updatedUser.phone || "",
          matricula: updatedUser.matricula || "",
          especialidad: updatedUser.especialidad || "",
          professionalRole: updatedUser.professionalRole || "",
          notificationPreferences: notificationPrefs,
        });
      } catch (err: any) {
        if (err.message === "UNAUTHORIZED") {
          return sendError(reply, 401, "No autorizado", "unauthorized");
        }

        // Handle Prisma unique constraint errors
        if (err.code === "P2002") {
          return sendError(
            reply,
            400,
            "El email ya está en uso",
            "email_taken",
            { email: ["Este email ya está registrado"] },
          );
        }

        return sendError(reply, 500, "Error al actualizar perfil", "internal_error");
      }
    },
  );

  // ── Tenant Profile ──────────────────────────────────────────────────────────

  // GET /api/user/tenant — Obtener datos del estudio
  app.get("/api/user/tenant", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = requireAuth(request);
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { tenantId: true },
      });

      if (!dbUser?.tenantId) {
        return sendError(reply, 404, "No tenés un estudio configurado", "no_tenant");
      }

      const tenant = await (prisma as any).tenant.findUnique({
        where: { id: dbUser.tenantId },
        select: { id: true, name: true, cuit: true, address: true, phone: true, website: true, logoUrl: true },
      });

      if (!tenant) {
        return sendError(reply, 404, "Estudio no encontrado", "tenant_not_found");
      }

      return sendSuccess(reply, "Estudio obtenido exitosamente", {
        id: tenant.id,
        name: tenant.name || "",
        cuit: tenant.cuit || "",
        address: tenant.address || "",
        phone: tenant.phone || "",
        website: tenant.website || "",
        logoUrl: tenant.logoUrl || null,
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return sendError(reply, 401, "No autorizado", "unauthorized");
      }
      return sendError(reply, 500, "Error al obtener datos del estudio", "internal_error");
    }
  });

  // PATCH /api/user/tenant — Actualizar datos del estudio
  const UpdateTenantSchema = z.object({
    name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
    cuit: z.string().max(20).optional().nullable(),
    address: z.string().max(300).optional().nullable(),
    phone: z.string().max(30).optional().nullable(),
    website: z.string().url("URL inválida").optional().nullable().or(z.literal("")),
  });

  app.patch("/api/user/tenant", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = requireAuth(request);
      const parsed = UpdateTenantSchema.safeParse(request.body);

      if (!parsed.success) {
        return sendError(reply, 400, "Datos inválidos", "invalid_body",
          parsed.error.flatten().fieldErrors as any);
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { tenantId: true },
      });

      if (!dbUser?.tenantId) {
        return sendError(reply, 404, "No tenés un estudio configurado", "no_tenant");
      }

      const updateData: any = {};
      if (parsed.data.name !== undefined) updateData.name = parsed.data.name.trim();
      if (parsed.data.cuit !== undefined) updateData.cuit = parsed.data.cuit;
      if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
      if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
      if (parsed.data.website !== undefined) updateData.website = parsed.data.website || null;

      const updated = await (prisma as any).tenant.update({
        where: { id: dbUser.tenantId },
        data: updateData,
        select: { id: true, name: true, cuit: true, address: true, phone: true, website: true, logoUrl: true },
      });

      return sendSuccess(reply, "Datos del estudio actualizados", {
        id: updated.id,
        name: updated.name || "",
        cuit: updated.cuit || "",
        address: updated.address || "",
        phone: updated.phone || "",
        website: updated.website || "",
        logoUrl: updated.logoUrl || null,
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return sendError(reply, 401, "No autorizado", "unauthorized");
      }
      return sendError(reply, 500, "Error al actualizar el estudio", "internal_error");
    }
  });

  // POST /api/user/tenant/logo — Subir o reemplazar el logo del estudio
  app.post("/api/user/tenant/logo", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = requireAuth(request);

      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { tenantId: true },
      });

      if (!dbUser?.tenantId) {
        return sendError(reply, 404, "No tenés un estudio configurado", "no_tenant");
      }

      // Recibir el archivo vía multipart
      const data = await request.file();
      if (!data) {
        return sendError(reply, 400, "No se recibió ningún archivo", "no_file");
      }

      // Validar tipo MIME
      const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/svg+xml"];
      if (!allowedMimeTypes.includes(data.mimetype)) {
        return sendError(reply, 400, "Formato no soportado. Usá PNG, JPG o WebP.", "invalid_type");
      }

      // Leer el buffer del archivo
      const buffer = await data.toBuffer();

      // Validar tamaño máximo: 500KB
      const MAX_SIZE = 512 * 1024;
      if (buffer.length > MAX_SIZE) {
        return sendError(reply, 400, "El logo no puede superar 500KB", "file_too_large");
      }

      // Convertir a base64 data URI para almacenamiento en DB
      const base64 = buffer.toString("base64");
      const logoUrl = `data:${data.mimetype};base64,${base64}`;

      // Guardar en DB
      const updated = await (prisma as any).tenant.update({
        where: { id: dbUser.tenantId },
        data: { logoUrl },
        select: { id: true, logoUrl: true },
      });

      return sendSuccess(reply, "Logo actualizado exitosamente", {
        logoUrl: updated.logoUrl,
      });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return sendError(reply, 401, "No autorizado", "unauthorized");
      }
      app.log.error(err, "[api] Error uploading tenant logo");
      return sendError(reply, 500, "Error al subir el logo", "internal_error");
    }
  });

  // DELETE /api/user/tenant/logo — Eliminar el logo del estudio
  app.delete("/api/user/tenant/logo", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const user = requireAuth(request);

      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { tenantId: true },
      });

      if (!dbUser?.tenantId) {
        return sendError(reply, 404, "No tenés un estudio configurado", "no_tenant");
      }

      await (prisma as any).tenant.update({
        where: { id: dbUser.tenantId },
        data: { logoUrl: null },
      });

      return sendSuccess(reply, "Logo eliminado exitosamente", { logoUrl: null });
    } catch (err: any) {
      if (err.message === "UNAUTHORIZED") {
        return sendError(reply, 401, "No autorizado", "unauthorized");
      }
      return sendError(reply, 500, "Error al eliminar el logo", "internal_error");
    }
  });

  // ── Onboarding ──────────────────────────────────────────────────────────────

  app.patch<{ Body: CompleteOnboardingBody }>(
    "/api/user/onboarding",
    async (request: FastifyRequest<{ Body: CompleteOnboardingBody }>, reply: FastifyReply) => {
      try {
        const authUser = requireAuth(request);
        const bodyParsed = CompleteOnboardingSchema.safeParse(request.body);

        if (!bodyParsed.success) {
          return sendError(
            reply,
            400,
            "Datos inválidos",
            "invalid_body",
            bodyParsed.error.flatten().fieldErrors as any,
          );
        }

        const result = await prisma.$transaction(async (tx) => {
          const currentUser = await tx.user.findUnique({
            where: { id: authUser.userId },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              tenantId: true,
              tenant: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          });

          if (!currentUser) {
            throw new Error("USER_NOT_FOUND");
          }

          if (currentUser.tenantId) {
            return {
              alreadyCompleted: true,
              user: {
                id: currentUser.id,
                email: currentUser.email,
                name: currentUser.name,
                role: currentUser.role,
                tenantId: currentUser.tenantId,
              },
              tenant: currentUser.tenant,
            };
          }

          const tenant = await tx.tenant.create({
            data: {
              name: bodyParsed.data.company.trim(),
            },
          });

          const parsedName = splitDisplayName(bodyParsed.data.name);
          const updatedUser = await tx.user.update({
            where: { id: currentUser.id },
            data: {
              name: bodyParsed.data.name.trim(),
              firstName: parsedName.firstName || null,
              lastName: parsedName.lastName || null,
              company: bodyParsed.data.company.trim(),
              professionalRole: bodyParsed.data.professionalRole?.trim() || null,
              tenantId: tenant.id,
            },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              tenantId: true,
            },
          });

          // ── Código promocional (opcional) ─────────────────────────────────
          let promoResult: { applied: boolean; planCode?: string; trialDays?: number; warning?: string } = { applied: false };

          const rawCode = bodyParsed.data.promoCode?.trim().toUpperCase();
          if (rawCode) {
            const promo = await (tx as any).promoCode.findUnique({ where: { code: rawCode } });

            if (!promo) {
              promoResult = { applied: false, warning: "Código promocional inválido." };
            } else if (!promo.isActive) {
              promoResult = { applied: false, warning: "El código promocional ya no está activo." };
            } else if (promo.expiresAt && promo.expiresAt < new Date()) {
              promoResult = { applied: false, warning: "El código promocional está vencido." };
            } else if (promo.maxUses !== -1 && promo.usedCount >= promo.maxUses) {
              promoResult = { applied: false, warning: "El código promocional ya alcanzó su límite de usos." };
            } else {
              // Buscar el plan a activar
              const plan = await (tx as any).plan.findUnique({ where: { code: promo.planCode } });
              if (!plan) {
                promoResult = { applied: false, warning: "Error interno con el código (plan no encontrado)." };
              } else {
                const trialEndsAt = new Date(Date.now() + promo.trialDays * 24 * 60 * 60 * 1000);

                // Crear suscripción trial
                await (tx as any).subscription.create({
                  data: {
                    tenantId: tenant.id,
                    planId: plan.id,
                    status: "trialing",
                    trialEndsAt,
                    startsAt: new Date(),
                    renewsAt: null,
                    maxUsers: 1,
                  },
                });

                // Actualizar plan del tenant
                await (tx as any).tenant.update({
                  where: { id: tenant.id },
                  data: { currentPlanCode: promo.planCode },
                });

                // Registrar uso y aumentar contador
                await (tx as any).promoCodeUse.create({
                  data: { promoCodeId: promo.id, tenantId: tenant.id },
                });
                await (tx as any).promoCode.update({
                  where: { id: promo.id },
                  data: { usedCount: { increment: 1 } },
                });

                promoResult = { applied: true, planCode: promo.planCode, trialDays: promo.trialDays };
              }
            }
          }

          return {
            alreadyCompleted: false,
            user: updatedUser,
            tenant: {
              id: tenant.id,
              name: tenant.name,
            },
            promo: promoResult,
          };
        });

        return sendSuccess(reply, "Onboarding completado", result);
      } catch (err: any) {
        if (err.message === "UNAUTHORIZED") {
          return sendError(reply, 401, "No autorizado", "unauthorized");
        }

        if (err.message === "USER_NOT_FOUND") {
          return sendError(reply, 404, "Usuario no encontrado", "user_not_found");
        }

        return sendError(reply, 500, "Error al completar onboarding", "internal_error");
      }
    },
  );

  // POST /api/user/change-password — Cambio de contraseña
  app.post(
    "/api/user/change-password",
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const authUser = requireAuth(request);

        const ChangePasswordSchema = z.object({
          currentPassword: z.string().min(1, "La contraseña actual es requerida"),
          newPassword: z
            .string()
            .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
            .regex(/[a-z]/, "Debe contener al menos una letra minúscula")
            .regex(/[A-Z]/, "Debe contener al menos una letra mayúscula")
            .regex(/\d/, "Debe contener al menos un número"),
        });

        const parsed = ChangePasswordSchema.safeParse(request.body);
        if (!parsed.success) {
          return sendError(
            reply,
            400,
            "Datos inválidos",
            "validation_error",
            parsed.error.flatten().fieldErrors as Record<string, string[]>,
          );
        }

        const { currentPassword, newPassword } = parsed.data;

        const dbUser = await prisma.user.findUnique({
          where: { id: authUser.userId },
          select: { id: true, passwordHash: true },
        });

        if (!dbUser) {
          return sendError(reply, 404, "Usuario no encontrado", "user_not_found");
        }

        // Usuarios que sólo usan OAuth no tienen contraseña
        if (!dbUser.passwordHash) {
          return sendError(
            reply,
            400,
            "Tu cuenta no tiene contraseña configurada (usás Google u otro proveedor).",
            "no_password",
          );
        }

        const isValid = await bcrypt.compare(currentPassword, dbUser.passwordHash);
        if (!isValid) {
          return sendError(reply, 400, "La contraseña actual es incorrecta.", "invalid_current_password");
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
          where: { id: authUser.userId },
          data: { passwordHash: newHash },
        });

        return sendSuccess(reply, "Contraseña actualizada correctamente");
      } catch (err: any) {
        if (err.message === "UNAUTHORIZED") {
          return sendError(reply, 401, "No autorizado", "unauthorized");
        }
        return sendError(reply, 500, "Error al cambiar la contraseña", "internal_error");
      }
    },
  );
}

