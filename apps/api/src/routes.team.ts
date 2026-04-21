/**
 * Team Routes — Gestión de miembros del equipo (plan Estudio)
 *
 * GET    /team/members           — Listar miembros del tenant
 * POST   /team/invite            — Invitar a un nuevo miembro por email
 * DELETE /team/members/:userId   — Eliminar un miembro del equipo
 * GET    /team/invitations       — Listar invitaciones pendientes
 * DELETE /team/invitations/:id   — Cancelar una invitación pendiente
 *
 * Endpoints públicos (sin auth JWT — solo token de invitación):
 * GET  /team/invite/:token        — Ver info de la invitación (para la página de aceptar)
 * POST /team/invite/:token/accept — Aceptar invitación (crear cuenta o vincular existente)
 */

import { FastifyInstance } from "fastify";
import { createHash, randomBytes } from "crypto";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";
import {
  sendEmail,
  getTeamInvitationEmailHtml,
  getTeamInvitationEmailText,
} from "./services/email.js";
import { getPlanForTenant } from "./routes.billing.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function unauthorized(reply: any) {
  return reply
    .status(401)
    .send({ ok: false, error: "UNAUTHORIZED", message: "Autenticación requerida" });
}

function forbidden(reply: any, message = "Sin permisos") {
  return reply.status(403).send({ ok: false, error: "FORBIDDEN", message });
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const INVITE_EXPIRY_HOURS = 72;

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerTeamRoutes(app: FastifyInstance) {
  // ── GET /team/members ────────────────────────────────────────────────────────
  app.get("/team/members", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const members = await prisma.user.findMany({
      where: { tenantId: user.tenantId },
      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        professionalRole: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Obtener plan para saber cuántos slots quedan
    const { plan, subscription } = await getPlanForTenant(user.tenantId);
    const maxUsers = (plan?.limits as any)?.maxUsers ?? 1;

    return reply.send({
      ok: true,
      members,
      maxUsers,
      usedSlots: members.length,
      availableSlots: maxUsers === -1 ? null : Math.max(0, maxUsers - members.length),
    });
  });

  // ── POST /team/invite ────────────────────────────────────────────────────────
  app.post("/team/invite", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    // Solo admins pueden invitar
    if (user.role !== "admin") return forbidden(reply, "Solo administradores pueden invitar miembros");

    const { email } = request.body as { email: string };
    if (!email || !email.includes("@")) {
      return reply.status(400).send({ ok: false, error: "INVALID_EMAIL", message: "Email inválido" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verificar plan: solo Estudio puede tener múltiples usuarios
    const { plan } = await getPlanForTenant(user.tenantId);
    const maxUsers = (plan?.limits as any)?.maxUsers ?? 1;
    if (maxUsers === 1) {
      return reply.status(403).send({
        ok: false,
        error: "PLAN_NO_TEAM",
        message: "Tu plan actual no permite agregar miembros. Actualizá al plan Estudio.",
      });
    }

    // Verificar que no se supere el límite
    const currentMembers = await prisma.user.count({ where: { tenantId: user.tenantId } });
    if (maxUsers !== -1 && currentMembers >= maxUsers) {
      return reply.status(403).send({
        ok: false,
        error: "MAX_USERS_REACHED",
        message: `Tu plan permite máximo ${maxUsers} usuarios. Ya tenés ${currentMembers}.`,
      });
    }

    // Verificar que el email no sea ya miembro
    const existingMember = await prisma.user.findFirst({
      where: { email: normalizedEmail, tenantId: user.tenantId },
    });
    if (existingMember) {
      return reply.status(409).send({
        ok: false,
        error: "ALREADY_MEMBER",
        message: "Este usuario ya es miembro de tu equipo.",
      });
    }

    // Cancelar invitación pendiente anterior al mismo email (si existe)
    await prisma.teamInvitation.updateMany({
      where: { tenantId: user.tenantId, email: normalizedEmail, status: "pending" },
      data: { status: "canceled" },
    });

    // Crear nuevo token
    const token = randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + INVITE_EXPIRY_HOURS * 3_600_000);

    await prisma.teamInvitation.create({
      data: {
        tenantId: user.tenantId,
        invitedById: user.userId,
        email: normalizedEmail,
        tokenHash,
        expiresAt,
      },
    });

    // Obtener datos del invitador y del tenant
    const [inviter, tenant] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.userId },
        select: { name: true, firstName: true, lastName: true },
      }),
      prisma.tenant.findUnique({ where: { id: user.tenantId }, select: { name: true } }),
    ]);

    const inviterName =
      inviter?.firstName && inviter?.lastName
        ? `${inviter.firstName} ${inviter.lastName}`
        : inviter?.name ?? "Un miembro del equipo";

    const tenantName = tenant?.name ?? "tu equipo";
    const frontendUrl = process.env.FRONTEND_URL ?? "https://doculex.com.ar";
    const inviteUrl = `${frontendUrl}/invite/${token}`;

    // Enviar email
    try {
      await sendEmail({
        to: normalizedEmail,
        subject: `${inviterName} te invitó a unirte a ${tenantName} en DocuLex`,
        html: getTeamInvitationEmailHtml(inviterName, tenantName, inviteUrl, INVITE_EXPIRY_HOURS),
        text: getTeamInvitationEmailText(inviterName, tenantName, inviteUrl, INVITE_EXPIRY_HOURS),
      });
    } catch (err) {
      console.error("[team/invite] Error enviando email:", err);
      // No fallar si el email falla — la invitación ya fue creada
    }

    return reply.send({
      ok: true,
      message: `Invitación enviada a ${normalizedEmail}`,
      expiresAt,
    });
  });

  // ── DELETE /team/members/:userId ─────────────────────────────────────────────
  app.delete("/team/members/:userId", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    if (user.role !== "admin") return forbidden(reply, "Solo administradores pueden eliminar miembros");

    const { userId: targetId } = request.params as { userId: string };

    if (targetId === user.userId) {
      return reply.status(400).send({ ok: false, error: "CANT_REMOVE_SELF", message: "No podés eliminarte a vos mismo." });
    }

    // Defense in depth: updateMany con filtro por tenantId, evita desvincular
    // miembros de otro tenant aun si cambia la guarda anterior.
    const result = await prisma.user.updateMany({
      where: { id: targetId, tenantId: user.tenantId },
      data:  { tenantId: null },
    });
    if (result.count === 0) {
      return reply.status(404).send({ ok: false, error: "NOT_FOUND", message: "Usuario no encontrado en tu equipo." });
    }

    return reply.send({ ok: true, message: "Miembro eliminado del equipo." });
  });

  // ── GET /team/invitations ─────────────────────────────────────────────────────
  app.get("/team/invitations", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    // Marcar expiradas automáticamente
    await prisma.teamInvitation.updateMany({
      where: {
        tenantId: user.tenantId,
        status: "pending",
        expiresAt: { lt: new Date() },
      },
      data: { status: "expired" },
    });

    const invitations = await prisma.teamInvitation.findMany({
      where: { tenantId: user.tenantId, status: { in: ["pending", "accepted"] } },
      include: {
        invitedBy: { select: { name: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return reply.send({
      ok: true,
      invitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        status: inv.status,
        expiresAt: inv.expiresAt,
        acceptedAt: inv.acceptedAt,
        createdAt: inv.createdAt,
        invitedBy: inv.invitedBy,
      })),
    });
  });

  // ── DELETE /team/invitations/:id ──────────────────────────────────────────────
  app.delete("/team/invitations/:id", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
    if (user.role !== "admin") return forbidden(reply);

    const { id } = request.params as { id: string };

    const result = await prisma.teamInvitation.updateMany({
      where: { id, tenantId: user.tenantId },
      data:  { status: "canceled" },
    });
    if (result.count === 0) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    return reply.send({ ok: true, message: "Invitación cancelada." });
  });

  // ── GET /team/invite/:token — público ─────────────────────────────────────────
  app.get("/team/invite/:token", async (request, reply) => {
    const { token } = request.params as { token: string };
    const tokenHash = hashToken(token);

    const invitation = await prisma.teamInvitation.findUnique({
      where: { tokenHash },
      include: {
        tenant: { select: { name: true } },
        invitedBy: { select: { name: true, firstName: true, lastName: true } },
      },
    });

    if (!invitation) {
      return reply.status(404).send({ ok: false, error: "INVALID_TOKEN", message: "Invitación no válida" });
    }

    if (invitation.status !== "pending") {
      return reply.status(404).send({ ok: false, error: "INVALID_TOKEN", message: "Invitación no válida" });
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({ where: { tokenHash }, data: { status: "expired" } });
      return reply.status(404).send({ ok: false, error: "INVALID_TOKEN", message: "Invitación no válida" });
    }

    const inviterName =
      invitation.invitedBy.firstName && invitation.invitedBy.lastName
        ? `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`
        : invitation.invitedBy.name ?? "Un miembro del equipo";

    return reply.send({
      ok: true,
      invitation: {
        email: invitation.email,
        tenantName: invitation.tenant.name,
        inviterName,
        expiresAt: invitation.expiresAt,
      },
    });
  });

  // ── POST /team/invite/:token/accept — público ─────────────────────────────────
  // Acepta la invitación. El usuario puede:
  //   a) Ya tener cuenta → solo pasa su JWT → se vincula al tenant
  //   b) No tener cuenta → debe registrarse primero, luego volver y aceptar
  // En este endpoint asumimos que el usuario YA está autenticado (tiene JWT).
  app.post("/team/invite/:token/accept", async (request, reply) => {
    const { token } = request.params as { token: string };
    const tokenHash = hashToken(token);

    // El usuario DEBE estar autenticado para aceptar
    const authUser = getUserFromRequest(request);
    if (!authUser) return unauthorized(reply);

    const invitation = await prisma.teamInvitation.findUnique({
      where: { tokenHash },
      include: { tenant: true },
    });

    if (!invitation) {
      return reply.status(404).send({ ok: false, error: "INVALID_TOKEN" });
    }

    if (invitation.status !== "pending") {
      return reply.status(410).send({ ok: false, error: "INVITATION_USED", status: invitation.status });
    }

    if (invitation.expiresAt < new Date()) {
      await prisma.teamInvitation.update({ where: { tokenHash }, data: { status: "expired" } });
      return reply.status(410).send({ ok: false, error: "EXPIRED" });
    }

    // Verificar que el email coincide
    const currentUser = await prisma.user.findUnique({ where: { id: authUser.userId } });
    if (!currentUser) return unauthorized(reply);

    if (currentUser.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return reply.status(403).send({
        ok: false,
        error: "EMAIL_MISMATCH",
        message: `Esta invitación es para ${invitation.email}. Iniciá sesión con esa cuenta.`,
      });
    }

    // Verificar slots disponibles
    const memberCount = await prisma.user.count({ where: { tenantId: invitation.tenantId } });
    const { plan } = await getPlanForTenant(invitation.tenantId);
    const maxUsers = (plan?.limits as any)?.maxUsers ?? 1;

    if (maxUsers !== -1 && memberCount >= maxUsers) {
      return reply.status(403).send({
        ok: false,
        error: "MAX_USERS_REACHED",
        message: "El equipo ya alcanzó el límite de usuarios de su plan.",
      });
    }

    // Vincular usuario al tenant
    await prisma.user.update({
      where: { id: authUser.userId },
      data: { tenantId: invitation.tenantId },
    });

    // Marcar invitación como aceptada
    await prisma.teamInvitation.update({
      where: { tokenHash },
      data: { status: "accepted", acceptedAt: new Date(), acceptedById: authUser.userId },
    });

    return reply.send({
      ok: true,
      message: `¡Bienvenido al equipo ${invitation.tenant.name}!`,
      tenantId: invitation.tenantId,
      tenantName: invitation.tenant.name,
    });
  });
}
