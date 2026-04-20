"use client";

import React from "react";

/**
 * VencimientosWidget — Muestra los próximos vencimientos del módulo dedicado.
 * Se integra en el dashboard como widget lateral.
 * Permite marcar items como completados directamente desde el dashboard.
 */

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CalendarClock, ArrowRight, CheckCircle2, Plus, Circle } from "lucide-react";
import { listVencimientos, completeVencimiento, type Vencimiento } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

function daysUntil(dateStr: string): number {
  const now  = new Date(); now.setHours(0, 0, 0, 0);
  const date = new Date(dateStr); date.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / 86_400_000);
}

function labelAndColor(v: Vencimiento): {
  badge: string; label: string;
} {
  const d = daysUntil(v.fechaVencimiento);
  if (d < 0)   return { badge: "bg-red-500/20 text-red-300",         label: `Venció hace ${Math.abs(d)}d` };
  if (d === 0) return { badge: "bg-red-500/20 text-red-300",         label: "Vence hoy" };
  if (d <= 3)  return { badge: "bg-orange-500/20 text-orange-300",   label: `En ${d}d` };
  if (d <= 7)  return { badge: "bg-yellow-500/20 text-yellow-300",   label: `En ${d}d` };
  return        { badge: "bg-emerald-500/20 text-emerald-300",       label: `En ${d}d` };
}

function dotColor(v: Vencimiento): string {
  const d = daysUntil(v.fechaVencimiento);
  if (d < 0)   return "bg-red-500";
  if (d === 0) return "bg-red-500 animate-pulse";
  if (d <= 3)  return "bg-orange-500";
  if (d <= 7)  return "bg-yellow-400";
  return        "bg-emerald-500";
}

const TIPO_SHORT: Record<string, string> = {
  audiencia:             "Audiencia",
  presentacion:          "Presentación",
  prescripcion:          "Prescripción",
  plazo_legal:           "Plazo legal",
  vencimiento_contrato:  "Contrato",
  notificacion:          "Notificación",
  pericia:               "Pericia",
  traslado:              "Traslado",
  otro:                  "Otro",
};

export const VencimientosWidget = React.memo(function VencimientosWidget() {
  const [items,      setItems]      = useState<Vencimiento[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [completing, setCompleting] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    try {
      const res = await listVencimientos({
        estado:       "pendiente",
        upcomingDays: 30,
        pageSize:     7,
      });
      setItems(res.items.slice(0, 7));
    } catch {
      // non-critical widget
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then(() => { if (cancelled) return; });
    return () => { cancelled = true; };
  }, [load]);

  const handleComplete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (completing.has(id)) return;
    setCompleting(prev => new Set(prev).add(id));
    // Optimistically remove from list
    setItems(prev => prev.filter(v => v.id !== id));
    try {
      await completeVencimiento(id);
    } catch {
      // On error restore by reloading
      setLoading(true);
      await load();
    } finally {
      setCompleting(prev => { const s = new Set(prev); s.delete(id); return s; });
    }
  }, [completing, load]);

  const urgentCount = items.filter((v) => daysUntil(v.fechaVencimiento) <= 3).length;

  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Decorative glow */}
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-violet-400 flex-shrink-0" />
            <h3 className="font-bold text-sm">Vencimientos</h3>
            {urgentCount > 0 && (
              <span className="flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 min-w-[18px] leading-none">
                {urgentCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/vencimientos?create=1"
              className="text-slate-400 hover:text-white transition-colors"
              title="Nuevo vencimiento"
            >
              <Plus className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/vencimientos"
              className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1 flex-shrink-0"
            >
              Ver todos <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="size-2 rounded-full bg-white/20 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-36 rounded bg-white/10" />
                  <div className="h-2.5 w-20 rounded bg-white/10" />
                </div>
                <div className="h-5 w-12 rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-4 text-center space-y-2">
            <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
            <p className="text-slate-200 text-sm font-semibold">Sin vencimientos próximos</p>
            <Link
              href="/vencimientos"
              className="text-xs text-violet-400 hover:text-violet-300 underline"
            >
              Agregar vencimiento
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((v) => {
              const { badge, label } = labelAndColor(v);
              const isCompleting = completing.has(v.id);
              return (
                <div key={v.id} className="flex items-center gap-2.5 group min-w-0">
                  {/* Quick-complete checkbox */}
                  <button
                    onClick={(e) => handleComplete(v.id, e)}
                    disabled={isCompleting}
                    title="Marcar como completado"
                    className="flex-shrink-0 w-5 h-5 rounded-full border border-white/20 hover:border-emerald-400 hover:bg-emerald-500/20 transition-colors flex items-center justify-center disabled:opacity-50"
                  >
                    {isCompleting
                      ? <Circle className="w-3 h-3 text-white/40 animate-spin" />
                      : <Circle className="w-3 h-3 text-white/30 group-hover:text-emerald-400 transition-colors" />
                    }
                  </button>

                  <Link
                    href="/vencimientos"
                    className="flex items-center gap-2 flex-1 min-w-0 group/link"
                  >
                    <div className={cn("size-1.5 rounded-full flex-shrink-0", dotColor(v))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate group-hover/link:text-violet-300 transition-colors">
                        {v.titulo}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs text-slate-500">
                          {TIPO_SHORT[v.tipo] ?? v.tipo}
                        </span>
                        {v.expediente && (
                          <>
                            <span className="text-slate-700">·</span>
                            <span className="text-xs text-slate-500 truncate max-w-[70px]">
                              {v.expediente.title}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0", badge)}>
                      {label}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
