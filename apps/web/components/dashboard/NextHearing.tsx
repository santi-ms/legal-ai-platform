"use client";

import { Calendar } from "lucide-react";

export function NextHearing() {
  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-sm">Próxima Audiencia</h3>
        </div>

        <div className="py-4 text-center space-y-2">
          <p className="text-slate-300 text-sm leading-relaxed">
            Esta sección estará disponible próximamente.
          </p>
          <span className="inline-block px-3 py-1 text-xs font-semibold bg-white/10 text-slate-300 rounded-full">
            Próximamente
          </span>
        </div>
      </div>
    </div>
  );
}
