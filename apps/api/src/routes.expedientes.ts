/**
 * Expediente Routes — CRUD de expedientes/casos del estudio
 * GET    /expedientes           — listar con búsqueda + paginado
 * POST   /expedientes           — crear expediente
 * GET    /expedientes/:id       — obtener expediente (con documentos y cliente)
 * PUT    /expedientes/:id       — actualizar expediente
 * DELETE /expedientes/:id       — eliminar expediente
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";
import { calculateDeadline } from "./utils/plazo-calculator.js";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const MATTERS = [
  "civil",
  "penal",
  "laboral",
  "familia",
  "comercial",
  "administrativo",
  "constitucional",
  "tributario",
  "otro",
] as const;

const STATUSES = ["activo", "cerrado", "archivado", "suspendido"] as const;

const ExpedienteBodySchema = z.object({
  number:        z.string().max(100).optional().nullable(),
  title:         z.string().min(3, "El título debe tener al menos 3 caracteres").max(300),
  matter:        z.enum(MATTERS),
  status:        z.enum(STATUSES).default("activo"),
  clientId:      z.string().uuid().optional().nullable(),
  court:         z.string().max(200).optional().nullable(),
  judge:         z.string().max(200).optional().nullable(),
  opposingParty: z.string().max(200).optional().nullable(),
  openedAt:      z.string().datetime().optional().nullable(),
  closedAt:      z.string().datetime().optional().nullable(),
  deadline:      z.string().datetime().optional().nullable(),
  notes:         z.string().max(3000).optional().nullable(),
});

const ExpedientesQuerySchema = z.object({
  query:         z.string().optional(),
  matter:        z.enum(MATTERS).optional(),
  status:        z.enum(STATUSES).optional(),
  clientId:      z.string().uuid().optional(),
  page:          z.coerce.number().int().positive().default(1),
  pageSize:      z.coerce.number().int().positive().max(500).default(20),
  sort:          z.enum([
    "createdAt:asc", "createdAt:desc",
    "title:asc",     "title:desc",
    "openedAt:desc", "openedAt:asc",
    "deadline:asc",  "deadline:desc",
  ]).default("createdAt:desc"),
  // Deadline filters — used by the Vencimientos (deadline tracking) feature
  hasDeadline:    z.enum(["true", "false"]).optional(),
  deadlineBefore: z.string().optional(),   // ISO datetime — deadline <= this date
  deadlineAfter:  z.string().optional(),   // ISO datetime — deadline >= this date
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unauthorized(reply: any) {
  return reply.status(401).send({ ok: false, error: "UNAUTHORIZED", message: "Autenticación requerida" });
}

function notFound(reply: any) {
  return reply.status(404).send({ ok: false, error: "NOT_FOUND", message: "Expediente no encontrado" });
}

async function getTenantAndUser(request: any, reply: any) {
  const user = getUserFromRequest(request);
  if (!user) { unauthorized(reply); return null; }
  if (!user.tenantId) {
    reply.status(403).send({ ok: false, error: "TENANT_REQUIRED", message: "El usuario no tiene un tenant asignado." });
    return null;
  }
  return user;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerExpedienteRoutes(app: FastifyInstance) {

  // ── POST /expedientes/calcular-plazo ────────────────────────────────────────
  app.post("/expedientes/calcular-plazo", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const schema = z.object({
      fechaNotificacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato esperado: YYYY-MM-DD"),
      diasHabiles:       z.number().int().min(1).max(365),
    });

    const parsed = schema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_BODY", details: parsed.error.format() });
    }

    const { fechaNotificacion, diasHabiles } = parsed.data;
    const startDate = new Date(fechaNotificacion + "T12:00:00Z");

    const result = calculateDeadline(startDate, diasHabiles);

    return reply.send({ ok: true, ...result });
  });

  // ── GET /expedientes ────────────────────────────────────────────────────────
  app.get("/expedientes", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const parsed = ExpedientesQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_QUERY", details: parsed.error.format() });
    }

    const { query, matter, status, clientId, page, pageSize, sort, hasDeadline, deadlineBefore, deadlineAfter } = parsed.data;
    const [sortField, sortDir] = sort.split(":");

    const tenantId = user.tenantId!;
    const where: any = { tenantId };
    if (matter)   where.matter   = matter;
    if (status)   where.status   = status;
    if (clientId) where.clientId = clientId;

    if (query) {
      where.OR = [
        { title:         { contains: query, mode: "insensitive" } },
        { number:        { contains: query, mode: "insensitive" } },
        { court:         { contains: query, mode: "insensitive" } },
        { opposingParty: { contains: query, mode: "insensitive" } },
      ];
    }

    // ── Deadline filters ────────────────────────────────────────────────────
    if (hasDeadline === "true" || deadlineBefore || deadlineAfter) {
      const deadlineFilter: any = {};
      if (hasDeadline === "true") deadlineFilter.not = null;
      if (deadlineBefore) deadlineFilter.lte = new Date(deadlineBefore);
      if (deadlineAfter)  deadlineFilter.gte = new Date(deadlineAfter);
      where.deadline = deadlineFilter;
    } else if (hasDeadline === "false") {
      where.deadline = null;
    }

    const [total, expedientes] = await Promise.all([
      prisma.expediente.count({ where }),
      prisma.expediente.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          number: true,
          title: true,
          matter: true,
          status: true,
          openedAt: true,
          closedAt: true,
          deadline: true,
          createdAt: true,
          updatedAt: true,
          client: { select: { id: true, name: true, type: true } },
          _count: { select: { documents: true } },
        },
      }),
    ]);

    return reply.send({ ok: true, expedientes, total, page, pageSize });
  });

  // ── POST /expedientes ───────────────────────────────────────────────────────
  app.post("/expedientes", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const parsed = ExpedienteBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.format() });
    }

    const data = parsed.data;

    // Validar que el clientId pertenece al mismo tenant
    if (data.clientId) {
      const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId: user.tenantId! } });
      if (!client) return reply.status(404).send({ ok: false, error: "CLIENT_NOT_FOUND" });
    }

    const expediente = await prisma.expediente.create({
      data: {
        tenantId:      user.tenantId!,
        createdById:   user.userId!,
        number:        data.number?.trim() ?? null,
        title:         data.title.trim(),
        matter:        data.matter,
        status:        data.status,
        clientId:      data.clientId ?? null,
        court:         data.court?.trim() ?? null,
        judge:         data.judge?.trim() ?? null,
        opposingParty: data.opposingParty?.trim() ?? null,
        openedAt:      data.openedAt ? new Date(data.openedAt) : new Date(),
        closedAt:      data.closedAt ? new Date(data.closedAt) : null,
        deadline:      data.deadline ? new Date(data.deadline) : null,
        notes:         data.notes?.trim() ?? null,
      },
      include: {
        client: { select: { id: true, name: true, type: true } },
      },
    });

    return reply.status(201).send({ ok: true, expediente });
  });

  // ── GET /expedientes/:id ────────────────────────────────────────────────────
  app.get("/expedientes/:id", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const expediente = await prisma.expediente.findFirst({
      where: { id, tenantId: user.tenantId! },
      include: {
        client: { select: { id: true, name: true, type: true, email: true, phone: true } },
        documents: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            type: true,
            jurisdiccion: true,
            estado: true,
            createdAt: true,
            versions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { id: true, status: true, pdfUrl: true },
            },
          },
        },
      },
    });

    if (!expediente) return notFound(reply);

    return reply.send({ ok: true, expediente });
  });

  // ── PUT /expedientes/:id ────────────────────────────────────────────────────
  app.put("/expedientes/:id", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const existing = await prisma.expediente.findFirst({ where: { id, tenantId: user.tenantId! } });
    if (!existing) return notFound(reply);

    const parsed = ExpedienteBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.format() });
    }

    const data = parsed.data;

    if (data.clientId) {
      const client = await prisma.client.findFirst({ where: { id: data.clientId, tenantId: user.tenantId! } });
      if (!client) return reply.status(404).send({ ok: false, error: "CLIENT_NOT_FOUND" });
    }

    const expediente = await prisma.expediente.update({
      where: { id },
      data: {
        number:        data.number?.trim() ?? null,
        title:         data.title.trim(),
        matter:        data.matter,
        status:        data.status,
        clientId:      data.clientId ?? null,
        court:         data.court?.trim() ?? null,
        judge:         data.judge?.trim() ?? null,
        opposingParty: data.opposingParty?.trim() ?? null,
        openedAt:      data.openedAt ? new Date(data.openedAt) : existing.openedAt,
        closedAt:      data.closedAt ? new Date(data.closedAt) : null,
        deadline:      data.deadline ? new Date(data.deadline) : null,
        notes:         data.notes?.trim() ?? null,
      },
      include: {
        client: { select: { id: true, name: true, type: true } },
      },
    });

    return reply.send({ ok: true, expediente });
  });

  // ── DELETE /expedientes/:id ─────────────────────────────────────────────────
  app.delete("/expedientes/:id", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const existing = await prisma.expediente.findFirst({ where: { id, tenantId: user.tenantId! } });
    if (!existing) return notFound(reply);

    await prisma.expediente.delete({ where: { id } });

    return reply.send({ ok: true, message: "Expediente eliminado correctamente" });
  });
}
