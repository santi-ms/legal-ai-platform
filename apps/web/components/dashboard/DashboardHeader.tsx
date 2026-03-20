"use client";

import { Search, Bell, Menu } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface DashboardHeaderProps {
  onSearch?: (query: string) => void;
  onMenuToggle?: () => void;
}

export function DashboardHeader({ onSearch, onMenuToggle }: DashboardHeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const userName = user?.name || "Usuario";
  const displayName = userName.split(" ")[0] || userName;
  const role = (user as any)?.role as string | undefined;

  return (
    <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 px-4 md:px-6 flex items-center justify-between gap-3">
      {/* Hamburger — solo mobile */}
      <button
        className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        onClick={onMenuToggle}
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search */}
      <div className="flex items-center gap-4 flex-1">
        <div
          className="relative w-full max-w-md hidden md:block"
          title="Próximamente"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 w-4 h-4 pointer-events-none" />
          <input
            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-lg pl-10 pr-4 py-2 text-sm outline-none opacity-50 cursor-not-allowed"
            placeholder="Buscar... (próximamente)"
            type="text"
            disabled
            aria-disabled="true"
            tabIndex={-1}
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

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
            className="size-10 rounded-full bg-slate-200 dark:bg-slate-800 bg-cover bg-center ring-2 ring-primary/10 flex items-center justify-center text-slate-600 dark:text-slate-400 font-semibold flex-shrink-0"
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
