"use client";

import Link from "next/link";
import { Gavel, HelpCircle } from "lucide-react";
import { useSession } from "next-auth/react";

export function DocumentCreationHeader() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 lg:px-20">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white">
            <Gavel className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            LegalTech AR
          </h2>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/documents"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Mis Documentos
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Plantillas
          </Link>
          <Link
            href="#"
            className="text-sm font-medium hover:text-primary transition-colors"
          >
            Asesoría
          </Link>
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-4">
          <button
            className="flex items-center justify-center rounded-full p-2 hover:bg-primary/10 transition-colors"
            aria-label="Ayuda"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <Link
            href="/profile"
            className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center text-slate-600 dark:text-slate-400 font-semibold"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name || "Usuario"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}

