/**
 * Portal Judicial — routes
 *
 * GET    /portal/config                          get credential status (no password)
 * PUT    /portal/config                          save/update credentials
 * DELETE /portal/config                          remove credentials
 * POST   /portal/config/test                     test credentials without saving
 * POST   /portal/sync                            trigger manual sync (all enabled expedientes)
 * GET    /portal/logs                            list recent sync logs
 * GET    /portal/expedientes                     list expedientes with portal data
 * PATCH  /portal/expedientes/:id/toggle-sync     enable/disable portal sync
 * PATCH  /portal/expedientes/:id/dismiss-activity dismiss "new activity" flag
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";
import { encrypt, decrypt } from "./utils/encryption.js";
import { testCredentials } from "./services/mev-scraper.js";
import { syncTenant } from "./services/portal-sync-service.js";
import { logger } from "./utils/logger.js";

export async function registerPortalRoutes(app: FastifyInstance) {

  // ── GET /portal/config ────────────────────────────────────────────────────
  app.get("/portal/config", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const cred = await prisma.portalCredential.findUnique({
      where: { tenantId_portal: { tenantId: user.tenantId, portal: "mev_misiones" } },
      select: {
        id: true, tenantId: true, portal: true, username: true,
        isActive: true, lastValidAt: true, lastError: true,
        createdAt: true, updatedAt: true,
        // passwordEnc NOT included
      },
    });

    // Último log de sync
    const lastLog = await prisma.portalSyncLog.findFirst({
      where:   { tenantId: user.tenantId, portal: "mev_misiones" },
      orderBy: { startedAt: "desc" },
      select:  { status: true, startedAt: true, finishedAt: true, expedientesChecked: true, expedientesUpdated: true, errorMessage: true },
    });

    return reply.send({ ok: true, credential: cred ?? null, lastSync: lastLog ?? null });
  });

  // ── PUT /portal/config ────────────────────────────────────────────────────
  app.put("/portal/config", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const schema = z.object({
      username: z.string().min(1, "Usuario requerido"),
      password: z.string().min(1, "Contraseña requerida"),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", issues: parsed.error.issues });
    }
    const { username, password } = parsed.data;

    // Verificar que PORTAL_ENCRYPTION_KEY está configurada
    if (!process.env.PORTAL_ENCRYPTION_KEY) {
      logger.warn("[portal] PORTAL_ENCRYPTION_KEY no está configurada");
      return reply.status(500).send({
        ok: false,
        error: "CONFIG_ERROR",
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
      where: { tenantId_portal: { tenantId: user.tenantId, portal: "mev_misiones" } },
    });

    const cred = existing
      ? await prisma.portalCredential.update({
          where: { id: existing.id },
          data:  { username, passwordEnc, isActive: true, lastError: null, updatedAt: new Date() },
        })
      : await prisma.portalCredential.create({
          data: {
            tenantId:    user.tenantId,
            portal:      "mev_misiones",
            username,
            passwordEnc,
            isActive:    true,
          },
        });

    return reply.send({
      ok: true,
      credential: { id: cred.id, username: cred.username, isActive: cred.isActive },
    });
  });

  // ── DELETE /portal/config ─────────────────────────────────────────────────
  app.delete("/portal/config", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const cred = await prisma.portalCredential.findUnique({
      where: { tenantId_portal: { tenantId: user.tenantId, portal: "mev_misiones" } },
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
      username: z.string().min(1),
      password: z.string().min(1),
    });
    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR" });
    }

    const { valid, error } = await testCredentials(parsed.data.username, parsed.data.password);

    if (valid) {
      return reply.send({ ok: true, message: "Conexión exitosa con el portal MEV Misiones." });
    } else {
      return reply.send({
        ok: false,
        error: "INVALID_CREDENTIALS",
        message: error ?? "Credenciales inválidas o portal no disponible.",
      });
    }
  });

  // ── POST /portal/sync ─────────────────────────────────────────────────────
  app.post("/portal/sync", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    // Verificar que tiene credenciales
    const cred = await prisma.portalCredential.findUnique({
      where: { tenantId_portal: { tenantId: user.tenantId, portal: "mev_misiones" } },
    });
    if (!cred) return reply.status(400).send({ ok: false, error: "NO_CREDENTIALS", message: "Configurá primero tus credenciales del portal MEV." });
    if (!cred.isActive) return reply.status(400).send({ ok: false, error: "CREDENTIALS_INACTIVE" });

    // Responder inmediatamente, sync en background
    reply.status(202).send({ ok: true, message: "Sincronización iniciada en background." });

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

    const q = request.query as { limit?: string };
    const limit = Math.min(50, parseInt(q.limit ?? "20"));

    const logs = await prisma.portalSyncLog.findMany({
      where:   { tenantId: user.tenantId, portal: "mev_misiones" },
      orderBy: { startedAt: "desc" },
      take:    limit,
      select:  {
        id: true, status: true, trigger: true,
        startedAt: true, finishedAt: true,
        expedientesChecked: true, expedientesUpdated: true,
        errorMessage: true,
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
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, number: true, title: true, matter: true, status: true,
          court: true,
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

    const { id } = request.params as { id: string };
    const { enabled } = request.body as { enabled: boolean };

    const exp = await prisma.expediente.findFirst({ where: { id, tenantId: user.tenantId } });
    if (!exp) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    await prisma.expediente.update({
      where: { id },
      data:  { portalSyncEnabled: Boolean(enabled) },
    });

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
