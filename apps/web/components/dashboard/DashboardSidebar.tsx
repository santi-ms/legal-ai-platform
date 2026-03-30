"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { BrandLogo } from "@/components/ui/BrandLogo";
import {
  LayoutDashboard,
  FileText,
  Briefcase,
  Calendar,
  Users,
  Settings,
  HelpCircle,
  Sparkles,
  BarChart2,
  BookMarked,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useDeadlines } from "@/app/lib/contexts/DeadlineContext";

const navigationItems = [
  {
    id: "dashboard",
    label: "Panel de Control",
    icon: LayoutDashboard,
    href: "/dashboard",
    disabled: false,
  },
  {
    id: "documents",
    label: "Documentos",
    icon: FileText,
    href: "/documents",
    disabled: false,
  },
  {
    id: "cases",
    label: "Expedientes",
    icon: Briefcase,
    href: "/expedientes",
    disabled: false,
  },
  {
    id: "calendar",
    label: "Calendario",
    icon: Calendar,
    href: "#",
    disabled: true,
  },
  {
    id: "clients",
    label: "Clientes",
    icon: Users,
    href: "/clients",
    disabled: false,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart2,
    href: "/analytics",
    disabled: false,
  },
  {
    id: "references",
    label: "Referencias IA",
    icon: BookMarked,
    href: "/documents/references",
    disabled: false,
  },
];

const configItems = [
  {
    id: "settings",
    label: "Ajustes",
    icon: Settings,
    href: "/settings",
    disabled: false,
  },
  {
    id: "help",
    label: "Ayuda",
    icon: HelpCircle,
    href: "#",
    disabled: true,
  },
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { urgentCount } = useDeadlines();

  const sidebarContent = (
    <aside
      className={cn(
        "w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen",
        // Desktop: siempre visible, sticky
        "lg:sticky lg:top-0 lg:flex",
        // Mobile: fixed drawer, controlado por isOpen
        "fixed top-0 left-0 z-50 transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo + botón cerrar en mobile */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <BrandLogo size={140} />
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-0.5">Pro Edition</p>
        </div>
        {/* Botón cerrar solo en mobile */}
        <button
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          // Special case: /documents should not be active when on /documents/references
          const isActive =
            !item.disabled &&
            (item.href === "/documents"
              ? pathname === "/documents" ||
                (pathname?.startsWith("/documents/") &&
                  !pathname?.startsWith("/documents/references"))
              : pathname === item.href || pathname?.startsWith(item.href + "/"));

          if (item.disabled) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed relative group"
                role="button"
                aria-disabled="true"
                aria-label={`${item.label} - Próximamente`}
                tabIndex={-1}
                title="Próximamente"
              >
                <Icon className="w-5 h-5 text-slate-400" />
                <span className="text-slate-400">{item.label}</span>
                <span className="ml-auto text-xs text-slate-400 font-medium">
                  Próximamente
                </span>
              </div>
            );
          }

          // Badge: show urgent deadline count on Expedientes nav item
          const badge = item.id === "cases" && urgentCount > 0 ? urgentCount : null;

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badge !== null && (
                <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Config Section */}
        <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Configuración
        </div>

        {configItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            !item.disabled &&
            (pathname === item.href || pathname?.startsWith(item.href + "/"));

          if (item.disabled) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-50 cursor-not-allowed relative group"
                role="button"
                aria-disabled="true"
                aria-label={`${item.label} - Próximamente`}
                tabIndex={-1}
                title="Próximamente"
              >
                <Icon className="w-5 h-5 text-slate-400" />
                <span className="text-slate-400">{item.label}</span>
                <span className="ml-auto text-xs text-slate-400 font-medium">
                  Próximamente
                </span>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Premium Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <Link
          href="/settings/billing"
          onClick={onClose}
          className="w-full py-3 px-4 bg-primary text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Suscripción Premium
        </Link>
      </div>
    </aside>
  );

  return (
    <>
      {/* Overlay backdrop — solo mobile cuando está abierto */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      {sidebarContent}
    </>
  );
}
