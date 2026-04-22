"use client";

import Link from "next/link";
import { Briefcase, CalendarClock } from "lucide-react";
import { Expediente } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

interface ClientExpedientesTabProps {
  clientId: string;
  expedientes: Expediente[];
  isLoading: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  activo:     "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
  cerrado:    "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
  archivado:  "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500",
  suspendido: "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
};

const STATUS_LABELS: Record<string, string> = {
  activo: "Activo",
  cerrado: "Cerrado",
  archivado: "Archivado",
  suspendido: "Suspendido",
};

export function ClientExpedientesTab({
  clientId,
  expedientes,
  isLoading,
}: ClientExpedientesTabProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Expedientes
          </h3>
          {expedientes.length > 0 && (
            <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full font-medium">
              {expedientes.length}
            </span>
          )}
        </div>
        <Link
          href={`/expedientes?clientId=${clientId}`}
          className="text-xs text-primary hover:underline font-medium"
        >
          Ver todos
        </Link>
      </div>

      {isLoading ? (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3.5 animate-pulse">
              <div className="size-8 rounded bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-40 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="h-2.5 w-24 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : expedientes.length === 0 ? (
        <div className="flex flex-col items-center text-center gap-3 py-10 px-5">
          <div className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sin expedientes</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Creá un expediente y asignalo a este cliente.
            </p>
          </div>
          <Link
            href="/expedientes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline mt-1"
          >
            Ir a Expedientes
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {expedientes.map((exp) => {
            const isOverdue = exp.deadline && new Date(exp.deadline) < new Date();
            return (
              <Link
                key={exp.id}
                href={`/expedientes/${exp.id}`}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
              >
                <div className="size-8 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                    {exp.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 capitalize">{exp.matter}</span>
                    {exp.deadline && (
                      <span className={cn(
                        "flex items-center gap-1 text-xs",
                        isOverdue ? "text-red-500" : "text-slate-400"
                      )}>
                        <CalendarClock className="w-3 h-3" />
                        {new Date(exp.deadline).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0",
                  STATUS_COLORS[exp.status] ?? "bg-slate-100 text-slate-500"
                )}>
                  {STATUS_LABELS[exp.status] ?? exp.status}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
