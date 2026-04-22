"use client";

import { Search, Menu } from "lucide-react";
import { NotificationsPanel } from "@/components/ui/NotificationsPanel";

interface DashboardHeaderProps {
  onMenuToggle?: () => void;
  onSearchOpen?: () => void;
}

/**
 * Header editorial — 64px, minimalista.
 *
 * Responsabilidades (reducidas):
 *   · Hamburger mobile (<768px)
 *   · Búsqueda global (Ctrl+K trigger)
 *   · Notificaciones
 *
 * El wordmark, el menú de usuario y el selector de plan viven ahora en la
 * Sidebar. Esto deja la superficie superior libre para que la página respire
 * y el PageLayout gestione su propio título/eyebrow/breadcrumbs.
 *
 * Breakpoint hamburger: `md:hidden` (oculto desde 768px) — alineado con
 * sidebar que pasa de drawer a fijo también en 768px.
 */
export function DashboardHeader({ onMenuToggle, onSearchOpen }: DashboardHeaderProps) {
  return (
    <header className="h-16 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white/75 dark:bg-slate-950/75 backdrop-blur-md sticky top-0 z-10 px-3 sm:px-4 md:px-6 flex items-center gap-2 sm:gap-3">
      {/* Hamburger mobile — 44x44 touch target */}
      <button
        className="md:hidden p-3 -ml-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        onClick={onMenuToggle}
        aria-label="Abrir menú"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Search trigger — versión mobile muestra solo icono */}
      <button
        onClick={onSearchOpen}
        className="group hidden sm:flex items-center gap-2.5 h-9 flex-1 max-w-md px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all cursor-text"
        aria-label="Abrir búsqueda global"
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1 text-left hidden md:block">Buscar documentos, clientes, expedientes…</span>
        <span className="flex-1 text-left md:hidden">Buscar…</span>
        <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-semibold text-slate-500 leading-none flex-shrink-0">
          Ctrl K
        </kbd>
      </button>

      {/* Search mobile — solo icono, 44x44 */}
      <button
        onClick={onSearchOpen}
        className="sm:hidden p-3 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
        aria-label="Abrir búsqueda"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Acciones derecha */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <NotificationsPanel />
      </div>
    </header>
  );
}
