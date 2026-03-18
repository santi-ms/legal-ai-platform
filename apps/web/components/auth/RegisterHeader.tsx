"use client";

import Link from "next/link";
import { Gavel } from "lucide-react";

export function RegisterHeader() {
  return (
    <header className="lg:hidden flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <Link href="/" className="flex items-center gap-2 text-primary">
        <Gavel className="w-8 h-8" />
        <span className="font-bold text-xl">LegalTech AR</span>
      </Link>
      <Link href="/auth/login" className="text-primary font-semibold text-sm hover:underline">
        Iniciar sesión
      </Link>
    </header>
  );
}



