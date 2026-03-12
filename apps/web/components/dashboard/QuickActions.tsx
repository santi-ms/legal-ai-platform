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
  },
  {
    id: "client",
    label: "Nuevo Cliente",
    icon: UserPlus,
    href: "#",
  },
  {
    id: "appointment",
    label: "Agendar Cita",
    icon: Calendar,
    href: "#",
  },
  {
    id: "reports",
    label: "Informes",
    icon: BarChart3,
    href: "#",
  },
];

export function QuickActions() {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="font-bold mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
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

