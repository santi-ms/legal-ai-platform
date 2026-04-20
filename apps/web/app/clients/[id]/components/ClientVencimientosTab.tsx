"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Vencimiento } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

interface ClientVencimientosTabProps {
  clientId: string;
  vencimientos: Vencimiento[];
  isLoading: boolean;
}

const TIPO_LABELS: Record<string, string> = {
  audiencia: "Audiencia",
  presentacion: "Presentación",
  prescripcion: "Prescripción",
  plazo_legal: "Plazo legal",
  vencimiento_contrato: "Vto. contrato",
  notificacion: "Notificación",
  pericia: "Pericia",
  traslado: "Traslado",
  otro: "Otro",
};

export function ClientVencimientosTab({
  clientId,
  vencimientos,
  isLoading,
}: ClientVencimientosTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-violet-500" />
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Vencimientos</h2>
          {vencimientos.length > 0 && (
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
              {vencimientos.length}
            </span>
          )}
        </div>
        <Link
          href={`/vencimientos?clientId=${clientId}`}
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
      ) : vencimientos.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-5">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <CalendarClock className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sin vencimientos</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Creá un vencimiento y asignalo a este cliente.
            </p>
          </div>
          <Link
            href={`/vencimientos?create=1&clientId=${clientId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1"
          >
            Crear vencimiento
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {vencimientos.map((v) => {
            const now = Date.now();
            const fv = new Date(v.fechaVencimiento).getTime();
            const days = Math.round((fv - now) / 86_400_000);
            const isPast = fv < now;
            const isCompleted = v.estado === "completado";

            return (
              <div key={v.id} className="flex items-center gap-3 px-5 py-3">
                <div className={cn(
                  "size-8 rounded flex items-center justify-center flex-shrink-0",
                  isCompleted
                    ? "bg-emerald-50 dark:bg-emerald-900/20"
                    : isPast
                    ? "bg-red-50 dark:bg-red-900/20"
                    : "bg-violet-50 dark:bg-violet-900/20"
                )}>
                  <CalendarClock className={cn(
                    "w-4 h-4",
                    isCompleted
                      ? "text-emerald-600 dark:text-emerald-400"
                      : isPast
                      ? "text-red-600 dark:text-red-400"
                      : "text-violet-600 dark:text-violet-400"
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{v.titulo}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {TIPO_LABELS[v.tipo] ?? v.tipo}
                    {" · "}
                    {new Date(v.fechaVencimiento).toLocaleDateString("es-AR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                    {v.expediente && ` · ${v.expediente.title.slice(0, 20)}…`}
                  </p>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                  isCompleted
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : isPast
                    ? "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                    : days <= 3
                    ? "bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                )}>
                  {isCompleted
                    ? "Completado"
                    : isPast
                    ? "Vencido"
                    : days === 0
                    ? "Hoy"
                    : days === 1
                    ? "Mañana"
                    : `En ${days}d`}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
