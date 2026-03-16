"use client";

import Link from "next/link";

export function DocumentCreationFooter() {
  return (
    <footer className="mt-auto border-t border-primary/10 bg-white py-8 dark:bg-background-dark/50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row lg:px-20">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © 2024 LegalTech AR - Generación de documentos legales con validez jurídica.
        </p>
        <div className="flex gap-6">
          <Link
            href="#privacidad"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            Privacidad
          </Link>
          <Link
            href="#terminos"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            Términos
          </Link>
          <Link
            href="#soporte"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            Soporte
          </Link>
        </div>
      </div>
    </footer>
  );
}


