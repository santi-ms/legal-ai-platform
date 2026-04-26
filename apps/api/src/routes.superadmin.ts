/**
 * Super-Admin Routes
 *
 * Full system visibility: tenants, users, plans, documents, AI usage.
 * Access restricted exclusively to the email set in SUPER_ADMIN_EMAIL env var.
 *
 * GET /superadmin/overview        — system-wide aggregated stats
 * GET /superadmin/tenants         — paginated list of all tenants with stats
 * GET /superadmin/tenants/:id     — full detail for a single tenant
 * GET /superadmin/users           — paginated list of all users
 * DELETE /superadmin/users/:id    — delete a user account (only if no content created)
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { requireAuth } from "./utils/auth.js";
import { prisma } from "./db.js";
import { logger } from "./utils/logger.js";

// ---------------------------------------------------------------------------
// Guard
// ---------------------------------------------------------------------------

function requireSuperAdmin(request: any, reply: any) {
  try {
    const user = requireAuth(request);
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL;
    if (!superAdminEmail) {
      logger.warn("[superadmin] SUPER_ADMIN_EMAIL not set — access denied");
      reply.status(403).send({ ok: false, error: "FORBIDDEN" });
      return null;
    }
    if (user.email.toLowerCase() !== superAdminEmail.toLowerCase()) {
      reply.status(403).send({ ok: false, error: "FORBIDDEN" });
      return null;
    }
    return user;
  } catch {
    reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    return null;
  }
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function registerSuperAdminRoutes(app: FastifyInstance) {

  // ── GET /superadmin/overview ──────────────────────────────────────────────
  app.get("/superadmin/overview", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalTenants,
      totalUsers,
      totalDocuments,
      docsThisMonth,
      totalClients,
      totalExpedientes,
      totalAnalyses,
      aiCostResult,
      planBreakdown,
      recentTenants,
    ] = await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.document.count(),
      prisma.document.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.client.count({ where: { archivedAt: null } }),
      prisma.expediente.count(),
      prisma.contractAnalysis.count(),
      prisma.iAUsageLog.aggregate({ _sum: { costUsd: true } }),
      prisma.tenant.groupBy({
        by: ["currentPlanCode"],
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.tenant.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          currentPlanCode: true,
          createdAt: true,
          _count: { select: { users: true, documents: true } },
        },
      }),
    ]);

    return reply.send({
      ok: true,
      overview: {
        totalTenants,
        totalUsers,
        totalDocuments,
        docsThisMonth,
        totalClients,
        totalExpedientes,
        totalAnalyses,
        totalAiCostUsd: aiCostResult._sum.costUsd ?? 0,
        planBreakdown: planBreakdown.map((p) => ({
          plan: p.currentPlanCode,
          count: p._count.id,
        })),
        recentTenants,
      },
    });
  });

  // ── GET /superadmin/tenants ───────────────────────────────────────────────
  app.get("/superadmin/tenants", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const QuerySchema = z.object({
      page:     z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(100).default(25),
      plan:     z.string().optional(),
      search:   z.string().optional(),
    });
    const q = QuerySchema.safeParse(request.query);
    const { page, pageSize, plan, search } = q.success
      ? q.data
      : { page: 1, pageSize: 25, plan: undefined, search: undefined };

    const where: any = {};
    if (plan) where.currentPlanCode = plan;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { cuit: { contains: search } },
      ];
    }

    const [total, tenants] = await Promise.all([
      prisma.tenant.count({ where }),
      prisma.tenant.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          cuit: true,
          address: true,
          phone: true,
          website: true,
          currentPlanCode: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              documents: true,
              clients: true,
              expedientes: true,
              contractAnalyses: true,
            },
          },
        },
      }),
    ]);

    // Enrich with AI cost per tenant
    const tenantIds = tenants.map((t) => t.id);
    const aiCosts = await prisma.iAUsageLog.groupBy({
      by: ["tenantId"],
      where: { tenantId: { in: tenantIds } },
      _sum: { costUsd: true },
    });
    const aiCostMap = Object.fromEntries(
      aiCosts.map((a) => [a.tenantId, a._sum.costUsd ?? 0])
    );

    const enriched = tenants.map((t) => ({
      ...t,
      aiCostUsd: aiCostMap[t.id] ?? 0,
    }));

    return reply.send({ ok: true, tenants: enriched, total, page, pageSize });
  });

  // ── GET /superadmin/tenants/:id ───────────────────────────────────────────
  app.get("/superadmin/tenants/:id", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const tenant = await prisma.tenant.findUnique({
      where: { id },
      include: {
        subscription: {
          include: {
            plan: { select: { code: true, name: true, priceArs: true } },
          },
        },
      },
    });
    if (!tenant) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    const [
      users,
      recentDocuments,
      clients,
      aiUsageByService,
      aiTotalCost,
      docsByType,
      analyses,
    ] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId: id },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          role: true,
          professionalRole: true,
          especialidad: true,
          createdAt: true,
          emailVerified: true,
        },
      }),
      prisma.document.findMany({
        where: { tenantId: id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          jurisdiccion: true,
          estado: true,
          costUsd: true,
          createdAt: true,
          client: { select: { name: true } },
          createdBy: { select: { firstName: true, lastName: true, email: true } },
        },
      }),
      prisma.client.findMany({
        where: { tenantId: id, archivedAt: null },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          name: true,
          type: true,
          documentNumber: true,
          email: true,
          createdAt: true,
        },
      }),
      prisma.iAUsageLog.groupBy({
        by: ["service"],
        where: { tenantId: id },
        _sum: { costUsd: true, promptTokens: true, completionTokens: true },
        _count: { id: true },
        orderBy: { _sum: { costUsd: "desc" } },
      }),
      prisma.iAUsageLog.aggregate({
        where: { tenantId: id },
        _sum: { costUsd: true, promptTokens: true, completionTokens: true },
        _count: { id: true },
      }),
      prisma.document.groupBy({
        by: ["type"],
        where: { tenantId: id },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
      }),
      prisma.contractAnalysis.findMany({
        where: { tenantId: id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          originalName: true,
          status: true,
          fileSize: true,
          createdAt: true,
        },
      }),
    ]);

    return reply.send({
      ok: true,
      tenant: {
        ...tenant,
        users,
        recentDocuments,
        recentClients: clients,
        analyses,
        aiUsage: {
          total: {
            costUsd: aiTotalCost._sum.costUsd ?? 0,
            promptTokens: aiTotalCost._sum.promptTokens ?? 0,
            completionTokens: aiTotalCost._sum.completionTokens ?? 0,
            calls: aiTotalCost._count.id,
          },
          byService: aiUsageByService.map((s) => ({
            service: s.service,
            costUsd: s._sum.costUsd ?? 0,
            promptTokens: s._sum.promptTokens ?? 0,
            completionTokens: s._sum.completionTokens ?? 0,
            calls: s._count.id,
          })),
        },
        docsByType: docsByType.map((d) => ({ type: d.type, count: d._count.id })),
      },
    });
  });

  // ── GET /superadmin/users ─────────────────────────────────────────────────
  app.get("/superadmin/users", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const QuerySchema = z.object({
      page:     z.coerce.number().int().positive().default(1),
      pageSize: z.coerce.number().int().positive().max(100).default(50),
      search:   z.string().optional(),
    });
    const q = QuerySchema.safeParse(request.query);
    const { page, pageSize, search } = q.success
      ? q.data
      : { page: 1, pageSize: 50, search: undefined };

    const where: any = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { name: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          name: true,
          email: true,
          role: true,
          professionalRole: true,
          especialidad: true,
          createdAt: true,
          emailVerified: true,
          tenantId: true,
          tenant: { select: { name: true, currentPlanCode: true } },
        },
      }),
    ]);

    return reply.send({ ok: true, users, total, page, pageSize });
  });

  // ── DELETE /superadmin/users/:id ──────────────────────────────────────────
  app.delete("/superadmin/users/:id", async (request, reply) => {
    const admin = requireSuperAdmin(request, reply);
    if (!admin) return;

    const { id } = request.params as { id: string };

    const target = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            documentsCreated: true,
            clientsCreated: true,
            expedientesCreated: true,
            referenceDocuments: true,
            contractAnalyses: true,
            invitationsSent: true,
            honorariosCreated: true,
            escritosUploaded: true,
            clientPortalCreated: true,
            annotations: true,
          },
        },
      },
    });

    if (!target) {
      return reply.status(404).send({ ok: false, error: "NOT_FOUND" });
    }

    if (target.email.toLowerCase() === admin.email.toLowerCase()) {
      return reply.status(400).send({
        ok: false,
        error: "CANNOT_DELETE_SELF",
        message: "No podés borrar tu propia cuenta de super-admin.",
      });
    }

    // Bloquear si el usuario creó contenido sin cascade — borrarlo dejaría
    // FK colgadas o requeriría borrado masivo de datos del estudio.
    const c = target._count;
    const total =
      c.documentsCreated +
      c.clientsCreated +
      c.expedientesCreated +
      c.referenceDocuments +
      c.contractAnalyses +
      c.invitationsSent +
      c.honorariosCreated +
      c.escritosUploaded +
      c.clientPortalCreated +
      c.annotations;

    if (total > 0) {
      return reply.status(409).send({
        ok: false,
        error: "USER_HAS_CONTENT",
        message:
          "Este usuario creó contenido (documentos, clientes, expedientes, etc.). Reasigná o eliminá ese contenido antes de borrar la cuenta.",
        counts: c,
      });
    }

    try {
      await prisma.user.delete({ where: { id } });
      request.log.info({
        event: "superadmin:user_deleted",
        deletedUserId: id,
        deletedUserEmail: target.email,
        by: admin.email,
      });
      return reply.send({ ok: true });
    } catch (e: any) {
      request.log.error({
        event: "superadmin:user_delete_failed",
        userId: id,
        error: e?.message,
        code: e?.code,
      });
      return reply.status(500).send({
        ok: false,
        error: "DELETE_FAILED",
        message: e?.message ?? "No se pudo eliminar el usuario.",
      });
    }
  });

  // ── GET /superadmin/promos ────────────────────────────────────────────────
  app.get("/superadmin/promos", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const promos = await (prisma as any).promoCode.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { uses: true } } },
    });

    return reply.send({ ok: true, promos });
  });

  // ── POST /superadmin/promos ───────────────────────────────────────────────
  app.post("/superadmin/promos", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const BodySchema = z.object({
      code:      z.string().min(3).max(40).transform((s) => s.trim().toUpperCase()),
      planCode:  z.enum(["pro", "proplus", "equipo", "estudio"]).default("pro"),
      trialDays: z.number().int().positive().default(14),
      maxUses:   z.number().int().default(-1),   // -1 = ilimitado
      expiresAt: z.string().datetime().optional().nullable(),
      note:      z.string().max(200).optional().nullable(),
    });

    const parsed = BodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_BODY", details: parsed.error.flatten() });
    }

    const existing = await (prisma as any).promoCode.findUnique({ where: { code: parsed.data.code } });
    if (existing) {
      return reply.status(409).send({ ok: false, error: "CODE_EXISTS", message: "Ya existe un código con ese nombre." });
    }

    const promo = await (prisma as any).promoCode.create({
      data: {
        code:      parsed.data.code,
        planCode:  parsed.data.planCode,
        trialDays: parsed.data.trialDays,
        maxUses:   parsed.data.maxUses,
        expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
        note:      parsed.data.note ?? null,
        isActive:  true,
      },
    });

    return reply.status(201).send({ ok: true, promo });
  });

  // ── PATCH /superadmin/promos/:id ──────────────────────────────────────────
  app.patch("/superadmin/promos/:id", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    const PatchSchema = z.object({
      isActive:  z.boolean().optional(),
      trialDays: z.number().int().positive().optional(),
      maxUses:   z.number().int().optional(),
      expiresAt: z.string().datetime().nullable().optional(),
      note:      z.string().max(200).nullable().optional(),
    });

    const parsed = PatchSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_BODY" });
    }

    const data: any = {};
    if (parsed.data.isActive  !== undefined) data.isActive  = parsed.data.isActive;
    if (parsed.data.trialDays !== undefined) data.trialDays = parsed.data.trialDays;
    if (parsed.data.maxUses   !== undefined) data.maxUses   = parsed.data.maxUses;
    if (parsed.data.note      !== undefined) data.note      = parsed.data.note;
    if (parsed.data.expiresAt !== undefined) {
      data.expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null;
    }

    const promo = await (prisma as any).promoCode.update({ where: { id }, data });
    return reply.send({ ok: true, promo });
  });

  // ── DELETE /superadmin/promos/:id ─────────────────────────────────────────
  app.delete("/superadmin/promos/:id", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    await (prisma as any).promoCode.delete({ where: { id } });
    return reply.send({ ok: true });
  });

  // ══════════════════════════════════════════════════════════════════════════
  // RAG — Gestión de códigos legales
  // ══════════════════════════════════════════════════════════════════════════

  // GET /superadmin/legal-codes/stats
  app.get("/superadmin/legal-codes/stats", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;
    const { getLegalCodeStats } = await import("./services/rag-service.js");
    const stats = await getLegalCodeStats();
    return reply.send({ ok: true, stats });
  });

  // GET /superadmin/legal-codes?code=CCCN&jurisdiction=nacional&limit=20
  app.get("/superadmin/legal-codes", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const q = request.query as { code?: string; jurisdiction?: string; limit?: string };
    const chunks = await prisma.$queryRaw<any[]>`
      SELECT id, code, jurisdiction, article, "sectionTitle",
             left(text, 200) as text_preview,
             "createdAt"
      FROM "LegalCodeChunk"
      WHERE
        (${q.code ?? null}::text IS NULL OR code = ${q.code ?? ""})
        AND (${q.jurisdiction ?? null}::text IS NULL OR jurisdiction = ${q.jurisdiction ?? ""})
      ORDER BY jurisdiction, code, article
      LIMIT ${parseInt(q.limit ?? "50")}
    `;
    return reply.send({ ok: true, chunks, total: chunks.length });
  });

  // POST /superadmin/legal-codes — Insertar/actualizar un artículo
  app.post("/superadmin/legal-codes", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const BodySchema = z.object({
      code:         z.string().min(1).max(50),
      jurisdiction: z.string().min(1).max(50),
      article:      z.string().min(1).max(30),
      sectionTitle: z.string().max(200).optional().nullable(),
      text:         z.string().min(10),
    });
    const body = BodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", issues: body.error.flatten() });
    }

    const { randomUUID } = await import("node:crypto");
    const { code, jurisdiction, article, sectionTitle, text } = body.data;

    await prisma.$executeRaw`
      INSERT INTO "LegalCodeChunk"
        (id, code, jurisdiction, article, "sectionTitle", text, "updatedAt")
      VALUES
        (${randomUUID()}, ${code}, ${jurisdiction}, ${article}, ${sectionTitle ?? null}, ${text}, now())
      ON CONFLICT (code, article) DO UPDATE
        SET jurisdiction   = EXCLUDED.jurisdiction,
            "sectionTitle" = EXCLUDED."sectionTitle",
            text           = EXCLUDED.text,
            "updatedAt"    = now()
    `;

    return reply.status(201).send({ ok: true, message: `Art. ${article} ${code} guardado.` });
  });

  // DELETE /superadmin/legal-codes/:id
  app.delete("/superadmin/legal-codes/:id", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };
    await prisma.legalCodeChunk.delete({ where: { id } });
    return reply.send({ ok: true });
  });

  // POST /superadmin/legal-codes/search — Test de búsqueda RAG
  app.post("/superadmin/legal-codes/search", async (request, reply) => {
    const user = requireSuperAdmin(request, reply);
    if (!user) return;

    const BodySchema = z.object({
      query:        z.string().min(3),
      jurisdiction: z.string().optional(),
      code:         z.string().optional(),
      limit:        z.number().int().min(1).max(20).default(8),
    });
    const body = BodySchema.safeParse(request.body);
    if (!body.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR" });
    }

    const { findRelevantArticles } = await import("./services/rag-service.js");
    const results = await findRelevantArticles(body.data.query, {
      jurisdiction: body.data.jurisdiction,
      code:         body.data.code,
      limit:        body.data.limit,
    });

    return reply.send({ ok: true, results, count: results.length });
  });

  logger.info("[superadmin] Routes registered");
}
