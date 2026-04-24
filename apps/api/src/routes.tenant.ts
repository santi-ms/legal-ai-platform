/**
 * Tenant Routes — acciones sobre el tenant completo
 *
 * GET /tenant/export — Descarga completa de los datos del tenant en JSON.
 *                      Solo administradores. Pensado para portabilidad/compliance
 *                      ("derecho de acceso" de Ley 25.326 / GDPR-like).
 *
 * Exporta la metadata y el contenido editable. Los PDFs binarios y las
 * credenciales (portales, MP) se excluyen a propósito — el primero por
 * tamaño/ancho de banda, el segundo por seguridad.
 */

import { FastifyInstance } from "fastify";
import { prisma } from "./db.js";
import { getUserFromRequest } from "./utils/auth.js";
import { auditLog } from "./services/audit-log.js";

export async function registerTenantRoutes(app: FastifyInstance) {
  // GET /tenant/export — export JSON completo. Rate-limit bajo: 2/día.
  app.get(
    "/tenant/export",
    {
      config: {
        rateLimit: {
          max: 2,
          timeWindow: 24 * 60 * 60 * 1000,
          errorResponseBuilder: () => ({
            ok: false,
            error: "too_many_requests",
            message: "Alcanzaste el límite de exportaciones por día. Intentá de nuevo mañana.",
          }),
        },
      },
    },
    async (request, reply) => {
      const user = getUserFromRequest(request);
      if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
      if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
      if (user.role !== "admin") {
        return reply.status(403).send({
          ok: false,
          error: "FORBIDDEN",
          message: "Solo el administrador del estudio puede exportar todos los datos.",
        });
      }

      const tenantId = user.tenantId;

      const [
        tenant,
        users,
        clients,
        expedientes,
        actuaciones,
        documents,
        documentVersions,
        documentAnnotations,
        documentShares,
        referenceDocuments,
        honorarios,
        vencimientos,
        jurisConsultas,
        jurisMensajes,
        escritosAnalisis,
        contractAnalyses,
        clientPortalAccesses,
        teamInvitations,
        subscription,
        invoices,
        auditLogs,
      ] = await Promise.all([
        prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            id: true, name: true, cuit: true, phone: true, address: true,
            logoUrl: true, currentPlanCode: true,
            createdAt: true, updatedAt: true,
          },
        }),
        prisma.user.findMany({
          where: { tenantId },
          select: {
            id: true, email: true, name: true, role: true,
            matricula: true, especialidad: true, bio: true, phone: true,
            emailVerified: true, createdAt: true,
            // explicit: NO passwordHash, NO verification code, NO sessions
          },
        }),
        prisma.client.findMany({ where: { tenantId } }),
        prisma.expediente.findMany({ where: { tenantId } }),
        prisma.actuacion.findMany({ where: { tenantId } }),
        prisma.document.findMany({ where: { tenantId } }),
        prisma.documentVersion.findMany({
          where: { document: { tenantId } },
        }),
        prisma.documentAnnotation.findMany({ where: { tenantId } }),
        prisma.documentShare.findMany({ where: { tenantId } }),
        prisma.referenceDocument.findMany({
          where: { tenantId, deletedAt: null },
        }),
        prisma.honorario.findMany({ where: { tenantId } }),
        prisma.vencimiento.findMany({ where: { tenantId } }),
        prisma.jurisConsulta.findMany({ where: { tenantId, deletedAt: null } }),
        prisma.jurisMensaje.findMany({
          where: { consulta: { tenantId } },
        }),
        prisma.escritoAnalisis.findMany({ where: { tenantId, deletedAt: null } }),
        prisma.contractAnalysis.findMany({ where: { tenantId } }),
        prisma.clientPortalAccess.findMany({ where: { tenantId } }),
        prisma.teamInvitation.findMany({ where: { tenantId } }),
        prisma.subscription.findUnique({
          where: { tenantId },
          include: { plan: { select: { code: true, name: true } } },
        }),
        prisma.invoice.findMany({
          where: { subscription: { tenantId } },
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.findMany({
          where: { tenantId },
          orderBy: { createdAt: "desc" },
          take: 2000, // cap — audit log puede crecer mucho
        }),
      ]);

      await auditLog({
        tenantId,
        userId: user.userId,
        action: "tenant.export",
        resourceType: "Tenant",
        resourceId: tenantId,
        request,
      });

      // Nombre de archivo sugerido para descarga directa
      const dateStr = new Date().toISOString().slice(0, 10);
      const filename = `doculex-export-${dateStr}.json`;
      reply.header("Content-Disposition", `attachment; filename="${filename}"`);
      reply.header("Content-Type", "application/json; charset=utf-8");

      return reply.send({
        ok: true,
        exportedAt: new Date().toISOString(),
        schemaVersion: 1,
        note:
          "Este archivo contiene tus datos del estudio en formato JSON. " +
          "Los archivos PDF originales no están incluidos — se pueden descargar " +
          "uno a uno desde la app. Las credenciales de portales y de pago quedan " +
          "fuera por seguridad.",
        tenant,
        users,
        subscription,
        invoices,
        clients,
        expedientes,
        actuaciones,
        documents,
        documentVersions,
        documentAnnotations,
        documentShares,
        referenceDocuments,
        honorarios,
        vencimientos,
        jurisConsultas,
        jurisMensajes,
        escritosAnalisis,
        contractAnalyses,
        clientPortalAccesses,
        teamInvitations,
        auditLogs,
        counts: {
          users: users.length,
          clients: clients.length,
          expedientes: expedientes.length,
          actuaciones: actuaciones.length,
          documents: documents.length,
          documentVersions: documentVersions.length,
          documentAnnotations: documentAnnotations.length,
          documentShares: documentShares.length,
          referenceDocuments: referenceDocuments.length,
          honorarios: honorarios.length,
          vencimientos: vencimientos.length,
          jurisConsultas: jurisConsultas.length,
          jurisMensajes: jurisMensajes.length,
          escritosAnalisis: escritosAnalisis.length,
          contractAnalyses: contractAnalyses.length,
          clientPortalAccesses: clientPortalAccesses.length,
          teamInvitations: teamInvitations.length,
          invoices: invoices.length,
          auditLogs: auditLogs.length,
        },
      });
    },
  );
}
