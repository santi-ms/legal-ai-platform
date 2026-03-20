/**
 * User Profile Routes
 * 
 * Endpoints for managing user profile and preferences.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { z } from "zod";
import { requireAuth } from "./utils/auth.js";
import { prisma } from "./db.js";

// Schema for profile update
const UpdateProfileSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  email: z.string().email("Email inválido").optional(),
  bio: z.string().max(1000, "La biografía no puede exceder 1000 caracteres").optional().nullable(),
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
          notificationPreferences: true,
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

          return {
            alreadyCompleted: false,
            user: updatedUser,
            tenant: {
              id: tenant.id,
              name: tenant.name,
            },
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
}

