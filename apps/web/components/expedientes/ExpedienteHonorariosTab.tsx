"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, Loader2, Plus, Circle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";
import {
  listHonorarios, Honorario, HonorarioEstado, HonorarioTipo,
} from "@/app/lib/webApi";

// ����─ Config ───────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<HonorarioTipo, string> = {
  consulta:  "Consulta",
  juicio:    "Juicio",
  acuerdo:   "Acuerdo",
  mediacion: "Mediación",
  otro:      "Otro",
};

const ESTADO_LABELS: Record<HonorarioEstado, string> = {
  presupuestado: "Presupuestado",
  facturado:     "Facturado",
  cobrado:       "Cobrado",
  cancelado:     "Cancelado",
};

const ESTADO_COLORS: Record<HonorarioEstado, string> = {
  presupuestado: "bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-300",
  facturado:     "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
  cobrado:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelado:     "bg-slate-100   text-slate-500   dark:bg-slate-800   dark:text-slate-500",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatARS(amount: number, moneda = "ARS") {
  try {
    return new Intl.NumberFormat("es-AR", {
      style: "currency", currency: moneda, maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `$${amount.toLocaleString("es-AR")}`;
  }
}

function formatDate(str: string | null | undefined) {
  if (!str) return null;
  return new Date(str).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ExpedienteHonorariosTabProps {
  expedienteId: string;
}

export function ExpedienteHonorariosTab({ expedienteId }: ExpedienteHonorariosTabProps) {
  const [items, setItems]   = useState<Honorario[]>([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  // Totals by estado
  const [totals, setTotals] = useState({
    cobrado:       0,
    facturado:     0,
    presupuestado: 0,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listHonorarios({ expedienteId, pageSize: 100 });
      setItems(res.honorarios);
      setTotal(res.total);

      // Compute totals
      const t = { cobrado: 0, facturado: 0, presupuestado: 0 };
      for (const h of res.honorarios) {
        if (h.estado === "cobrado")       t.cobrado       += h.monto ?? 0;
        if (h.estado === "facturado")     t.facturado     += h.monto ?? 0;
        if (h.estado === "presupuestado") t.presupuestado += h.monto ?? 0;
      }
      setTotals(t);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [expedienteId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary tiles (only when data exists) */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Cobrado",        value: totals.cobrado,       color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Facturado",      value: totals.facturado,     color: "text-violet-600  dark:text-violet-400"  },
            { label: "Presupuestado",  value: totals.presupuestado, color: "text-sky-600     dark:text-sky-400"     },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center"
            >
              <p className={cn("text-sm font-bold", color)}>
                {formatARS(value)}
              </p>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mt-0.5">
                {label}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Actions header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {total > 0 ? `${total} honorario${total !== 1 ? "s" : ""}` : "Sin honorarios"}
        </p>
        <Link href={`/finanzas?formOpen=1&expedienteId=${expedienteId}`}>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Agregar honorario
          </Button>
        </Link>
      </div>

      {/* List */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <DollarSign className="w-10 h-10 text-slate-200 dark:text-slate-700" />
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No hay honorarios asociados
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Los honorarios vinculados a este expediente aparecerán aquí
            </p>
          </div>
          <Link href={`/finanzas?formOpen=1&expedienteId=${expedienteId}`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs mt-1">
              <Plus className="w-3.5 h-3.5" />
              Registrar primer honorario
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((h) => {
            const isOverdue =
              h.estado !== "cobrado" &&
              h.estado !== "cancelado" &&
              h.fechaVencimiento &&
              new Date(h.fechaVencimiento).getTime() < Date.now();
            return (
              <div
                key={h.id}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">
                    {h.concepto}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <span>{TIPO_LABELS[h.tipo]}</span>
                    {h.fechaEmision && (
                      <>
                        <Circle className="w-1 h-1 fill-current" />
                        <span>{formatDate(h.fechaEmision)}</span>
                      </>
                    )}
                    {isOverdue && (
                      <>
                        <Circle className="w-1 h-1 fill-current" />
                        <span className="text-red-500 font-medium">Vencido</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    {formatARS(h.monto, h.moneda)}
                  </p>
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    ESTADO_COLORS[h.estado]
                  )}>
                    {ESTADO_LABELS[h.estado]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link to full honorarios view */}
      {items.length > 0 && (
        <div className="pt-1 flex items-center gap-2">
          <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
          <Link
            href={`/finanzas?expedienteId=${expedienteId}`}
            className="text-xs text-primary hover:underline font-medium"
          >
            Ver en módulo de Finanzas →
          </Link>
        </div>
      )}
    </div>
  );
}
