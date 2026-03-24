"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function RegisterHeader() {
  return (
    <header className="lg:hidden flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <Link href="/" className="flex items-center gap-2">
        <BrandLogo size={32} className="rounded-lg" />
        <span className="font-bold text-xl">DocuLex</span>
      </Link>
      <Link href="/auth/login" className="text-primary font-semibold text-sm hover:underline">
        Iniciar sesión
      </Link>
    </header>
  );
}



