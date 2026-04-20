/**
 * Portal Judicial — routes (multi-portal)
 *
 * Todos los endpoints aceptan ?portal=<id> como query param.
 * Si se omite, usa el primer portal activo o "justi_misiones" por defecto.
 *
 * Portales válidos: justi_misiones, iurix_corrientes, mev_scba, pjn
 *
 * GET    /portal/config                          lista todos los portales configurados
 * PUT    /portal/config                          guarda/actualiza credenciales (body: portal, username, password)
 * DELETE /portal/config?portal=X                elimina credenciales de un portal
 * POST   /portal/config/test                     prueba credenciales sin guardar
 * POST   /portal/sync                            trigger sync manual (todos los portales activos)
 * GET    /portal/logs                            logs de sync (todos los portales)
 * GET    /portal/expedientes                     expedientes con datos del portal
 * PATCH  /portal/expedientes/:id/toggle-sync
 * PATCH  /portal/expedientes/:id/dismiss-activity
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";
import { encrypt } from "./utils/encryption.js";
import { syncTenant, testPortalCredentials } from "./services/portal-sync-service.js";
import { logger } from "./utils/logger.js";

// ─── Portales válidos ─────────────────────────────────────────────────────────

export const VALID_PORTALS = ["justi_misiones", "iurix_corrientes", "mev_scba", "pjn"] as const;
export type PortalId = typeof VALID_PORTALS[number];

const PORTAL_LABELS: Record<string, string> = {
  justi_misiones:   "JUSTI — Poder Judicial de Misiones",
  iurix_corrientes: "IURIX — Poder Judicial de Corrientes",
  mev_scba:         "MEV SCBA — Suprema Corte de Buenos Aires",
  pjn:              "PJN — Poder Judicial de la Nación",
};

export async function registerPortalRoutes(app: FastifyInstance) {

  // ── GET /portal/config ────────────────────────────────────────────────────
  // Devuelve todos los portales: los que están configurados + los disponibles
  app.get("/portal/config", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const creds = await prisma.portalCredential.findMany({
      where: { tenantId: user.tenantId },
      select: {
        id: true, portal: true, username: true,
        isActive: true, lastValidAt: true, lastError: true,
        createdAt: true, updatedAt: true,
      },
    });

    const lastLogs = await prisma.portalSyncLog.findMany({
      where:   { tenantId: user.tenantId },
      orderBy: { startedAt: "desc" },
      take:    20,
      select:  {
        id: true, portal: true, status: true, trigger: true,
        startedAt: true, finishedAt: true,
        expedientesChecked: true, expedientesUpdated: true, errorMessage: true,
      },
    });

    // Map last sync per portal
    const lastSyncByPortal: Record<string, any> = {};
    for (const log of lastLogs) {
      if (!lastSyncByPortal[log.portal]) lastSyncByPortal[log.portal] = log;
    }

    // Build portal list
    const portals = VALID_PORTALS.map(portalId => ({
      portalId,
      label:      PORTAL_LABELS[portalId] ?? portalId,
      credential: creds.find(c => c.portal === portalId) ?? null,
      lastSync:   lastSyncByPortal[portalId] ?? null,
    }));

    // Backward compat: single "credential" + "lastSync" for legacy usage
    const primaryCred = creds[0] ?? null;
    const primaryLog  = lastLogs[0] ?? null;

    return reply.send({
      ok: true,
      portals,
      credential: primaryCred,
      lastSync:   primaryLog,
    });
  });

  // ── PUT /portal/config ────────────────────────────────────────────────────
  app.put("/portal/config", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const schema = z.object({
      portal:   z.string().default("justi_misiones"),
      username: z.string().min(1, "Usuario requerido"),
      password: z.string().min(1, "Contraseña requerida"),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", issues: parsed.error.issues });
    }
    const { portal, username, password } = parsed.data;

    if (!process.env.PORTAL_ENCRYPTION_KEY) {
      return reply.status(500).send({
        ok: false, error: "CONFIG_ERROR",
        message: "El servidor no tiene configurada la clave de cifrado. Contactar al soporte.",
      });
    }

    let passwordEnc: string;
    try {
      passwordEnc = encrypt(password);
    } catch (err: any) {
      return reply.status(500).send({ ok: false, error: "ENCRYPTION_ERROR", message: err?.message });
    }

    const existing = await prisma.portalCredential.findUnique({
      where: { tenantId_portal: { tenantId: user.tenantId, portal } },
    });

    const cred = existing
      ? await prisma.portalCredential.update({
          where: { id: existing.id },
          data:  { username, passwordEnc, isActive: true, lastError: null, updatedAt: new Date() },
        })
      : await prisma.portalCredential.create({
          data: { tenantId: user.tenantId, portal, username, passwordEnc, isActive: true },
        });

    return reply.send({
      ok: true,
      credential: { id: cred.id, portal: cred.portal, username: cred.username, isActive: cred.isActive },
    });
  });

  // ── DELETE /portal/config?portal=X ───────────────────────────────────────
  app.delete("/portal/config", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const q = request.query as { portal?: string };
    const portal = q.portal || "justi_misiones";

    const cred = await prisma.portalCredential.findUnique({
      where: { tenantId_portal: { tenantId: user.tenantId, portal } },
    });
    if (!cred) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    await prisma.portalCredential.delete({ where: { id: cred.id } });
    return reply.send({ ok: true });
  });

  // ── POST /portal/config/test ──────────────────────────────────────────────
  app.post("/portal/config/test", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const schema = z.object({
      portal:   z.string().default("justi_misiones"),
      username: z.string().min(1),
      password: z.string().min(1),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR" });
    }

    const { portal, username, password } = parsed.data;
    const portalLabel = PORTAL_LABELS[portal] ?? portal;

    const { valid, error } = await testPortalCredentials(portal, username, password);

    if (valid) {
      return reply.send({ ok: true, message: `Conexión exitosa con ${portalLabel}.` });
    } else {
      return reply.send({
        ok: false, error: "INVALID_CREDENTIALS",
        message: error ?? `Credenciales inválidas o portal ${portalLabel} no disponible.`,
      });
    }
  });

  // ── POST /portal/sync ─────────────────────────────────────────────────────
  app.post("/portal/sync", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const creds = await prisma.portalCredential.findMany({
      where: { tenantId: user.tenantId, isActive: true },
    });
    if (creds.length === 0) {
      return reply.status(400).send({
        ok: false, error: "NO_CREDENTIALS",
        message: "Configurá primero las credenciales de al menos un portal judicial.",
      });
    }

    reply.status(202).send({ ok: true, message: `Sincronización iniciada (${creds.length} portal${creds.length !== 1 ? "es" : ""}).` });

    setImmediate(async () => {
      try {
        await syncTenant(user.tenantId!, "manual");
      } catch (err: any) {
        logger.error("[portal] Error en sync manual", { tenantId: user.tenantId, error: err?.message });
      }
    });
  });

  // ── GET /portal/logs ──────────────────────────────────────────────────────
  app.get("/portal/logs", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const q = request.query as { limit?: string; portal?: string };
    const limit = Math.min(50, parseInt(q.limit ?? "20"));
    const where: any = { tenantId: user.tenantId };
    if (q.portal) where.portal = q.portal;

    const logs = await prisma.portalSyncLog.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take:    limit,
      select:  {
        id: true, portal: true, status: true, trigger: true,
        startedAt: true, finishedAt: true,
        expedientesChecked: true, expedientesUpdated: true, errorMessage: true,
      },
    });

    return reply.send({ ok: true, logs });
  });

  // ── GET /portal/expedientes ───────────────────────────────────────────────
  app.get("/portal/expedientes", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const q = request.query as { page?: string; pageSize?: string; syncOnly?: string };
    const page     = Math.max(1, parseInt(q.page     ?? "1"));
    const pageSize = Math.min(50, parseInt(q.pageSize ?? "30"));
    const syncOnly = q.syncOnly === "true";

    const where: any = { tenantId: user.tenantId };
    if (syncOnly) where.portalSyncEnabled = true;

    const [total, items] = await Promise.all([
      prisma.expediente.count({ where }),
      prisma.expediente.findMany({
        where,
        orderBy: [{ portalNewActivity: "desc" }, { updatedAt: "desc" }],
        skip:    (page - 1) * pageSize,
        take:    pageSize,
        select: {
          id: true, number: true, title: true, matter: true, status: true, court: true,
          portalSyncEnabled: true, portalId: true, portalStatus: true,
          portalLastSync: true, portalLastMovimiento: true,
          portalMovimientoAt: true, portalNewActivity: true,
          client: { select: { id: true, name: true } },
        },
      }),
    ]);

    return reply.send({ ok: true, items, total, page, pageSize });
  });

  // ── PATCH /portal/expedientes/:id/toggle-sync ─────────────────────────────
  app.patch("/portal/expedientes/:id/toggle-sync", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id }     = request.params as { id: string };
    const { enabled } = request.body as { enabled: boolean };

    const exp = await prisma.expediente.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!exp) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    await prisma.expediente.update({ where: { id }, data: { portalSyncEnabled: Boolean(enabled) } });
    return reply.send({ ok: true, portalSyncEnabled: Boolean(enabled) });
  });

  // ── PATCH /portal/expedientes/:id/dismiss-activity ───────────────────────
  app.patch("/portal/expedientes/:id/dismiss-activity", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const exp = await prisma.expediente.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!exp) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    await prisma.expediente.update({ where: { id }, data: { portalNewActivity: false } });
    return reply.send({ ok: true });
  });
}
