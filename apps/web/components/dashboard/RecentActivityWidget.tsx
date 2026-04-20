"use client";

/**
 * RecentActivityWidget — Últimas actuaciones de todos los expedientes del tenant.
 * Widget lateral del dashboard que muestra las N actuaciones más recientes
 * con icono según tipo, link al expediente y fecha relativa.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity, Gavel, FileText, Bell, BookOpen,
  FlaskConical, Users, CreditCard, HelpCircle, ArrowRight,
} from "lucide-react";
import { getDashboardActivity, type ActivityActuacion, TIPO_ACTUACION_LABELS } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

// ─── Icon & colour maps ────────────────────────────────────────────────────────

const TIPO_ICON: Record<string, React.ElementType> = {
  audiencia:       Gavel,
  escrito:         FileText,
  notificacion:    Bell,
  resolucion:      BookOpen,
  pericia:         FlaskConical,
  reunion_cliente: Users,
  pago:            CreditCard,
  otro:            HelpCircle,
};

const TIPO_COLOR: Record<string, string> = {
  audiencia:       "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  escrito:         "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  notificacion:    "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  resolucion:      "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  pericia:         "bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
  reunion_cliente: "bg-pink-500/15 text-pink-600 dark:text-pink-400",
  pago:            "bg-green-500/15 text-green-600 dark:text-green-400",
  otro:            "bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1)   return "ahora mismo";
  if (diffMin < 60)  return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24)    return `hace ${diffH}h`;
  const diffD = Math.round(diffH / 24);
  if (diffD === 1)   return "ayer";
  if (diffD < 7)     return `hace ${diffD}d`;
  return new Date(isoDate).toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function RecentActivityWidget() {
  const [items, setItems] = useState<ActivityActuacion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardActivity(8)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
            <Activity className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <span className="text-sm font-semibold text-white">Actividad Reciente</span>
        </div>
        <Link
          href="/expedientes"
          className="text-xs text-slate-400 hover:text-violet-400 flex items-center gap-1 transition-colors"
        >
          Ver todos
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {/* Body */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-slate-800 rounded w-3/4" />
                <div className="h-2.5 bg-slate-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-6">
          <Activity className="w-8 h-8 text-slate-700 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No hay actuaciones registradas aún</p>
          <Link
            href="/expedientes"
            className="text-xs text-violet-400 hover:text-violet-300 mt-1 inline-block"
          >
            Ir a expedientes →
          </Link>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((act) => {
            const Icon = TIPO_ICON[act.tipo] ?? HelpCircle;
            const colorClass = TIPO_COLOR[act.tipo] ?? TIPO_COLOR.otro;
            const label = TIPO_ACTUACION_LABELS[act.tipo] ?? act.tipo;
            const href = act.expediente
              ? `/expedientes/${act.expediente.id}?tab=actuaciones`
              : "/expedientes";

            return (
              <Link
                key={act.id}
                href={href}
                className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-800/60 transition-colors group"
              >
                {/* Icon */}
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5",
                  colorClass,
                )}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                    {act.titulo}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {act.expediente && (
                      <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                        {act.expediente.number
                          ? `#${act.expediente.number}`
                          : act.expediente.title.slice(0, 20)
                        }
                      </span>
                    )}
                    <span className="text-[11px] text-slate-600">·</span>
                    <span className="text-[11px] text-slate-500">{label}</span>
                    <span className="text-[11px] text-slate-600">·</span>
                    <span className="text-[11px] text-slate-500">{relativeTime(act.fecha)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
