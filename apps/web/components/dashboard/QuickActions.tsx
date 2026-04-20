"use client";

import React from "react";
import {
  Plus, FileText, Users, Briefcase, DollarSign, CalendarClock,
  UserPlus, FolderPlus, Bell, CreditCard,
} from "lucide-react";
import Link from "next/link";

const ACTIONS = [
  {
    id:    "new-doc",
    label: "Nuevo Documento",
    icon:  Plus,
    href:  "/documents/new",
    color: "text-primary",
    bg:    "bg-primary/10",
  },
  {
    id:    "new-client",
    label: "Nuevo Cliente",
    icon:  UserPlus,
    href:  "/clients?formOpen=1",
    color: "text-violet-600 dark:text-violet-400",
    bg:    "bg-violet-100 dark:bg-violet-900/20",
  },
  {
    id:    "new-expediente",
    label: "Nuevo Expediente",
    icon:  FolderPlus,
    href:  "/expedientes?create=1",
    color: "text-emerald-600 dark:text-emerald-400",
    bg:    "bg-emerald-100 dark:bg-emerald-900/20",
  },
  {
    id:    "new-vencimiento",
    label: "Nuevo Vencimiento",
    icon:  Bell,
    href:  "/vencimientos?create=1",
    color: "text-red-600 dark:text-red-400",
    bg:    "bg-red-100 dark:bg-red-900/20",
  },
  {
    id:    "new-honorario",
    label: "Nuevo Honorario",
    icon:  CreditCard,
    href:  "/finanzas?formOpen=1",
    color: "text-emerald-600 dark:text-emerald-400",
    bg:    "bg-emerald-100 dark:bg-emerald-900/20",
  },
  {
    id:    "expedientes",
    label: "Expedientes",
    icon:  Briefcase,
    href:  "/expedientes",
    color: "text-blue-600 dark:text-blue-400",
    bg:    "bg-blue-100 dark:bg-blue-900/20",
  },
  {
    id:    "vencimientos",
    label: "Vencimientos",
    icon:  CalendarClock,
    href:  "/vencimientos",
    color: "text-amber-600 dark:text-amber-400",
    bg:    "bg-amber-100 dark:bg-amber-900/20",
  },
  {
    id:    "docs",
    label: "Documentos",
    icon:  FileText,
    href:  "/documents",
    color: "text-slate-500 dark:text-slate-400",
    bg:    "bg-slate-100 dark:bg-slate-800",
  },
];

export const QuickActions = React.memo(function QuickActions() {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <h3 className="font-bold mb-4 text-slate-900 dark:text-white text-sm">Acciones Rápidas</h3>
      <div className="grid grid-cols-2 gap-2.5">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.id}
              href={action.href}
              className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 transition-all group"
            >
              <div className={`size-7 rounded-lg flex items-center justify-center flex-shrink-0 ${action.bg}`}>
                <Icon className={`w-3.5 h-3.5 ${action.color}`} />
              </div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-tight">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});
