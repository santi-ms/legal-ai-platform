"use client";

import { Users } from "lucide-react";

export function TeamActivity() {
  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-slate-400" />
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">Actividad del Equipo</h3>
      </div>

      <div className="py-4 text-center space-y-2">
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          Esta sección estará disponible próximamente.
        </p>
        <span className="inline-block px-3 py-1 text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
          Próximamente
        </span>
      </div>
    </div>
  );
}
