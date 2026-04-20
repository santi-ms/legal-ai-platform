/**
 * Global Search Route
 *
 * GET /search?q=...&limit=10
 *
 * Busca en paralelo en:
 *   - Expedientes (title, number, court, judge, opposingParty)
 *   - Clientes (name, email, cuit, phone)
 *   - Documentos (type, content preview)
 *   - Vencimientos (titulo)
 *   - Actuaciones (titulo)
 *
 * Retorna resultados agrupados por categoría con URL de navegación.
 * Acceso: tenant-aware, solo recursos propios del tenant.
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const SearchQuerySchema = z.object({
  q:     z.string().min(1).max(200).trim(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

// ─── Result Types ─────────────────────────────────────────────────────────────

interface SearchResult {
  id:       string;
  type:     "expediente" | "client" | "document" | "vencimiento" | "actuacion";
  title:    string;
  subtitle: string | null;
  href:     string;
  badge?:   string;
}

interface SearchResponse {
  ok:      boolean;
  query:   string;
  results: SearchResult[];
  total:   number;
}

// ─── Route ────────────────────────────────────────────────────────────────────

export async function registerSearchRoutes(app: FastifyInstance) {

  app.get("/search", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const parsed = SearchQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_QUERY" });
    }

    const { q, limit } = parsed.data;
    const tenantId = user.tenantId;
    const term = `%${q.toLowerCase()}%`;

    // Run searches in parallel
    const [expedientes, clients, documents, vencimientos, actuaciones] = await Promise.allSettled([

      // ── Expedientes ──────────────────────────────────────────────────────────
      prisma.expediente.findMany({
        where: {
          tenantId,
          OR: [
            { title:         { contains: q, mode: "insensitive" } },
            { number:        { contains: q, mode: "insensitive" } },
            { court:         { contains: q, mode: "insensitive" } },
            { judge:         { contains: q, mode: "insensitive" } },
            { opposingParty: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, title: true, number: true, matter: true, status: true,
          client: { select: { name: true } },
        },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),

      // ── Clientes ─────────────────────────────────────────────────────────────
      prisma.client.findMany({
        where: {
          tenantId,
          archivedAt: null,
          OR: [
            { name:           { contains: q, mode: "insensitive" } },
            { email:          { contains: q, mode: "insensitive" } },
            { documentNumber: { contains: q, mode: "insensitive" } },
            { phone:          { contains: q, mode: "insensitive" } },
          ],
        },
        select: { id: true, name: true, type: true, email: true, documentNumber: true },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),

      // ── Documentos ───────────────────────────────────────────────────────────
      prisma.document.findMany({
        where: {
          tenantId,
          OR: [
            { type:  { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, type: true, jurisdiccion: true, createdAt: true,
          expediente: { select: { title: true } },
          versions:   { select: { status: true }, take: 1, orderBy: { createdAt: "desc" } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      }),

      // ── Vencimientos ─────────────────────────────────────────────────────────
      prisma.vencimiento.findMany({
        where: {
          tenantId,
          archivedAt: null,
          titulo: { contains: q, mode: "insensitive" },
        },
        select: {
          id: true, titulo: true, tipo: true, estado: true, fechaVencimiento: true,
          expediente: { select: { title: true } },
        },
        take: limit,
        orderBy: { fechaVencimiento: "asc" },
      }),

      // ── Actuaciones ──────────────────────────────────────────────────────────
      prisma.actuacion.findMany({
        where: {
          tenantId,
          archivedAt: null,
          OR: [
            { titulo:      { contains: q, mode: "insensitive" } },
            { descripcion: { contains: q, mode: "insensitive" } },
          ],
        },
        select: {
          id: true, titulo: true, tipo: true, fecha: true,
          expediente: { select: { id: true, title: true } },
        },
        take: limit,
        orderBy: { fecha: "desc" },
      }),

    ]);

    // ── Shape results ─────────────────────────────────────────────────────────
    const results: SearchResult[] = [];

    if (expedientes.status === "fulfilled") {
      const MATTER_ES: Record<string, string> = {
        civil: "Civil", penal: "Penal", laboral: "Laboral",
        familia: "Familia", comercial: "Comercial",
        administrativo: "Administrativo", otro: "Otro",
      };
      for (const e of expedientes.value) {
        results.push({
          id:       e.id,
          type:     "expediente",
          title:    e.title,
          subtitle: e.client?.name ?? (e.number ? `#${e.number}` : null),
          href:     `/expedientes/${e.id}`,
          badge:    MATTER_ES[e.matter] ?? e.matter,
        });
      }
    }

    if (clients.status === "fulfilled") {
      for (const c of clients.value) {
        results.push({
          id:       c.id,
          type:     "client",
          title:    c.name,
          subtitle: c.email ?? c.documentNumber ?? null,
          href:     `/clients/${c.id}`,
          badge:    c.type === "persona_juridica" ? "Empresa" : "Persona",
        });
      }
    }

    if (documents.status === "fulfilled") {
      const TYPE_ES: Record<string, string> = {
        service_contract:     "Contrato de servicios",
        nda:                  "Confidencialidad",
        legal_notice:         "Carta documento",
        lease:                "Contrato de alquiler",
        debt_recognition:     "Reconocimiento de deuda",
        simple_authorization: "Autorización",
      };
      for (const d of documents.value) {
        results.push({
          id:       d.id,
          type:     "document",
          title:    TYPE_ES[d.type] ?? d.type,
          subtitle: d.expediente?.title ?? null,
          href:     `/documents/${d.id}`,
          badge:    "Documento",
        });
      }
    }

    if (vencimientos.status === "fulfilled") {
      for (const v of vencimientos.value) {
        const fv = new Date(v.fechaVencimiento).toLocaleDateString("es-AR", {
          day: "numeric", month: "short", year: "numeric",
        });
        results.push({
          id:       v.id,
          type:     "vencimiento",
          title:    v.titulo,
          subtitle: v.expediente?.title ?? fv,
          href:     `/vencimientos`,
          badge:    v.estado === "completado" ? "Completado" : fv,
        });
      }
    }

    if (actuaciones.status === "fulfilled") {
      for (const a of actuaciones.value) {
        results.push({
          id:       a.id,
          type:     "actuacion",
          title:    a.titulo,
          subtitle: a.expediente?.title ?? null,
          href:     a.expediente ? `/expedientes/${a.expediente.id}?tab=actuaciones` : `/expedientes`,
          badge:    "Actuación",
        });
      }
    }

    return reply.send({
      ok:      true,
      query:   q,
      results,
      total:   results.length,
    } satisfies SearchResponse);
  });
}
