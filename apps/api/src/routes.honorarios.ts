/**
 * Honorario Routes — Finanzas (cobros, facturación, deudas)
 * GET    /honorarios                — listar con filtros + paginado
 * GET    /honorarios/stats          — dashboard (cobrado / pendiente / vencido)
 * POST   /honorarios                — crear honorario
 * GET    /honorarios/:id            — obtener uno
 * PUT    /honorarios/:id            — actualizar
 * DELETE /honorarios/:id            — eliminar
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";

// ─── Constantes ──────────────────────────────────────────────────────────────

const TIPOS   = ["consulta", "juicio", "acuerdo", "mediacion", "otro"] as const;
const ESTADOS = ["presupuestado", "facturado", "cobrado", "cancelado"] as const;

// ─── Schemas ─────────────────────────────────────────────────────────────────

const HonorarioBodySchema = z.object({
  expedienteId:     z.string().uuid().optional().nullable(),
  clientId:         z.string().uuid().optional().nullable(),
  tipo:             z.enum(TIPOS),
  concepto:         z.string().min(3, "El concepto debe tener al menos 3 caracteres").max(300),
  monto:            z.number().positive("El monto debe ser mayor a 0"),
  moneda:           z.string().max(5).default("ARS"),
  estado:           z.enum(ESTADOS).default("presupuestado"),
  fechaEmision:     z.string().datetime().optional(),
  fechaVencimiento: z.string().datetime().optional().nullable(),
  fechaCobro:       z.string().datetime().optional().nullable(),
  notas:            z.string().max(2000).optional().nullable(),
});

const HonorariosQuerySchema = z.object({
  query:         z.string().optional(),
  tipo:          z.enum(TIPOS).optional(),
  estado:        z.enum(ESTADOS).optional(),
  expedienteId:  z.string().uuid().optional(),
  clientId:      z.string().uuid().optional(),
  page:          z.coerce.number().int().positive().default(1),
  pageSize:      z.coerce.number().int().positive().max(500).default(20),
  sort:          z.enum([
    "fechaEmision:desc", "fechaEmision:asc",
    "fechaVencimiento:asc", "fechaVencimiento:desc",
    "monto:desc", "monto:asc",
    "createdAt:desc", "createdAt:asc",
  ]).default("fechaEmision:desc"),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unauthorized(reply: any) {
  return reply.status(401).send({ ok: false, error: "UNAUTHORIZED", message: "Autenticación requerida" });
}

function notFound(reply: any) {
  return reply.status(404).send({ ok: false, error: "NOT_FOUND", message: "Honorario no encontrado" });
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

export async function registerHonorarioRoutes(app: FastifyInstance) {

  // ── GET /honorarios/export ─────────────────────────────────────────────────
  app.get("/honorarios/export", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const tenantId = user.tenantId!;

    const honorarios = await prisma.honorario.findMany({
      where: { tenantId },
      orderBy: { fechaEmision: "desc" },
      include: {
        expediente: { select: { number: true, title: true } },
        client:     { select: { name: true } },
      },
    });

    const TIPO_ES: Record<string, string> = {
      consulta: "Consulta", juicio: "Juicio", acuerdo: "Acuerdo",
      mediacion: "Mediación", otro: "Otro",
    };
    const ESTADO_ES: Record<string, string> = {
      presupuestado: "Presupuestado", facturado: "Facturado",
      cobrado: "Cobrado", cancelado: "Cancelado",
    };

    const escapeCSV = (v: unknown): string => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const formatDate = (d: Date | null) =>
      d ? d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

    const headers = [
      "Concepto", "Tipo", "Estado", "Monto", "Moneda",
      "Expediente", "Cliente",
      "Fecha Emisión", "Fecha Vencimiento", "Fecha Cobro",
      "Notas",
    ].map(escapeCSV).join(",");

    const rows = honorarios.map((h) => [
      escapeCSV(h.concepto),
      escapeCSV(TIPO_ES[h.tipo] ?? h.tipo),
      escapeCSV(ESTADO_ES[h.estado] ?? h.estado),
      escapeCSV(h.monto),
      escapeCSV(h.moneda),
      escapeCSV(h.expediente ? `${h.expediente.number ? "#" + h.expediente.number + " " : ""}${h.expediente.title}` : ""),
      escapeCSV(h.client?.name),
      escapeCSV(formatDate(h.fechaEmision ? new Date(h.fechaEmision) : null)),
      escapeCSV(formatDate(h.fechaVencimiento ? new Date(h.fechaVencimiento) : null)),
      escapeCSV(formatDate(h.fechaCobro ? new Date(h.fechaCobro) : null)),
      escapeCSV(h.notas),
    ].join(","));

    const csv = [headers, ...rows].join("\r\n");
    const today = new Date().toISOString().slice(0, 10);

    return reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="honorarios-${today}.csv"`)
      .send("\uFEFF" + csv);
  });

  // ── GET /honorarios/stats ──────────────────────────────────────────────────
  app.get("/honorarios/stats", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const tenantId = user.tenantId!;
    const now = new Date();

    const [all, cobrados, facturados, presupuestados, vencidos] = await Promise.all([
      prisma.honorario.aggregate({
        where: { tenantId },
        _sum: { monto: true },
        _count: true,
      }),
      prisma.honorario.aggregate({
        where: { tenantId, estado: "cobrado" },
        _sum: { monto: true }, _count: true,
      }),
      prisma.honorario.aggregate({
        where: { tenantId, estado: "facturado" },
        _sum: { monto: true }, _count: true,
      }),
      prisma.honorario.aggregate({
        where: { tenantId, estado: "presupuestado" },
        _sum: { monto: true }, _count: true,
      }),
      prisma.honorario.aggregate({
        where: {
          tenantId,
          estado: { in: ["facturado", "presupuestado"] },
          fechaVencimiento: { lt: now, not: null },
        },
        _sum: { monto: true }, _count: true,
      }),
    ]);

    return reply.send({
      ok: true,
      stats: {
        total:          { count: all._count || 0,            monto: all._sum.monto ?? 0 },
        cobrado:        { count: cobrados._count || 0,       monto: cobrados._sum.monto ?? 0 },
        facturado:      { count: facturados._count || 0,     monto: facturados._sum.monto ?? 0 },
        presupuestado:  { count: presupuestados._count || 0, monto: presupuestados._sum.monto ?? 0 },
        vencido:        { count: vencidos._count || 0,       monto: vencidos._sum.monto ?? 0 },
      },
    });
  });

  // ── GET /honorarios ────────────────────────────────────────────────────────
  app.get("/honorarios", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const parsed = HonorariosQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_QUERY", details: parsed.error.format() });
    }

    const { query, tipo, estado, expedienteId, clientId, page, pageSize, sort } = parsed.data;
    const [sortField, sortDir] = sort.split(":");

    const tenantId = user.tenantId!;
    const where: any = { tenantId, archivedAt: null };
    if (tipo)         where.tipo = tipo;
    if (estado)       where.estado = estado;
    if (expedienteId) where.expedienteId = expedienteId;
    if (clientId)     where.clientId = clientId;

    if (query) {
      where.OR = [
        { concepto: { contains: query, mode: "insensitive" } },
        { notas:    { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, honorarios] = await Promise.all([
      prisma.honorario.count({ where }),
      prisma.honorario.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          expediente: { select: { id: true, number: true, title: true } },
          client:     { select: { id: true, name: true } },
        },
      }),
    ]);

    return reply.send({ ok: true, honorarios, total, page, pageSize });
  });

  // ── POST /honorarios ───────────────────────────────────────────────────────
  app.post("/honorarios", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const parsed = HonorarioBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.format() });
    }

    const data = parsed.data;

    // Validar ownership de expediente / cliente
    if (data.expedienteId) {
      const exp = await prisma.expediente.findFirst({ where: { id: data.expedienteId, tenantId: user.tenantId! } });
      if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });
    }
    if (data.clientId) {
      const cli = await prisma.client.findFirst({ where: { id: data.clientId, tenantId: user.tenantId! } });
      if (!cli) return reply.status(404).send({ ok: false, error: "CLIENT_NOT_FOUND" });
    }

    const honorario = await prisma.honorario.create({
      data: {
        tenantId:         user.tenantId!,
        createdById:      user.userId!,
        expedienteId:     data.expedienteId ?? null,
        clientId:         data.clientId ?? null,
        tipo:             data.tipo,
        concepto:         data.concepto.trim(),
        monto:            data.monto,
        moneda:           data.moneda ?? "ARS",
        estado:           data.estado,
        fechaEmision:     data.fechaEmision ? new Date(data.fechaEmision) : new Date(),
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        fechaCobro:       data.fechaCobro ? new Date(data.fechaCobro) : null,
        notas:            data.notas?.trim() ?? null,
      },
      include: {
        expediente: { select: { id: true, number: true, title: true } },
        client:     { select: { id: true, name: true } },
      },
    });

    return reply.status(201).send({ ok: true, honorario });
  });

  // ── GET /honorarios/:id ────────────────────────────────────────────────────
  app.get("/honorarios/:id", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const honorario = await prisma.honorario.findFirst({
      where: { id, tenantId: user.tenantId! },
      include: {
        expediente: { select: { id: true, number: true, title: true } },
        client:     { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    if (!honorario) return notFound(reply);
    return reply.send({ ok: true, honorario });
  });

  // ── PUT /honorarios/:id ────────────────────────────────────────────────────
  app.put("/honorarios/:id", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const existing = await prisma.honorario.findFirst({ where: { id, tenantId: user.tenantId! } });
    if (!existing) return notFound(reply);

    const parsed = HonorarioBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.format() });
    }

    const data = parsed.data;

    if (data.expedienteId) {
      const exp = await prisma.expediente.findFirst({ where: { id: data.expedienteId, tenantId: user.tenantId! } });
      if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });
    }
    if (data.clientId) {
      const cli = await prisma.client.findFirst({ where: { id: data.clientId, tenantId: user.tenantId! } });
      if (!cli) return reply.status(404).send({ ok: false, error: "CLIENT_NOT_FOUND" });
    }

    const honorario = await prisma.honorario.update({
      where: { id, tenantId: user.tenantId! },
      data: {
        expedienteId:     data.expedienteId ?? null,
        clientId:         data.clientId ?? null,
        tipo:             data.tipo,
        concepto:         data.concepto.trim(),
        monto:            data.monto,
        moneda:           data.moneda ?? "ARS",
        estado:           data.estado,
        fechaEmision:     data.fechaEmision ? new Date(data.fechaEmision) : existing.fechaEmision,
        fechaVencimiento: data.fechaVencimiento ? new Date(data.fechaVencimiento) : null,
        fechaCobro:       data.fechaCobro ? new Date(data.fechaCobro) : (data.estado === "cobrado" && !existing.fechaCobro ? new Date() : null),
        notas:            data.notas?.trim() ?? null,
      },
      include: {
        expediente: { select: { id: true, number: true, title: true } },
        client:     { select: { id: true, name: true } },
      },
    });

    return reply.send({ ok: true, honorario });
  });

  // ── DELETE /honorarios/:id ─────────────────────────────────────────────────
  app.delete("/honorarios/:id", async (request, reply) => {
    const user = await getTenantAndUser(request, reply);
    if (!user) return;

    const { id } = request.params as { id: string };

    const existing = await prisma.honorario.findFirst({ where: { id, tenantId: user.tenantId! } });
    if (!existing) return notFound(reply);

    // TODO (schema): asegurarse de que el modelo Honorario tenga el campo `archivedAt DateTime?` en schema.prisma
    await prisma.honorario.update({
      where: { id: id, tenantId: user.tenantId! },
      data: { archivedAt: new Date() },
    });

    return reply.send({ ok: true, message: "Honorario eliminado correctamente" });
  });
}
