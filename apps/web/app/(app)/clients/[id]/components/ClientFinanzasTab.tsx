"use client";

import Link from "next/link";
import { DollarSign } from "lucide-react";
import { Honorario } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

interface ClientFinanzasTabProps {
  clientId: string;
  honorarios: Honorario[];
  isLoading: boolean;
}

const ESTADO_COLORS: Record<string, string> = {
  cobrado:       "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
  facturado:     "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
  presupuestado: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
  cancelado:     "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
};

const ESTADO_LABELS: Record<string, string> = {
  cobrado: "Cobrado",
  facturado: "Facturado",
  presupuestado: "Presupuestado",
  cancelado: "Cancelado",
};

export function ClientFinanzasTab({
  clientId,
  honorarios,
  isLoading,
}: ClientFinanzasTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-emerald-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Honorarios</h2>
          {honorarios.length > 0 && (
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
              {honorarios.length}
            </span>
          )}
        </div>
        <Link
          href={`/finanzas?clientId=${clientId}`}
          className="text-xs text-primary hover:underline font-medium"
        >
          Ver todos
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3 animate-pulse">
              <div className="size-8 rounded bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : honorarios.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-8 px-5">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sin honorarios</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Registrá honorarios en el módulo Finanzas.
            </p>
          </div>
          <Link href="/finanzas" className="text-xs font-semibold text-primary hover:underline mt-1">
            Ir a Finanzas
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {honorarios.map((h) => (
            <div key={h.id} className="flex items-center gap-3 px-5 py-3">
              <div className="size-8 rounded bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{h.concepto}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {new Date(h.fechaEmision).toLocaleDateString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                  {h.expediente && ` · ${h.expediente.title.slice(0, 25)}…`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  ${h.monto.toLocaleString("es-AR")}
                </span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  ESTADO_COLORS[h.estado] ?? "bg-slate-100 text-slate-500"
                )}>
                  {ESTADO_LABELS[h.estado] ?? h.estado}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
