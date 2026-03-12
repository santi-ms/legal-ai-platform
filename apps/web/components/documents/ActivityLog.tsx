"use client";

import { CheckCircle2, Loader2, Clock } from "lucide-react";
import { cn } from "@/app/lib/utils";

export type ActivityStatus = "completed" | "processing" | "pending";

export interface ActivityLogItem {
  id: string;
  operation: string;
  details?: string;
  status: ActivityStatus;
}

interface ActivityLogProps {
  items: ActivityLogItem[];
  version?: string;
  className?: string;
}

const statusConfig: Record<
  ActivityStatus,
  { icon: typeof CheckCircle2; label: string; className: string; iconClassName: string }
> = {
  completed: {
    icon: CheckCircle2,
    label: "COMPLETADO",
    className: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
    iconClassName: "text-green-500",
  },
  processing: {
    icon: Loader2,
    label: "PROCESANDO",
    className: "bg-primary/20 text-primary animate-pulse",
    iconClassName: "text-primary animate-spin",
  },
  pending: {
    icon: Clock,
    label: "PENDIENTE",
    className: "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
    iconClassName: "text-slate-400",
  },
};

export function ActivityLog({ items, version = "v4.2.0-legal-engine", className }: ActivityLogProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-slate-900 dark:text-white text-lg font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">terminal</span>
          Registro de Actividad en Tiempo Real
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{version}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-900/50">
              <th className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider">
                Operación del Sistema
              </th>
              <th className="px-6 py-4 text-slate-600 dark:text-slate-400 text-sm font-semibold uppercase tracking-wider w-40 text-center">
                Estado
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => {
              const config = statusConfig[item.status];
              const Icon = config.icon;
              const isProcessing = item.status === "processing";
              const isPending = item.status === "pending";

              return (
                <tr
                  key={item.id}
                  className={cn(
                    "hover:bg-slate-50 dark:hover:bg-slate-900/30 transition-colors",
                    isProcessing && "bg-primary/5 dark:bg-primary/10",
                    isPending && "opacity-50"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Icon className={cn("text-sm", config.iconClassName)} />
                      <div>
                        <p
                          className={cn(
                            "text-sm",
                            isProcessing
                              ? "text-slate-900 dark:text-white font-semibold"
                              : "text-slate-900 dark:text-slate-200 font-medium"
                          )}
                        >
                          {item.operation}
                        </p>
                        {item.details && (
                          <p className="text-slate-400 dark:text-slate-500 text-xs font-mono">
                            {item.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold",
                        config.className
                      )}
                    >
                      {config.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

