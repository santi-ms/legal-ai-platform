"use client";

import { ReactNode } from "react";

interface DashboardShellProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function DashboardShell({
  title,
  description,
  action,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 flex flex-col gap-8">
        {/* HEADER DE PÁGINA */}
        <header className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-neutral-300 max-w-2xl leading-relaxed">
                {description}
              </p>
            )}
          </div>

          {action && (
            <div className="flex-shrink-0 flex items-start">{action}</div>
          )}
        </header>

        {/* CONTENIDO (cards, tablas, formularios, etc.) */}
        <section>{children}</section>

        {/* FOOTER CHIQUITO / PIE DE CONFIANZA */}
        <footer className="pt-8 border-t border-neutral-800 text-[11px] text-neutral-400 leading-relaxed">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-medium text-white">
                ⚖️ Legal AI Platform
              </div>
              <div className="text-neutral-400">
                Generación automática de contratos y documentos legales listos
                para firmar en Argentina.
              </div>
            </div>

            <div className="flex flex-wrap gap-3 md:text-right">
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-1 text-[10px] font-medium text-neutral-300 shadow-sm">
                <Dot className="text-emerald-500" />
                Cumple normativa AR
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-1 text-[10px] font-medium text-neutral-300 shadow-sm">
                <Dot className="text-emerald-500" />
                Datos cifrados
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-neutral-700 bg-neutral-800 px-2 py-1 text-[10px] font-medium text-neutral-300 shadow-sm">
                <Dot className="text-emerald-500" />
                GPT-4o-mini
              </span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

/**
 * Iconito redondo tipo bullet verde.
 * Así evitamos importar heroicons solo para un punto.
 */
function Dot({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full bg-current ${className ?? ""}`}
    />
  );
}
