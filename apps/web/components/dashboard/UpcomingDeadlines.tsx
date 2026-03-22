"use client";

/**
 * UpcomingDeadlines — Widget de vencimientos procesales para el dashboard.
 *
 * Muestra los próximos vencimientos de expedientes activos ordenados por fecha,
 * clasificados por urgencia con código de color:
 *   🔴 VENCIDO   — deadline ya pasó
 *   🔴 HOY       — vence hoy (pulsante)
 *   🟠 CRÍTICO   — 1–3 días
 *   🟡 ADVERTENCIA — 4–7 días
 *   🟢 PRÓXIMO   — 8–30 días
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { listExpedientes, type Expediente } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Urgency = "overdue" | "today" | "critical" | "warning" | "upcoming";

interface DeadlineItem extends Expediente {
  urgency: Urgency;
  daysLeft: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function classifyDeadline(isoDeadline: string): { urgency: Urgency; daysLeft: number } {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(isoDeadline);
  due.setHours(0, 0, 0, 0);
  const daysLeft = Math.round((due.getTime() - now.getTime()) / 86_400_000);

  if (daysLeft < 0)  return { urgency: "overdue",   daysLeft };
  if (daysLeft === 0) return { urgency: "today",    daysLeft };
  if (daysLeft <= 3) return { urgency: "critical",  daysLeft };
  if (daysLeft <= 7) return { urgency: "warning",   daysLeft };
  return               { urgency: "upcoming",  daysLeft };
}

function formatDaysLabel(urgency: Urgency, daysLeft: number): string {
  if (urgency === "overdue") {
    const abs = Math.abs(daysLeft);
    return abs === 1 ? "Venció ayer" : `Venció hace ${abs}d`;
  }
  if (urgency === "today")  return "Vence hoy";
  if (daysLeft === 1)       return "Vence mañana";
  return `En ${daysLeft} días`;
}

const URGENCY: Record<Urgency, { dot: string; badge: string }> = {
  overdue:  { dot: "bg-red-500",                     badge: "bg-red-500/20 text-red-300"      },
  today:    { dot: "bg-red-500 animate-pulse",        badge: "bg-red-500/20 text-red-300"      },
  critical: { dot: "bg-orange-500",                  badge: "bg-orange-500/20 text-orange-300" },
  warning:  { dot: "bg-yellow-400",                  badge: "bg-yellow-500/20 text-yellow-300" },
  upcoming: { dot: "bg-emerald-500",                 badge: "bg-emerald-500/20 text-emerald-300"},
};

const MATTER_SHORT: Record<string, string> = {
  civil: "Civil", penal: "Penal", laboral: "Laboral", familia: "Familia",
  comercial: "Comercial", administrativo: "Admin.", constitucional: "Const.",
  tributario: "Tribut.", otro: "Otro",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function UpcomingDeadlines() {
  const [items,   setItems]   = useState<DeadlineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const now     = new Date();
        // Window: 90 days in the past (overdue) → 30 days ahead
        const past30  = new Date(now.getTime() - 90 * 86_400_000).toISOString();
        const ahead30 = new Date(now.getTime() + 30 * 86_400_000).toISOString();

        const res = await listExpedientes({
          hasDeadline:    "true",
          status:         "activo",
          deadlineAfter:  past30,
          deadlineBefore: ahead30,
          sort:           "deadline:asc",
          pageSize:       8,
        });

        if (cancelled) return;

        const classified: DeadlineItem[] = res.expedientes
          .filter((e) => !!e.deadline)
          .map((e) => {
            const { urgency, daysLeft } = classifyDeadline(e.deadline!);
            return { ...e, urgency, daysLeft };
          });

        setItems(classified);
      } catch {
        // Widget is non-critical — fail silently
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const overdueCount = items.filter(
    (i) => i.urgency === "overdue" || i.urgency === "today"
  ).length;

  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
            <h3 className="font-bold text-sm">Próximos Vencimientos</h3>
            {overdueCount > 0 && (
              <span className="flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] leading-none">
                {overdueCount > 99 ? "99+" : overdueCount}
              </span>
            )}
          </div>
          <Link
            href="/expedientes"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 flex-shrink-0"
          >
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="size-2 rounded-full bg-white/20 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-36 rounded bg-white/10" />
                  <div className="h-2.5 w-20 rounded bg-white/10" />
                </div>
                <div className="h-5 w-16 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty state — no upcoming deadlines */
          <div className="py-5 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-slate-200 text-sm font-semibold">Todo al día</p>
            <p className="text-slate-500 text-xs">
              No hay vencimientos en los próximos 30 días.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const cfg   = URGENCY[item.urgency];
              const label = formatDaysLabel(item.urgency, item.daysLeft);

              return (
                <Link
                  key={item.id}
                  href={`/expedientes/${item.id}`}
                  className="flex items-center gap-3 group min-w-0"
                >
                  {/* Urgency dot */}
                  <div className={cn("size-2 rounded-full flex-shrink-0 mt-0.5", cfg.dot)} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-500">
                        {MATTER_SHORT[item.matter] ?? item.matter}
                      </span>
                      {item.client && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-500 truncate max-w-[72px]">
                            {item.client.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Badge */}
                  <span
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0",
                      cfg.badge
                    )}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
