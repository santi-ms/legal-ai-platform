/**
 * Portal del Cliente — magic-link read-only access
 *
 * PRIVATE (JWT required — abogado):
 *   POST   /client-portal/links             — generate magic link
 *   GET    /client-portal/links             — list links for tenant
 *   GET    /client-portal/links/:id         — get single link
 *   PATCH  /client-portal/links/:id/revoke  — revoke link
 *   DELETE /client-portal/links/:id         — delete link
 *
 * PUBLIC (no auth — cliente accede desde el link):
 *   GET    /public/client-portal/:token     — fetch portal data
 */

import { FastifyInstance } from "fastify";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";
import { logger } from "./utils/logger.js";

const DEFAULT_EXPIRY_DAYS = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function maskToken(token: string): string {
  return token.slice(0, 8) + "..." + token.slice(-4);
}

export async function registerClientPortalRoutes(app: FastifyInstance) {

  // ── POST /client-portal/links ─────────────────────────────────────────────
  app.post("/client-portal/links", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const schema = z.object({
      clientId:       z.string().uuid(),
      expedienteId:   z.string().uuid().optional().nullable(),
      showDocuments:  z.boolean().default(true),
      showHonorarios: z.boolean().default(false),
      showMovimientos:z.boolean().default(true),
      message:        z.string().max(500).optional().nullable(),
      expiryDays:     z.number().int().min(1).max(365).default(DEFAULT_EXPIRY_DAYS),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", issues: parsed.error.issues });
    }
    const { clientId, expedienteId, showDocuments, showHonorarios, showMovimientos, message, expiryDays } = parsed.data;

    // Verificar que el cliente pertenece al tenant
    const client = await prisma.client.findFirst({ where: { id: clientId, tenantId: user.tenantId } });
    if (!client) return reply.status(404).send({ ok: false, error: "CLIENT_NOT_FOUND" });

    // Verificar expediente si se especificó
    if (expedienteId) {
      const exp = await prisma.expediente.findFirst({ where: { id: expedienteId, tenantId: user.tenantId } });
      if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = addDays(new Date(), expiryDays);

    const link = await prisma.clientPortalAccess.create({
      data: {
        tenantId:        user.tenantId,
        clientId,
        createdById:     user.userId,
        expedienteId:    expedienteId || null,
        token,
        showDocuments,
        showHonorarios,
        showMovimientos,
        message:         message || null,
        status:          "active",
        expiresAt,
      },
    });

    const portalUrl = `${process.env.FRONTEND_URL || ""}/portal/cliente/${token}`;

    return reply.status(201).send({
      ok: true,
      link: {
        id:            link.id,
        token:         link.token,
        tokenMasked:   maskToken(link.token),
        portalUrl,
        clientId:      link.clientId,
        expedienteId:  link.expedienteId,
        showDocuments: link.showDocuments,
        showHonorarios:link.showHonorarios,
        showMovimientos:link.showMovimientos,
        message:       link.message,
        status:        link.status,
        expiresAt:     link.expiresAt,
        viewCount:     link.viewCount,
        createdAt:     link.createdAt,
      },
    });
  });

  // ── GET /client-portal/links ──────────────────────────────────────────────
  app.get("/client-portal/links", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const q = request.query as { clientId?: string; status?: string };
    const where: any = { tenantId: user.tenantId };
    if (q.clientId) where.clientId = q.clientId;
    if (q.status)   where.status   = q.status;

    const links = await prisma.clientPortalAccess.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        client:      { select: { id: true, name: true, type: true } },
        expediente:  { select: { id: true, title: true, number: true } },
        createdBy:   { select: { firstName: true, lastName: true, email: true } },
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || "";
    const enriched = links.map((l) => ({
      ...l,
      tokenMasked: maskToken(l.token),
      portalUrl:   `${frontendUrl}/portal/cliente/${l.token}`,
    }));

    return reply.send({ ok: true, links: enriched });
  });

  // ── GET /client-portal/links/:id ────────────────────────────────────────��─
  app.get("/client-portal/links/:id", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const link = await prisma.clientPortalAccess.findFirst({
      where: { id, tenantId: user.tenantId },
      include: {
        client:     { select: { id: true, name: true, type: true } },
        expediente: { select: { id: true, title: true, number: true } },
      },
    });
    if (!link) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    const portalUrl = `${process.env.FRONTEND_URL || ""}/portal/cliente/${link.token}`;
    return reply.send({ ok: true, link: { ...link, portalUrl } });
  });

  // ── PATCH /client-portal/links/:id/revoke ────────────────────────────────
  app.patch("/client-portal/links/:id/revoke", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const revoked = await prisma.clientPortalAccess.updateMany({
      where: { id, tenantId: user.tenantId },
      data:  { status: "revoked", updatedAt: new Date() },
    });
    if (revoked.count === 0) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
    return reply.send({ ok: true });
  });

  // ── DELETE /client-portal/links/:id ──────────────────────────────────────
  app.delete("/client-portal/links/:id", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const deleted = await prisma.clientPortalAccess.deleteMany({
      where: { id, tenantId: user.tenantId },
    });
    if (deleted.count === 0) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
    return reply.send({ ok: true });
  });

  // ── GET /public/client-portal/:token  (PUBLIC — sin auth) ─────────────────
  app.get("/public/client-portal/:token", async (request, reply) => {
    const { token } = request.params as { token: string };

    const link = await prisma.clientPortalAccess.findUnique({
      where: { token },
      include: {
        tenant: {
          select: { id: true, name: true, phone: true, address: true, logoUrl: true },
        },
        client: {
          select: {
            id: true, name: true, type: true, email: true, phone: true,
            documentType: true, documentNumber: true, city: true, province: true,
          },
        },
        createdBy: {
          select: { firstName: true, lastName: true, email: true, phone: true },
        },
        expediente: {
          select: { id: true, title: true, number: true, matter: true, status: true },
        },
      },
    });

    if (!link) return reply.status(404).send({ ok: false, error: "NOT_FOUND", message: "Link no encontrado." });
    if (link.status === "revoked") return reply.status(410).send({ ok: false, error: "REVOKED", message: "Este link fue revocado por el estudio." });
    if (new Date() > link.expiresAt) return reply.status(410).send({ ok: false, error: "EXPIRED", message: "Este link de acceso ha expirado." });

    // Registrar visita en background
    setImmediate(async () => {
      try {
        await prisma.clientPortalAccess.update({
          where: { id: link.id },
          data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
        });
      } catch { /* non-blocking */ }
    });

    // Expedientes del cliente
    const expWhere: any = { clientId: link.clientId, tenantId: link.tenantId };
    if (link.expedienteId) expWhere.id = link.expedienteId;

    const expedientes = await prisma.expediente.findMany({
      where: expWhere,
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true, number: true, title: true, matter: true, status: true,
        court: true, judge: true, deadline: true, openedAt: true,
        portalLastMovimiento: true, portalMovimientoAt: true, portalStatus: true, portalLastSync: true,
      },
    });

    // Documentos (si showDocuments)
    let documents: any[] = [];
    if (link.showDocuments) {
      const expIds = expedientes.map((e) => e.id);
      const rawDocs = await prisma.document.findMany({
        where: {
          tenantId: link.tenantId,
          clientId: link.clientId,
          ...(expIds.length ? { expedienteId: { in: expIds } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true, type: true, createdAt: true,
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
            select: { status: true, pdfUrl: true, createdAt: true },
          },
        },
      });
      // Solo mostrar docs con PDF disponible y estado no error
      documents = rawDocs
        .filter((d) => d.versions[0]?.pdfUrl && d.versions[0]?.status !== "error")
        .map((d) => ({
          id: d.id,
          type: d.type,
          createdAt: d.createdAt,
          status: d.versions[0]?.status,
          pdfUrl: d.versions[0]?.pdfUrl,
        }));
    }

    // Honorarios (si showHonorarios)
    let honorarios: any[] = [];
    if (link.showHonorarios) {
      honorarios = await prisma.honorario.findMany({
        where: {
          tenantId: link.tenantId,
          clientId: link.clientId,
          estado:   { in: ["presupuestado", "facturado"] }, // solo pendientes
        },
        orderBy: { fechaEmision: "desc" },
        take: 20,
        select: {
          id: true, tipo: true, concepto: true, monto: true, moneda: true,
          estado: true, fechaEmision: true, fechaVencimiento: true,
        },
      });
    }

    return reply.send({
      ok: true,
      portal: {
        tenant:    { name: link.tenant.name, phone: link.tenant.phone, address: link.tenant.address, logoUrl: link.tenant.logoUrl },
        abogado:   { firstName: link.createdBy.firstName, lastName: link.createdBy.lastName, email: link.createdBy.email, phone: link.createdBy.phone },
        client:    link.client,
        message:   link.message,
        expiresAt: link.expiresAt,
        config:    { showDocuments: link.showDocuments, showHonorarios: link.showHonorarios, showMovimientos: link.showMovimientos },
        expedientes,
        documents,
        honorarios,
      },
    });
  });
}
