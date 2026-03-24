"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function DocumentCreationPageHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-background-dark/95 backdrop-blur-md px-6 md:px-20 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/documents"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group min-w-0">
            <BrandLogo size={36} className="rounded-lg shrink-0" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white truncate">
              DocuLex
            </h2>
          </Link>
        </div>

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

