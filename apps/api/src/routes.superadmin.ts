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

  logger.info("[superadmin] Routes registered");
}
