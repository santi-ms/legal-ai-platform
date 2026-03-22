"use client";

import { Plus, FileText, Users, Briefcase, Upload, BarChart3 } from "lucide-react";
import Link from "next/link";

const activeActions = [
  {
    id: "new",
    label: "Nuevo Documento",
    icon: Plus,
    href: "/documents/new",
  },
  {
    id: "docs",
    label: "Mis Documentos",
    icon: FileText,
    href: "/documents",
  },
  {
    id: "clients",
    label: "Clientes",
    icon: Users,
    href: "/clients",
  },
  {
    id: "expedientes",
    label: "Expedientes",
    icon: Briefcase,
    href: "/expedientes",
  },
];

const comingSoonActions = [
  { id: "upload", label: "Subir PDF", icon: Upload },
  { id: "reports", label: "Informes", icon: BarChart3 },
];

export function QuickActions() {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="font-bold mb-4 text-slate-900 dark:text-white">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-3">
        {activeActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-primary/5 hover:border-primary/20 transition-all group text-center"
            >
              <Icon className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                {action.label}
              </span>
            </Link>
          );
        })}
        {comingSoonActions.map((action) => {
          const Icon = action.icon;
          return (
            <div
              key={action.id}
              title="Próximamente"
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed text-center select-none"
            >
              <Icon className="w-5 h-5 text-slate-300 dark:text-slate-600" />
              <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                {action.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

