/**
 * Stats / Analytics Routes
 *
 * GET /stats/overview   — resumen completo del estudio para la página de Analytics
 *
 * Retorna:
 *   - ingresosPorMes[]    — honorarios cobrados/facturados, últimos 6 meses
 *   - expedientesPorMateria[] — distribución por materia
 *   - expedientesPorEstado[]  — distribución por estado
 *   - honorariosPorEstado[]   — monto y cantidad por estado
 *   - actuacionesPorTipo[]    — conteo últimos 30 días
 *   - clientesNuevosPorMes[]  — altas, últimos 6 meses
 *   - vencimientosStats       — resumen de vencimientos
 *   - totals                  — contadores rápidos
 */

import { FastifyInstance } from "fastify";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns array of { year, month } for the last N months (inclusive of current) */
function lastNMonths(n: number): Array<{ year: number; month: number; label: string }> {
  const result: Array<{ year: number; month: number; label: string }> = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      year:  d.getFullYear(),
      month: d.getMonth() + 1,
      label: d.toLocaleDateString("es-AR", { month: "short", year: "2-digit" }),
    });
  }
  return result;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export async function registerStatsRoutes(app: FastifyInstance) {

  /**
   * GET /stats/overview
   * Devuelve el dashboard de analytics completo para el tenant.
   */
  app.get("/stats/overview", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    if (!user.tenantId) return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });

    const tenantId = user.tenantId;
    const now      = new Date();
    const months   = lastNMonths(6);

    // ── Parallel queries ───────────────────────────────────────────────────────
    const [
      expedientesByMatter,
      expedientesByStatus,
      honorariosByEstado,
      honorariosRaw,
      clientesRaw,
      actuacionesLast30,
      vencimientosStats,
      totals,
    ] = await Promise.all([

      // 1. Expedientes por materia
      prisma.expediente.groupBy({
        by: ["matter"],
        where: { tenantId },
        _count: { _all: true },
        orderBy: { _count: { matter: "desc" } },
      }),

      // 2. Expedientes por estado
      prisma.expediente.groupBy({
        by: ["status"],
        where: { tenantId },
        _count: { _all: true },
      }),

      // 3. Honorarios por estado (monto total + cantidad)
      prisma.honorario.groupBy({
        by: ["estado"],
        where: { tenantId },
        _sum: { monto: true },
        _count: { _all: true },
      }),

      // 4. Honorarios cobrados + facturados por mes (últimos 6)
      prisma.honorario.findMany({
        where: {
          tenantId,
          estado: { in: ["cobrado", "facturado"] },
          fechaEmision: {
            gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          },
        },
        select: { monto: true, moneda: true, estado: true, fechaEmision: true },
      }),

      // 5. Clientes nuevos por mes (últimos 6)
      prisma.client.findMany({
        where: {
          tenantId,
          archivedAt: null,
          createdAt: {
            gte: new Date(now.getFullYear(), now.getMonth() - 5, 1),
          },
        },
        select: { createdAt: true },
      }),

      // 6. Actuaciones por tipo — últimos 30 días
      prisma.actuacion.groupBy({
        by: ["tipo"],
        where: {
          tenantId,
          archivedAt: null,
          fecha: { gte: new Date(now.getTime() - 30 * 86_400_000) },
        },
        _count: { _all: true },
        orderBy: { _count: { tipo: "desc" } },
      }),

      // 7. Vencimientos stats
      prisma.vencimiento.groupBy({
        by: ["estado"],
        where: { tenantId, archivedAt: null },
        _count: { _all: true },
      }),

      // 8. Totals (quick counts)
      Promise.all([
        prisma.expediente.count({ where: { tenantId } }),
        prisma.client.count({ where: { tenantId, archivedAt: null } }),
        prisma.honorario.aggregate({
          where: { tenantId, estado: "cobrado" },
          _sum: { monto: true },
        }),
        prisma.document.count({ where: { tenantId } }),
        prisma.actuacion.count({ where: { tenantId, archivedAt: null } }),
      ]),

    ]);

    const [
      totalExpedientes,
      totalClientes,
      totalCobrado,
      totalDocumentos,
      totalActuaciones,
    ] = totals;

    // ── Shape: ingresos por mes ────────────────────────────────────────────────
    const ingresosMap: Record<string, { cobrado: number; facturado: number }> = {};
    for (const m of months) {
      const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
      ingresosMap[key] = { cobrado: 0, facturado: 0 };
    }
    for (const h of honorariosRaw) {
      const d = new Date(h.fechaEmision);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (ingresosMap[key]) {
        if (h.estado === "cobrado")   ingresosMap[key].cobrado   += h.monto;
        if (h.estado === "facturado") ingresosMap[key].facturado += h.monto;
      }
    }

    const ingresosPorMes = months.map((m) => {
      const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
      return { ...m, key, ...ingresosMap[key] };
    });

    // ── Shape: clientes nuevos por mes ────────────────────────────────────────
    const clientesMap: Record<string, number> = {};
    for (const m of months) {
      clientesMap[`${m.year}-${String(m.month).padStart(2, "0")}`] = 0;
    }
    for (const c of clientesRaw) {
      const d = new Date(c.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (clientesMap[key] !== undefined) clientesMap[key]++;
    }
    const clientesPorMes = months.map((m) => {
      const key = `${m.year}-${String(m.month).padStart(2, "0")}`;
      return { ...m, key, nuevos: clientesMap[key] ?? 0 };
    });

    // ── Shape: vencimientos ───────────────────────────────────────────────────
    const vencStats: Record<string, number> = {};
    for (const v of vencimientosStats) vencStats[v.estado] = v._count._all;

    // ── Response ──────────────────────────────────────────────────────────────
    return reply.send({
      ok: true,
      data: {
        totals: {
          expedientes:  totalExpedientes,
          clientes:     totalClientes,
          cobrado:      totalCobrado._sum.monto ?? 0,
          documentos:   totalDocumentos,
          actuaciones:  totalActuaciones,
        },
        ingresosPorMes,
        clientesPorMes,
        expedientesPorMateria: expedientesByMatter.map((e) => ({
          materia: e.matter,
          count:   e._count._all,
        })),
        expedientesPorEstado: expedientesByStatus.map((e) => ({
          estado: e.status,
          count:  e._count._all,
        })),
        honorariosPorEstado: honorariosByEstado.map((h) => ({
          estado: h.estado,
          monto:  h._sum.monto ?? 0,
          count:  h._count._all,
        })),
        actuacionesPorTipo: actuacionesLast30.map((a) => ({
          tipo:  a.tipo,
          count: a._count._all,
        })),
        vencimientos: {
          pendientes:  vencStats["pendiente"]  ?? 0,
          completados: vencStats["completado"] ?? 0,
          vencidos:    vencStats["vencido"]    ?? 0,
        },
      },
    });
  });
}
