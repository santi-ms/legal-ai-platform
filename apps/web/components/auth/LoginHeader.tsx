"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function LoginHeader() {
  return (
    <header className="flex items-center justify-between px-6 py-4 lg:px-12 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
      <Link href="/" className="flex items-center">
        <BrandLogo size={44} />
      </Link>
      <button className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors">
        Ayuda
      </button>
    </header>
  );
}



