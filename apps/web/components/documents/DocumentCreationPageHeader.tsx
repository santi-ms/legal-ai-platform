"use client";

import Link from "next/link";
import { Gavel } from "lucide-react";

export function DocumentCreationPageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-6 md:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="bg-primary p-2 rounded-lg group-hover:bg-primary/90 transition-colors">
            <Gavel className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Legal AI Platform
          </h2>
        </Link>

        {/* Tagline */}
        <div className="hidden md:block text-right">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Generación automática de contratos y documentos legales listos para firmar en Argentina.
          </p>
        </div>

        {/* Badges */}
        <div className="hidden lg:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Cumple normativa AR</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Datos cifrados</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-500/20 border border-purple-500/30">
            <div className="w-2 h-2 rounded-full bg-purple-500"></div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">GPT-4o-mini</span>
          </div>
        </div>
      </div>
    </header>
  );
}

