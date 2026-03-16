"use client";

import { cn } from "@/app/lib/utils";

interface GenerationHeroProps {
  documentTitle: string;
  subtitle?: string;
  isActive?: boolean;
}

export function GenerationHero({
  documentTitle,
  subtitle = "La inteligencia legal está redactando su documento según los parámetros establecidos.",
  isActive = true,
}: GenerationHeroProps) {
  return (
    <div className="@container">
      <div className="relative overflow-hidden rounded-xl bg-slate-900 min-h-[300px] flex flex-col justify-end p-8 border border-slate-800">
        {/* Abstract AI Visual Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent"></div>
          <div className="h-full w-full bg-[radial-gradient(circle_at_50%_50%,_#2b3bee44_0%,_transparent_50%)]"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-2">
          {isActive && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider w-fit">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Motor de IA Activo
            </span>
          )}
          <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight">
            Generando {documentTitle}
          </h1>
          <p className="text-slate-400 text-lg">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}


