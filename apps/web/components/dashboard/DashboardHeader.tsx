"use client";

import { Search, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { NotificationsPanel } from "@/components/ui/NotificationsPanel";

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
  onSearchOpen?: () => void;
}

export function DashboardHeader({ onMenuToggle, onSearchOpen }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const userName    = user?.name || "Usuario";
  const displayName = userName.split(" ")[0] || userName;
  const role        = (user as any)?.role as string | undefined;

  // ── Header ────────────────────────────────────────────────────────────────
  return (
    <header className="h-[72px] border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-4 md:px-8 flex items-center justify-between gap-3">
      {/* Hamburger — solo mobile */}
      <button
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        onClick={onMenuToggle}
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search trigger — looks like an input, opens GlobalSearch */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={onSearchOpen}
          className="group relative w-full max-w-md hidden md:flex items-center gap-2 h-10 px-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-text"
          aria-label="Abrir búsqueda global"
        >
          <Search className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 text-left">Buscar documentos, clientes...</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[11px] font-mono text-slate-400 leading-none flex-shrink-0">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Search icon — solo mobile */}
        <button
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={onSearchOpen}
          aria-label="Buscar"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <NotificationsPanel />

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>

        {/* User Profile */}
        <div className="flex items-center gap-3 pl-1">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            {role && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{role}</p>
            )}
          </div>
          <Link
            href="/settings"
            className="size-[42px] rounded-full bg-slate-200 dark:bg-slate-800 bg-cover bg-center ring-2 ring-primary/10 flex items-center justify-center text-slate-600 dark:text-slate-400 font-semibold flex-shrink-0"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={userName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-sm">{userName.charAt(0).toUpperCase()}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
