"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  CalendarClock, Loader2, Plus, CheckCircle2, Clock,
  AlertTriangle, Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";
import { listVencimientos, Vencimiento } from "@/app/lib/webApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  audiencia:            "Audiencia",
  presentacion:         "Presentación",
  prescripcion:         "Prescripción",
  plazo_legal:          "Plazo legal",
  vencimiento_contrato: "Vto. contrato",
  notificacion:         "Notificación",
  pericia:              "Pericia",
  traslado:             "Traslado",
  otro:                 "Otro",
};

function getUrgency(v: Vencimiento): "vencido" | "urgente" | "proximo" | "normal" | "ok" {
  if (v.estado === "completado") return "ok";
  if (v.estado === "vencido") return "vencido";
  const diff = new Date(v.fechaVencimiento).getTime() - Date.now();
  const days = diff / (1000 * 60 * 60 * 24);
  if (days < 0)  return "vencido";
  if (days <= 3) return "urgente";
  if (days <= 7) return "proximo";
  return "normal";
}

const URGENCY_CONFIG = {
  vencido: { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",   icon: AlertTriangle, dot: "bg-red-500"    },
  urgente: { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300", icon: AlertTriangle, dot: "bg-orange-500" },
  proximo: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",     icon: Clock,         dot: "bg-amber-500"  },
  normal:  { color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",         icon: CalendarClock, dot: "bg-slate-400"  },
  ok:      { color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300", icon: CheckCircle2, dot: "bg-emerald-500" },
};

function formatDate(str: string) {
  return new Date(str).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ExpedienteVencimientosTabProps {
  expedienteId: string;
}

export function ExpedienteVencimientosTab({ expedienteId }: ExpedienteVencimientosTabProps) {
  const [items, setItems]     = useState<Vencimiento[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listVencimientos({ expedienteId, pageSize: 100 });
      setItems(res.items);
      setTotal(res.total);
    } catch {
      // Silently fail — not critical
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
      {/* Actions header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {total > 0 ? `${total} vencimiento${total !== 1 ? "s" : ""}` : "Sin vencimientos"}
        </p>
        <Link href={`/vencimientos?create=1&expedienteId=${expedienteId}`}>
          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
            <Plus className="w-3.5 h-3.5" />
            Agregar vencimiento
          </Button>
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
          <CalendarClock className="w-10 h-10 text-slate-200 dark:text-slate-700" />
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No hay vencimientos asociados
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Los vencimientos vinculados a este expediente aparecerán aquí
            </p>
          </div>
          <Link href={`/vencimientos?create=1&expedienteId=${expedienteId}`}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs mt-1">
              <Plus className="w-3.5 h-3.5" />
              Agregar primer vencimiento
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((v) => {
            const urgency = getUrgency(v);
            const cfg = URGENCY_CONFIG[urgency];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={v.id}
                className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className={cn("p-1.5 rounded-lg flex-shrink-0", cfg.color)}>
                  <StatusIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 dark:text-white leading-snug truncate">
                      {v.titulo}
                    </p>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0",
                      cfg.color
                    )}>
                      {urgency === "ok" ? "Completado" :
                       urgency === "vencido" ? "Vencido" :
                       urgency === "urgente" ? "Urgente" :
                       urgency === "proximo" ? "Próximo" : "Pendiente"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                    <CalendarClock className="w-3 h-3 flex-shrink-0" />
                    {formatDate(v.fechaVencimiento)}
                    {v.tipo && v.tipo !== "otro" && (
                      <>
                        <Circle className="w-1 h-1 fill-current flex-shrink-0" />
                        {TIPO_LABELS[v.tipo] ?? v.tipo}
                      </>
                    )}
                  </p>
                  {v.descripcion && (
                    <p className="text-xs text-slate-400 mt-1 truncate">{v.descripcion}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Link to full vencimientos view */}
      {items.length > 0 && (
        <div className="pt-1">
          <Link
            href={`/vencimientos?expedienteId=${expedienteId}`}
            className="text-xs text-primary hover:underline font-medium"
          >
            Ver en módulo de Vencimientos →
          </Link>
        </div>
      )}
    </div>
  );
}
