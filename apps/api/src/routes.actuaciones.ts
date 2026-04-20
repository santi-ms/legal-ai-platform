/**
 * Actuaciones Routes — Registro / Diario de Causas
 *
 * GET    /expedientes/:expId/actuaciones           — listar (con filtros)
 * POST   /expedientes/:expId/actuaciones           — crear actuación
 * PUT    /expedientes/:expId/actuaciones/:id       — actualizar
 * DELETE /expedientes/:expId/actuaciones/:id       — archivar (soft delete)
 *
 * Acceso:  multi-tenant + usuario autenticado
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";

// ─── Constantes ───────────────────────────────────────────────────────────────

const TIPOS_ACTUACION = [
  "audiencia",
  "escrito",
  "notificacion",
  "resolucion",
  "pericia",
  "reunion_cliente",
  "pago",
  "otro",
] as const;

export type TipoActuacion = (typeof TIPOS_ACTUACION)[number];

export const TIPO_LABELS: Record<TipoActuacion, string> = {
  audiencia:       "Audiencia",
  escrito:         "Escrito",
  notificacion:    "Notificación",
  resolucion:      "Resolución",
  pericia:         "Pericia",
  reunion_cliente: "Reunión con cliente",
  pago:            "Pago",
  otro:            "Otro",
};

// ─── Schemas ──────────────────────────────────────────────────────────────────

const ActuacionBodySchema = z.object({
  tipo:        z.enum(TIPOS_ACTUACION).default("otro"),
  fecha:       z.string().datetime({ message: "Fecha inválida" }),
  titulo:      z.string().min(3, "El título debe tener al menos 3 caracteres").max(300),
  descripcion: z.string().max(5000).optional().nullable(),
  monto:       z.number().positive().optional().nullable(),
  moneda:      z.string().max(5).optional().nullable(),
  adjuntoUrl:  z.string().url().optional().nullable(),
});

const ActuacionQuerySchema = z.object({
  tipo:   z.enum(TIPOS_ACTUACION).optional(),
  limit:  z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Verifica que el expediente existe y pertenece al tenant del usuario */
async function getExpedienteOrFail(
  expId: string,
  tenantId: string
): Promise<{ id: string; title: string }> {
  const exp = await prisma.expediente.findFirst({
    where: { id: expId, tenantId },
    select: { id: true, title: true },
  });
  return exp as { id: string; title: string };
}

// ─── Dashboard query schema ────────────────────────────────────────────────────

const DashboardActivityQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function registerActuacionesRoutes(app: FastifyInstance) {

  /**
   * GET /dashboard/activity
   * Retorna las N actuaciones más recientes a través de todos los expedientes
   * del tenant. Usado por el widget "Actividad Reciente" del dashboard.
   */
  app.get("/dashboard/activity", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const parsed = DashboardActivityQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_QUERY" });
    }

    const { limit } = parsed.data;

    const actuaciones = await prisma.actuacion.findMany({
      where: {
        tenantId:  user.tenantId,
        archivedAt: null,
      },
      orderBy: { fecha: "desc" },
      take:    limit,
      include: {
        expediente: { select: { id: true, title: true, number: true } },
        createdBy:  { select: { id: true, name: true, firstName: true, lastName: true } },
      },
    });

    return reply.send({ ok: true, actuaciones });
  });

  /**
   * GET /expedientes/:expId/actuaciones
   * Lista todas las actuaciones de un expediente, ordenadas por fecha desc.
   */
  app.get("/expedientes/:expId/actuaciones", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { expId } = request.params as { expId: string };

    const exp = await getExpedienteOrFail(expId, user.tenantId);
    if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });

    const parsed = ActuacionQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_QUERY", details: parsed.error.flatten() });
    }
    const { tipo, limit, offset } = parsed.data;

    const where: Record<string, unknown> = {
      expedienteId: expId,
      tenantId:     user.tenantId,
      archivedAt:   null,
    };
    if (tipo) where["tipo"] = tipo;

    const [actuaciones, total] = await Promise.all([
      prisma.actuacion.findMany({
        where,
        orderBy: { fecha: "desc" },
        take: limit,
        skip: offset,
        include: {
          createdBy: {
            select: { id: true, name: true, firstName: true, lastName: true },
          },
        },
      }),
      prisma.actuacion.count({ where }),
    ]);

    return reply.send({ ok: true, actuaciones, total });
  });

  /**
   * POST /expedientes/:expId/actuaciones
   * Crea una nueva actuación en el expediente.
   */
  app.post("/expedientes/:expId/actuaciones", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { expId } = request.params as { expId: string };

    const exp = await getExpedienteOrFail(expId, user.tenantId);
    if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });

    const parsed = ActuacionBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.flatten() });
    }

    const actuacion = await prisma.actuacion.create({
      data: {
        tenantId:     user.tenantId,
        expedienteId: expId,
        createdById:  user.userId,
        tipo:         parsed.data.tipo,
        fecha:        new Date(parsed.data.fecha),
        titulo:       parsed.data.titulo,
        descripcion:  parsed.data.descripcion ?? null,
        monto:        parsed.data.monto ?? null,
        moneda:       parsed.data.moneda ?? null,
        adjuntoUrl:   parsed.data.adjuntoUrl ?? null,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
      },
    });

    return reply.status(201).send({ ok: true, actuacion });
  });

  /**
   * PUT /expedientes/:expId/actuaciones/:id
   * Actualiza una actuación existente.
   */
  app.put("/expedientes/:expId/actuaciones/:id", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { expId, id } = request.params as { expId: string; id: string };

    // Verify expediente belongs to tenant
    const exp = await getExpedienteOrFail(expId, user.tenantId);
    if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });

    // Verify actuación exists and belongs to expediente
    const existing = await prisma.actuacion.findFirst({
      where: { id, expedienteId: expId, tenantId: user.tenantId, archivedAt: null },
    });
    if (!existing) return reply.status(404).send({ ok: false, error: "ACTUACION_NOT_FOUND" });

    const parsed = ActuacionBodySchema.partial().safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.flatten() });
    }

    const updated = await prisma.actuacion.update({
      where: { id },
      data: {
        ...(parsed.data.tipo        !== undefined && { tipo: parsed.data.tipo }),
        ...(parsed.data.fecha       !== undefined && { fecha: new Date(parsed.data.fecha) }),
        ...(parsed.data.titulo      !== undefined && { titulo: parsed.data.titulo }),
        ...(parsed.data.descripcion !== undefined && { descripcion: parsed.data.descripcion }),
        ...(parsed.data.monto       !== undefined && { monto: parsed.data.monto }),
        ...(parsed.data.moneda      !== undefined && { moneda: parsed.data.moneda }),
        ...(parsed.data.adjuntoUrl  !== undefined && { adjuntoUrl: parsed.data.adjuntoUrl }),
      },
      include: {
        createdBy: {
          select: { id: true, name: true, firstName: true, lastName: true },
        },
      },
    });

    return reply.send({ ok: true, actuacion: updated });
  });

  /**
   * DELETE /expedientes/:expId/actuaciones/:id
   * Archiva una actuación (soft delete).
   */
  app.delete("/expedientes/:expId/actuaciones/:id", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const { expId, id } = request.params as { expId: string; id: string };

    const exp = await getExpedienteOrFail(expId, user.tenantId);
    if (!exp) return reply.status(404).send({ ok: false, error: "EXPEDIENTE_NOT_FOUND" });

    const existing = await prisma.actuacion.findFirst({
      where: { id, expedienteId: expId, tenantId: user.tenantId, archivedAt: null },
    });
    if (!existing) return reply.status(404).send({ ok: false, error: "ACTUACION_NOT_FOUND" });

    await prisma.actuacion.update({
      where: { id },
      data:  { archivedAt: new Date() },
    });

    return reply.send({ ok: true });
  });
}
