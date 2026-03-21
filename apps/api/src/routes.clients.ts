/**
 * Client Routes — CRUD de clientes del estudio
 * GET    /clients           — listar con búsqueda + paginado
 * POST   /clients           — crear cliente
 * GET    /clients/:id       — obtener cliente
 * PUT    /clients/:id       — actualizar cliente
 * DELETE /clients/:id       — eliminar cliente
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";

// ─── Schemas ─────────────────────────────────────────────────────────────────

const ClientBodySchema = z.object({
  type: z.enum(["persona_fisica", "persona_juridica"]).default("persona_fisica"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  documentType: z.enum(["DNI", "CUIT", "CUIL", "Pasaporte"]).optional().nullable(),
  documentNumber: z.string().max(50).optional().nullable(),
  email: z.string().email("Email inválido").optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  province: z.string().max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

const ClientsQuerySchema = z.object({
  query: z.string().optional(),
  type: z.enum(["persona_fisica", "persona_juridica"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["createdAt:asc", "createdAt:desc", "name:asc", "name:desc"]).default("name:asc"),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function unauthorized(reply: any) {
  return reply.status(401).send({ ok: false, error: "UNAUTHORIZED", message: "Autenticación requerida" });
}

function notFound(reply: any) {
  return reply.status(404).send({ ok: false, error: "NOT_FOUND", message: "Cliente no encontrado" });
}

async function getTenantId(request: any, reply: any): Promise<string | null> {
  const user = getUserFromRequest(request);
  if (!user) { unauthorized(reply); return null; }
  if (!user.tenantId) {
    reply.status(403).send({ ok: false, error: "TENANT_REQUIRED", message: "El usuario no tiene un tenant asignado." });
    return null;
  }
  return user.tenantId;
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerClientRoutes(app: FastifyInstance) {

  // ── GET /clients ───────────────────────────────────────────────────────────
  app.get("/clients", async (request, reply) => {
    const tenantId = await getTenantId(request, reply);
    if (!tenantId) return;

    const parsed = ClientsQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_QUERY", details: parsed.error.format() });
    }

    const { query, type, page, pageSize, sort } = parsed.data;
    const [sortField, sortDir] = sort.split(":");

    const where: any = { tenantId };
    if (type) where.type = type;
    if (query) {
      where.OR = [
        { name:           { contains: query, mode: "insensitive" } },
        { email:          { contains: query, mode: "insensitive" } },
        { documentNumber: { contains: query, mode: "insensitive" } },
        { phone:          { contains: query, mode: "insensitive" } },
        { city:           { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        orderBy: { [sortField]: sortDir },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          type: true,
          name: true,
          documentType: true,
          documentNumber: true,
          email: true,
          phone: true,
          city: true,
          province: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return reply.send({ ok: true, clients, total, page, pageSize });
  });

  // ── POST /clients ──────────────────────────────────────────────────────────
  app.post("/clients", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return unauthorized(reply);
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const parsed = ClientBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.format() });
    }

    const data = parsed.data;

    const client = await prisma.client.create({
      data: {
        tenantId: user.tenantId,
        createdById: user.id,
        type: data.type,
        name: data.name.trim(),
        documentType: data.documentType ?? null,
        documentNumber: data.documentNumber?.trim() ?? null,
        email: data.email?.toLowerCase().trim() ?? null,
        phone: data.phone?.trim() ?? null,
        address: data.address?.trim() ?? null,
        city: data.city?.trim() ?? null,
        province: data.province ?? null,
        notes: data.notes?.trim() ?? null,
      },
    });

    return reply.status(201).send({ ok: true, client });
  });

  // ── GET /clients/:id ───────────────────────────────────────────────────────
  app.get("/clients/:id", async (request, reply) => {
    const tenantId = await getTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };

    const client = await prisma.client.findFirst({
      where: { id, tenantId },
    });

    if (!client) return notFound(reply);

    return reply.send({ ok: true, client });
  });

  // ── PUT /clients/:id ───────────────────────────────────────────────────────
  app.put("/clients/:id", async (request, reply) => {
    const tenantId = await getTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };

    const existing = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!existing) return notFound(reply);

    const parsed = ClientBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "VALIDATION_ERROR", details: parsed.error.format() });
    }

    const data = parsed.data;

    const client = await prisma.client.update({
      where: { id },
      data: {
        type: data.type,
        name: data.name.trim(),
        documentType: data.documentType ?? null,
        documentNumber: data.documentNumber?.trim() ?? null,
        email: data.email?.toLowerCase().trim() ?? null,
        phone: data.phone?.trim() ?? null,
        address: data.address?.trim() ?? null,
        city: data.city?.trim() ?? null,
        province: data.province ?? null,
        notes: data.notes?.trim() ?? null,
      },
    });

    return reply.send({ ok: true, client });
  });

  // ── DELETE /clients/:id ────────────────────────────────────────────────────
  app.delete("/clients/:id", async (request, reply) => {
    const tenantId = await getTenantId(request, reply);
    if (!tenantId) return;

    const { id } = request.params as { id: string };

    const existing = await prisma.client.findFirst({ where: { id, tenantId } });
    if (!existing) return notFound(reply);

    await prisma.client.delete({ where: { id } });

    return reply.send({ ok: true, message: "Cliente eliminado correctamente" });
  });
}
