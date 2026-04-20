/**
 * Vencimientos — deadlines module
 *
 * GET    /vencimientos                  lista paginada con filtros
 * POST   /vencimientos                  crear nuevo
 * PATCH  /vencimientos/:id              actualizar
 * PATCH  /vencimientos/:id/complete     marcar como completado
 * PATCH  /vencimientos/:id/reopen       reabrir (pendiente)
 * DELETE /vencimientos/:id              archivar (soft delete)
 * GET    /vencimientos/stats            resumen de vencimientos próximos
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth } from "./utils/auth.js";
import { randomUUID } from "node:crypto";

const VALID_TIPOS = [
  "audiencia", "presentacion", "prescripcion", "plazo_legal",
  "vencimiento_contrato", "notificacion", "pericia", "traslado", "otro",
] as const;

const VALID_ESTADOS = ["pendiente", "completado", "vencido"] as const;

const createSchema = z.object({
  titulo:           z.string().min(1, "El título es requerido").max(200),
  descripcion:      z.string().max(2000).optional().nullable(),
  tipo:             z.enum(VALID_TIPOS).default("otro"),
  fechaVencimiento: z.string().refine((d) => !isNaN(Date.parse(d)), "Fecha inválida"),
  alertaDias:       z.number().int().min(0).max(90).default(3),
  expedienteId:     z.string().uuid().optional().nullable(),
  clientId:         z.string().uuid().optional().nullable(),
});

const updateSchema = createSchema.partial();

export async function registerVencimientosRoutes(app: FastifyInstance) {

  // ── GET /vencimientos ─────────────────────────────────────────────────────
  app.get("/vencimientos", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const q = request.query as {
      page?: string; pageSize?: string;
      estado?: string; tipo?: string;
      expedienteId?: string; clientId?: string;
      from?: string; to?: string;
      upcomingDays?: string;
    };

    const page     = Math.max(1, parseInt(q.page ?? "1"));
    const pageSize = Math.min(100, parseInt(q.pageSize ?? "50"));

    const where: any = {
      tenantId:   user.tenantId,
      archivedAt: null,
    };

    if (q.estado)       where.estado       = q.estado;
    if (q.tipo)         where.tipo         = q.tipo;
    if (q.expedienteId) {
      const exp = await prisma.expediente.findFirst({
        where: { id: q.expedienteId, tenantId: user.tenantId! }
      });
      if (!exp) return reply.code(400).send({ ok: false, error: "Expediente no encontrado" });
      where.expedienteId = q.expedienteId;
    }
    if (q.clientId) {
      const cli = await prisma.client.findFirst({
        where: { id: q.clientId, tenantId: user.tenantId! }
      });
      if (!cli) return reply.code(400).send({ ok: false, error: "Cliente no encontrado" });
      where.clientId = q.clientId;
    }

    if (q.upcomingDays) {
      const days = parseInt(q.upcomingDays);
      const now = new Date();
      const future = new Date(now);
      future.setDate(future.getDate() + days);
      where.fechaVencimiento = { gte: now, lte: future };
      where.estado = "pendiente";
    } else {
      if (q.from || q.to) {
        where.fechaVencimiento = {};
        if (q.from) where.fechaVencimiento.gte = new Date(q.from);
        if (q.to)   where.fechaVencimiento.lte = new Date(q.to);
      }
    }

    const [total, items] = await Promise.all([
      prisma.vencimiento.count({ where }),
      prisma.vencimiento.findMany({
        where,
        orderBy: [{ fechaVencimiento: "asc" }, { createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, titulo: true, descripcion: true, tipo: true,
          fechaVencimiento: true, alertaDias: true, estado: true,
          completadoAt: true, createdAt: true, updatedAt: true,
          expediente: { select: { id: true, title: true, number: true } },
          client:     { select: { id: true, name: true } },
        },
      }),
    ]);

    return reply.send({ ok: true, items, total, page, pageSize });
  });

  // ── GET /vencimientos/stats ───────────────────────────────────────────────
  app.get("/vencimientos/stats", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const now     = new Date();
    const in3d    = new Date(now); in3d.setDate(in3d.getDate() + 3);
    const in7d    = new Date(now); in7d.setDate(in7d.getDate() + 7);
    const in30d   = new Date(now); in30d.setDate(in30d.getDate() + 30);

    const base = { tenantId: user.tenantId, archivedAt: null };

    const [
      totalPendientes,
      vencidos,
      proximos3d,
      proximos7d,
      proximos30d,
      completadosMes,
    ] = await Promise.all([
      prisma.vencimiento.count({ where: { ...base, estado: "pendiente" } }),
      prisma.vencimiento.count({ where: { ...base, estado: "pendiente", fechaVencimiento: { lt: now } } }),
      prisma.vencimiento.count({ where: { ...base, estado: "pendiente", fechaVencimiento: { gte: now, lte: in3d } } }),
      prisma.vencimiento.count({ where: { ...base, estado: "pendiente", fechaVencimiento: { gte: now, lte: in7d } } }),
      prisma.vencimiento.count({ where: { ...base, estado: "pendiente", fechaVencimiento: { gte: now, lte: in30d } } }),
      prisma.vencimiento.count({
        where: {
          ...base,
          estado: "completado",
          completadoAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
        },
      }),
    ]);

    return reply.send({
      ok: true,
      stats: { totalPendientes, vencidos, proximos3d, proximos7d, proximos30d, completadosMes },
    });
  });

  // ── GET /vencimientos/export ─────────────────────────────────────────────
  app.get("/vencimientos/export", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const vencimientos = await prisma.vencimiento.findMany({
      where: { tenantId: user.tenantId, archivedAt: null },
      orderBy: [{ fechaVencimiento: "asc" }, { createdAt: "desc" }],
      take: 5000,
      include: {
        expediente: { select: { number: true, title: true } },
        client:     { select: { name: true } },
      },
    });

    const TIPO_ES: Record<string, string> = {
      audiencia: "Audiencia", presentacion: "Presentación",
      prescripcion: "Prescripción", plazo_legal: "Plazo legal",
      vencimiento_contrato: "Vto. contrato", notificacion: "Notificación",
      pericia: "Pericia", traslado: "Traslado", otro: "Otro",
    };

    const ESTADO_ES: Record<string, string> = {
      pendiente: "Pendiente", completado: "Completado", vencido: "Vencido",
    };

    const escapeCSV = (v: unknown): string => {
      if (v === null || v === undefined) return "";
      const s = String(v);
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const formatDate = (d: Date | string | null) =>
      d ? new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "";

    const headers = [
      "Título", "Tipo", "Estado", "Fecha Vencimiento",
      "Expediente", "Cliente", "Alerta (días)", "Descripción",
    ].map(escapeCSV).join(",");

    const rows = vencimientos.map((v) => [
      escapeCSV(v.titulo),
      escapeCSV(TIPO_ES[v.tipo] ?? v.tipo),
      escapeCSV(ESTADO_ES[v.estado] ?? v.estado),
      escapeCSV(formatDate(v.fechaVencimiento)),
      escapeCSV(v.expediente ? `${v.expediente.number ? "#" + v.expediente.number + " " : ""}${v.expediente.title}` : ""),
      escapeCSV(v.client?.name ?? ""),
      escapeCSV(v.alertaDias),
      escapeCSV(v.descripcion ?? ""),
    ].join(","));

    const csv = [headers, ...rows].join("\r\n");
    const today = new Date().toISOString().slice(0, 10);

    return reply
      .header("Content-Type", "text/csv; charset=utf-8")
      .header("Content-Disposition", `attachment; filename="vencimientos-${today}.csv"`)
      .send("\uFEFF" + csv);
  });

  // ── POST /vencimientos ────────────────────────────────────────────────────
  app.post("/vencimientos", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", issues: parsed.error.issues });
    }

    const { titulo, descripcion, tipo, fechaVencimiento, alertaDias, expedienteId, clientId } = parsed.data;

    // Validate expediente belongs to tenant
    if (expedienteId) {
      const exp = await prisma.expediente.findFirst({ where: { id: expedienteId, tenantId: user.tenantId } });
      if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });
    }

    // Validate client belongs to tenant
    if (clientId) {
      const cl = await prisma.client.findFirst({ where: { id: clientId, tenantId: user.tenantId } });
      if (!cl) return reply.status(404).send({ ok: false, error: "CLIENT_NOT_FOUND" });
    }

    const venc = await prisma.vencimiento.create({
      data: {
        id:              randomUUID(),
        tenantId:        user.tenantId,
        createdById:     user.userId,
        titulo,
        descripcion:     descripcion ?? null,
        tipo,
        fechaVencimiento: new Date(fechaVencimiento),
        alertaDias,
        expedienteId:    expedienteId ?? null,
        clientId:        clientId ?? null,
        estado:          "pendiente",
        updatedAt:       new Date(),
      },
      select: {
        id: true, titulo: true, descripcion: true, tipo: true,
        fechaVencimiento: true, alertaDias: true, estado: true,
        completadoAt: true, createdAt: true,
        expediente: { select: { id: true, title: true, number: true } },
        client:     { select: { id: true, name: true } },
      },
    });

    return reply.status(201).send({ ok: true, vencimiento: venc });
  });

  // ── PATCH /vencimientos/:id ───────────────────────────────────────────────
  app.patch("/vencimientos/:id", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const venc = await prisma.vencimiento.findFirst({
      where: { id, tenantId: user.tenantId, archivedAt: null },
    });
    if (!venc) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    const parsed = updateSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", issues: parsed.error.issues });
    }

    const data: any = { updatedAt: new Date() };
    if (parsed.data.titulo           !== undefined) data.titulo           = parsed.data.titulo;
    if (parsed.data.descripcion      !== undefined) data.descripcion      = parsed.data.descripcion;
    if (parsed.data.tipo             !== undefined) data.tipo             = parsed.data.tipo;
    if (parsed.data.fechaVencimiento !== undefined) data.fechaVencimiento = new Date(parsed.data.fechaVencimiento);
    if (parsed.data.alertaDias       !== undefined) data.alertaDias       = parsed.data.alertaDias;
    if (parsed.data.expedienteId     !== undefined) data.expedienteId     = parsed.data.expedienteId;
    if (parsed.data.clientId         !== undefined) data.clientId         = parsed.data.clientId;

    const updated = await prisma.vencimiento.update({
      where: { id },
      data,
      select: {
        id: true, titulo: true, descripcion: true, tipo: true,
        fechaVencimiento: true, alertaDias: true, estado: true,
        completadoAt: true, createdAt: true, updatedAt: true,
        expediente: { select: { id: true, title: true, number: true } },
        client:     { select: { id: true, name: true } },
      },
    });

    return reply.send({ ok: true, vencimiento: updated });
  });

  // ── PATCH /vencimientos/:id/complete ─────────────────────────────────────
  app.patch("/vencimientos/:id/complete", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const venc = await prisma.vencimiento.findFirst({
      where: { id, tenantId: user.tenantId, archivedAt: null },
    });
    if (!venc) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    const now = new Date();
    await prisma.vencimiento.update({
      where: { id },
      data: { estado: "completado", completadoAt: now, completadoById: user.userId, updatedAt: now },
    });

    return reply.send({ ok: true });
  });

  // ── PATCH /vencimientos/:id/reopen ────────────────────────────────────────
  app.patch("/vencimientos/:id/reopen", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const venc = await prisma.vencimiento.findFirst({
      where: { id, tenantId: user.tenantId, archivedAt: null },
    });
    if (!venc) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    await prisma.vencimiento.update({
      where: { id },
      data: { estado: "pendiente", completadoAt: null, completadoById: null, updatedAt: new Date() },
    });

    return reply.send({ ok: true });
  });

  // ── DELETE /vencimientos/:id ──────────────────────────────────────────────
  app.delete("/vencimientos/:id", async (request, reply) => {
    const user = requireAuth(request);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { id } = request.params as { id: string };
    const venc = await prisma.vencimiento.findFirst({
      where: { id, tenantId: user.tenantId, archivedAt: null },
    });
    if (!venc) return reply.status(404).send({ ok: false, error: "NOT_FOUND" });

    await prisma.vencimiento.update({
      where: { id },
      data: { archivedAt: new Date(), updatedAt: new Date() },
    });

    return reply.send({ ok: true });
  });
}
