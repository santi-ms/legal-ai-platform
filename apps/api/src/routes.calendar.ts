/**
 * Calendar Routes — Vencimientos de expedientes en vista de calendario
 * GET /expedientes/calendar?year=YYYY&month=M  — deadlines del mes/año indicado
 */

import { FastifyInstance } from "fastify";
import { z } from "zod";
import { getUserFromRequest } from "./utils/auth.js";
import { prisma } from "./db.js";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const CalendarQuerySchema = z.object({
  year:  z.coerce.number().int().min(2000).max(2100).default(() => new Date().getFullYear()),
  month: z.coerce.number().int().min(1).max(12).default(() => new Date().getMonth() + 1),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUrgency(deadline: Date, now: Date): "overdue" | "urgent" | "warning" | "normal" {
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0)  return "overdue";
  if (diffDays <= 3) return "urgent";
  if (diffDays <= 7) return "warning";
  return "normal";
}

// ─── Routes ──────────────────────────────────────────────────────────────────

export async function registerCalendarRoutes(app: FastifyInstance) {

  /**
   * GET /expedientes/calendar
   * Returns all expedientes with deadlines in a given month, grouped by date.
   *
   * Query params:
   *   year  — 4-digit year (default: current year)
   *   month — 1-based month (default: current month)
   */
  app.get("/expedientes/calendar", async (request, reply) => {
    const user = getUserFromRequest(request);
    if (!user) {
      return reply.status(401).send({ ok: false, error: "UNAUTHORIZED" });
    }
    if (!user.tenantId) {
      return reply.status(403).send({ ok: false, error: "TENANT_REQUIRED" });
    }

    const parsed = CalendarQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({ ok: false, error: "INVALID_QUERY", details: parsed.error.format() });
    }

    const { year, month } = parsed.data;

    // First and last millisecond of the requested month
    const from = new Date(year, month - 1, 1, 0, 0, 0, 0);        // 1st of month, 00:00:00
    const to   = new Date(year, month, 1, 0, 0, 0, -1);           // Last ms of month

    const expedientes = await prisma.expediente.findMany({
      where: {
        tenantId: user.tenantId,
        deadline: { gte: from, lte: to },
      },
      orderBy: { deadline: "asc" },
      select: {
        id: true,
        number: true,
        title: true,
        matter: true,
        status: true,
        deadline: true,
        court: true,
        client: { select: { id: true, name: true } },
      },
    });

    const now = new Date();

    // Group by date in Argentina timezone (UTC-3)
    // We shift the UTC time by -3h so getUTC* methods return Argentina local date
    const AR_OFFSET_MS = -3 * 60 * 60 * 1000;

    function toArgentinaDateKey(d: Date): string {
      const ar = new Date(d.getTime() - AR_OFFSET_MS);
      return `${ar.getUTCFullYear()}-${String(ar.getUTCMonth() + 1).padStart(2, "0")}-${String(ar.getUTCDate()).padStart(2, "0")}`;
    }

    type DeadlineItem = {
      id: string;
      number: string | null;
      title: string;
      matter: string;
      status: string;
      court: string | null;
      client: { id: string; name: string } | null;
      deadline: string;
      dateKey: string;
      urgency: ReturnType<typeof getUrgency>;
    };

    const byDate = new Map<string, DeadlineItem[]>();

    const deadlines: DeadlineItem[] = expedientes.map((exp) => {
      const dl = exp.deadline!;
      const dateKey = toArgentinaDateKey(dl);
      const item: DeadlineItem = {
        id: exp.id,
        number: exp.number,
        title: exp.title,
        matter: exp.matter,
        status: exp.status,
        court: exp.court,
        client: exp.client,
        deadline: dl.toISOString(),
        dateKey,
        urgency: getUrgency(dl, now),
      };
      if (!byDate.has(dateKey)) byDate.set(dateKey, []);
      byDate.get(dateKey)!.push(item);
      return item;
    });

    // Convert map to sorted array
    const days = Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => ({ date, items }));

    // Summary counts for the whole month
    const summary = {
      total:   deadlines.length,
      overdue: deadlines.filter((d) => d.urgency === "overdue").length,
      urgent:  deadlines.filter((d) => d.urgency === "urgent").length,
      warning: deadlines.filter((d) => d.urgency === "warning").length,
      normal:  deadlines.filter((d) => d.urgency === "normal").length,
    };

    return reply.send({ ok: true, year, month, days, summary });
  });
}
