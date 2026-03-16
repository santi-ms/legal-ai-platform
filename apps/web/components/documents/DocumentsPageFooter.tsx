"use client";

import Link from "next/link";
import { Gavel } from "lucide-react";

export function DocumentsPageFooter() {
  return (
    <footer className="mt-auto py-10 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-background-dark px-10">
      <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-3 opacity-50">
          <div className="size-6 bg-slate-400 rounded-sm flex items-center justify-center text-white">
            <Gavel className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-500 dark:text-slate-400">LegalTech AR Legal Platform</span>
        </div>
        <div className="flex gap-8 text-sm text-slate-500 dark:text-slate-400">
          <Link href="#terminos" className="hover:text-primary transition-colors">
            Términos de servicio
          </Link>
          <Link href="#privacidad" className="hover:text-primary transition-colors">
            Política de privacidad
          </Link>
          <Link href="#soporte" className="hover:text-primary transition-colors">
            Soporte técnico
          </Link>
        </div>
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} LegalTech AR. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}


