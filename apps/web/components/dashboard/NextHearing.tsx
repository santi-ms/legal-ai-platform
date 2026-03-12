"use client";

import { Calendar } from "lucide-react";
import Link from "next/link";

interface NextHearingProps {
  caseName?: string;
  date?: string;
  time?: string;
  onViewDetails?: () => void;
}

export function NextHearing({
  caseName = "Caso TechCorp vs. InnovaSoft",
  date = "Mañana",
  time = "09:30 AM",
  onViewDetails,
}: NextHearingProps) {
  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-colors"></div>

      {/* Content */}
      <div className="relative z-10">
        <h3 className="font-bold mb-2">Próxima Audiencia</h3>
        <p className="text-slate-400 text-sm mb-4">{caseName}</p>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm">
            {date}, {time}
          </span>
        </div>
        {onViewDetails ? (
          <button
            onClick={onViewDetails}
            className="w-full py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-semibold"
          >
            Ver Detalles
          </button>
        ) : (
          <Link
            href="#"
            className="block w-full py-2 bg-white/10 hover:bg-white/20 transition-colors rounded-lg text-sm font-semibold text-center"
          >
            Ver Detalles
          </Link>
        )}
      </div>
    </div>
  );
}

