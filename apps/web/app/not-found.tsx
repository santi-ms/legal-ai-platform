"use client";

import Link from "next/link";
import { ArrowLeft, FileSearch } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center px-4 text-center">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-12">
        <BrandLogo size={56} />
        <span className="text-lg font-bold text-slate-900 dark:text-white">DocuLex</span>
      </div>

      {/* 404 */}
      <div className="relative mb-6">
        <span className="text-[120px] md:text-[160px] font-extrabold text-slate-100 dark:text-slate-800 leading-none select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-16 rounded-2xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <FileSearch className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Message */}
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
        Página no encontrada
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-base max-w-sm mb-10 leading-relaxed">
        La página que buscás no existe o fue movida. Verificá la dirección o volvé al inicio.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <ArrowLeft className="w-4 h-4" />
          Ir al dashboard
        </Link>
        <Link
          href="/documents"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Ver documentos
        </Link>
      </div>
    </div>
  );
}
