"use client";

import { Upload, UserPlus, Calendar, BarChart3 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/app/lib/utils";

const actions = [
  {
    id: "upload",
    label: "Subir PDF",
    icon: Upload,
    href: "#",
    disabled: true,
  },
  {
    id: "client",
    label: "Nuevo Cliente",
    icon: UserPlus,
    href: "#",
    disabled: true,
  },
  {
    id: "appointment",
    label: "Agendar Cita",
    icon: Calendar,
    href: "#",
    disabled: true,
  },
  {
    id: "reports",
    label: "Informes",
    icon: BarChart3,
    href: "#",
    disabled: true,
  },
];

export function QuickActions() {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="font-bold mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          if (action.disabled) {
            return (
              <div
                key={action.id}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800 opacity-50 cursor-not-allowed text-center relative"
                role="button"
                aria-disabled="true"
                aria-label={`${action.label} - Próximamente`}
                tabIndex={-1}
                title="Próximamente"
              >
                <Icon className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-400">{action.label}</span>
                <span className="absolute top-1 right-1 text-[10px] text-slate-400 font-medium">Próximamente</span>
              </div>
            );
          }
          return (
            <Link
              key={action.id}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-primary/5 hover:border-primary/20 transition-all group text-center"
            >
              <Icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              <span className="text-xs font-semibold">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

