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
  ScanSearch,
  PenLine,
  MessageSquare,
  DollarSign,
  FileSpreadsheet,
  Swords,
  Globe,
  Scale,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useDeadlines } from "@/app/lib/contexts/DeadlineContext";
import { useEffect, useState } from "react";
import { getBillingSubscription } from "@/app/lib/webApi";

// Asistentes IA
const dokiItems = [
  {
    id: "doku-genera",
    label: "Doku Genera",
    icon: PenLine,
    href: "/documents/new",
    disabled: false,
    badge: null,
  },
  {
    id: "doku-analiza",
    label: "Doku Analiza",
    icon: ScanSearch,
    href: "/analysis",
    disabled: false,
    badge: null,
  },
  {
    id: "doku-consulta",
    label: "Doku Consulta",
    icon: MessageSquare,
    href: "/documents",
    disabled: false,
    badge: null,
  },
  {
    id: "doku-estratega",
    label: "Doku Estratega",
    icon: Swords,
    href: "/estrategia",
    disabled: false,
    badge: null,
  },
  {
    id: "doku-juris",
    label: "Doku Juris",
    icon: Scale,
    href: "/juris",
    disabled: false,
    badge: null,
  },
];

// Gestión del estudio
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
    label: "Mis Documentos",
    icon: FileText,
    href: "/documents",
    disabled: false,
  },
  {
    id: "references",
    label: "Referencias IA",
    icon: BookMarked,
    href: "/documents/references",
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
    href: "/calendario",
    disabled: false,
  },
  {
    id: "clients",
    label: "Clientes",
    icon: Users,
    href: "/clients",
    disabled: false,
  },
  {
    id: "finanzas",
    label: "Finanzas",
    icon: DollarSign,
    href: "/finanzas",
    disabled: false,
  },
  {
    id: "importar",
    label: "Importar datos",
    icon: FileSpreadsheet,
    href: "/importar",
    disabled: false,
  },
  {
    id: "portal",
    label: "Portal Judicial",
    icon: Globe,
    href: "/portal",
    disabled: false,
  },
  {
    id: "analytics",
    label: "Analytics",
    icon: BarChart2,
    href: "/analytics",
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

  const [usageData, setUsageData] = useState<{ used: number; limit: number | null; planName: string } | null>(null);

  useEffect(() => {
    getBillingSubscription()
      .then((billing) => {
        const limit = billing.plan?.limits?.docsPerMonth;
        setUsageData({
          used: billing.usage?.docsThisMonth ?? 0,
          limit: typeof limit === "number" && limit !== -1 ? limit : null,
          planName: billing.plan?.name ?? "Free",
        });
      })
      .catch(() => {}); // No bloquear la sidebar si falla
  }, []);

  const sidebarContent = (
    <aside
      className={cn(
        // Base: ancho fijo, altura completa, columna flex
        "w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0",
        // Mobile: drawer fijo sobre el contenido
        "fixed top-0 left-0 z-50 h-screen transition-transform duration-300",
        // Desktop: parte del flujo normal (el parent ya tiene h-screen)
        "lg:relative lg:translate-x-0 lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
    >
      {/* Logo + botón cerrar en mobile */}
      <div className="p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <BrandLogo size={55} />
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

        {/* ── Asistentes IA ─────────────────────────────────── */}
        <div className="pt-2 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Asistentes IA
        </div>
        {dokiItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/documents/new"
              ? pathname?.startsWith("/documents/new")
              : item.href === "/documents"
              ? false // Doku Consulta no se marca activo (comparte ruta con Mis Documentos)
              : pathname === item.href || pathname?.startsWith(item.href + "/");

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
              <span className="flex-1 font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* ── Gestión ───────────────────────────────────────── */}
        <div className="pt-4 pb-1 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Gestión
        </div>

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

      {/* Plan usage + Premium Button */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
        {usageData && (
          <Link href="/settings/billing" onClick={onClose} className="block group">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 group-hover:border-primary/40 transition-colors">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Documentos este mes</span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {usageData.used}{usageData.limit ? `/${usageData.limit}` : ""}
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                {usageData.limit ? (
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      (usageData.used / usageData.limit) >= 0.9 ? "bg-red-500" :
                      (usageData.used / usageData.limit) >= 0.7 ? "bg-amber-500" : "bg-primary"
                    )}
                    style={{ width: `${Math.min(100, Math.round((usageData.used / usageData.limit) * 100))}%` }}
                  />
                ) : (
                  <div className="h-full w-3 bg-primary rounded-full" />
                )}
              </div>
              {usageData.limit && usageData.used >= usageData.limit && (
                <p className="text-[10px] text-red-500 font-semibold mt-1">Límite alcanzado</p>
              )}
            </div>
          </Link>
        )}
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
