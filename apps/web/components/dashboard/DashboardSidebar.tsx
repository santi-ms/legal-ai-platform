"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
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
  DollarSign,
  FileSpreadsheet,
  Swords,
  Globe,
  Scale,
  CalendarClock,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useDeadlines } from "@/app/lib/contexts/DeadlineContext";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { getBillingSubscription } from "@/app/lib/webApi";

// ── Asistentes IA ──────────────────────────────────────────────────────────
const dokiItems = [
  { id: "doku-genera",    label: "Doku Genera",    icon: PenLine,    href: "/documents/new" },
  { id: "doku-analiza",   label: "Doku Analiza",   icon: ScanSearch, href: "/analysis" },
  { id: "doku-estratega", label: "Doku Estratega", icon: Swords,     href: "/estrategia" },
  { id: "doku-juris",     label: "Doku Juris",     icon: Scale,      href: "/juris" },
] as const;

// ── Gestión ────────────────────────────────────────────────────────────────
const navigationItems = [
  { id: "dashboard",     label: "Panel",           icon: LayoutDashboard,  href: "/dashboard" },
  { id: "documents",     label: "Mis Documentos",  icon: FileText,         href: "/documents" },
  { id: "references",    label: "Referencias IA",  icon: BookMarked,       href: "/documents/references" },
  { id: "cases",         label: "Expedientes",     icon: Briefcase,        href: "/expedientes" },
  { id: "vencimientos",  label: "Vencimientos",    icon: CalendarClock,    href: "/vencimientos" },
  { id: "calendar",      label: "Calendario",      icon: Calendar,         href: "/calendario" },
  { id: "clients",       label: "Clientes",        icon: Users,            href: "/clients" },
  { id: "finanzas",      label: "Finanzas",        icon: DollarSign,       href: "/finanzas" },
  { id: "importar",      label: "Importar datos",  icon: FileSpreadsheet,  href: "/importar" },
  { id: "portal",        label: "Portal Judicial", icon: Globe,            href: "/portal" },
  { id: "analytics",     label: "Analytics",       icon: BarChart2,        href: "/analytics" },
] as const;

const configItems = [
  { id: "settings", label: "Ajustes", icon: Settings,    href: "/settings", disabled: false },
  { id: "help",     label: "Ayuda",   icon: HelpCircle,  href: "#",         disabled: true  },
] as const;

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// ── Item de navegación editorial ───────────────────────────────────────────
function NavItem({
  href,
  icon: Icon,
  label,
  isActive,
  badge,
  onClick,
  disabled = false,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  isActive: boolean;
  badge?: number | null;
  onClick?: () => void;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div
        className="relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg text-sm opacity-50 cursor-not-allowed"
        role="button"
        aria-disabled="true"
        title="Próximamente"
      >
        <Icon className="w-[18px] h-[18px] text-slate-400 flex-shrink-0" />
        <span className="flex-1 text-slate-400">{label}</span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          Pronto
        </span>
      </div>
    );
  }
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-3 pl-4 pr-3 py-2 rounded-lg text-sm transition-all group",
        isActive
          ? "bg-slate-100 dark:bg-slate-800/70 text-ink dark:text-white font-semibold"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white",
      )}
    >
      {/* Barra activa editorial a la izquierda */}
      <span
        className={cn(
          "absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full transition-all",
          isActive
            ? "bg-gold-500"
            : "bg-transparent group-hover:bg-slate-200 dark:group-hover:bg-slate-700",
        )}
        aria-hidden="true"
      />
      <Icon
        className={cn(
          "w-[18px] h-[18px] flex-shrink-0 transition-colors",
          isActive
            ? "text-ink dark:text-white"
            : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200",
        )}
      />
      <span className="flex-1 truncate">{label}</span>
      {badge !== null && badge !== undefined && badge > 0 && (
        <span className="flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold px-1 leading-none">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

// ── Eyebrow de sección (gold uppercase) ────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="pt-5 pb-2 px-4 text-[10px] font-semibold text-gold-700 dark:text-gold-400 uppercase tracking-[0.14em]">
      {children}
    </div>
  );
}

export function DashboardSidebar({ isOpen = false, onClose }: DashboardSidebarProps) {
  const pathname = usePathname();
  const { urgentCount } = useDeadlines();
  const { data: session } = useSession();
  const user = session?.user;
  const userName = user?.name || "Usuario";
  const userEmail = user?.email || "";
  const userInitial = userName.charAt(0).toUpperCase();

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

  // Helper para match activo con caso especial de /documents (no cuando es /documents/references)
  const isItemActive = (href: string) => {
    if (href === "/documents") {
      return (
        pathname === "/documents" ||
        (pathname?.startsWith("/documents/") && !pathname?.startsWith("/documents/references"))
      ) ?? false;
    }
    if (href === "/documents/new") {
      return pathname?.startsWith("/documents/new") ?? false;
    }
    return (pathname === href || pathname?.startsWith(href + "/")) ?? false;
  };

  const sidebarContent = (
    <aside
      className={cn(
        // Base: ancho fijo, borde derecho editorial
        "w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0",
        // Mobile: drawer
        "fixed top-0 left-0 z-50 h-screen transition-transform duration-300",
        // Desktop
        "lg:relative lg:translate-x-0 lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* ── Header: wordmark editorial ─────────────────────────────────── */}
      <div className="px-5 pt-6 pb-5 flex items-start justify-between">
        <Link href="/dashboard" onClick={onClose} className="group flex items-baseline gap-1.5">
          <span className="text-2xl font-extrabold tracking-tight text-ink dark:text-white leading-none">
            doculex
          </span>
          <span className="text-2xl font-extrabold text-gold-500 leading-none">.</span>
        </Link>
        {/* Botón cerrar mobile */}
        <button
          className="lg:hidden p-1.5 -mr-1 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          onClick={onClose}
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Plan pill */}
      {usageData && (
        <div className="px-5 pb-3">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gold-50 dark:bg-gold-900/20 border border-gold-200/60 dark:border-gold-800/40">
            <span className="w-1 h-1 rounded-full bg-gold-500" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gold-700 dark:text-gold-400">
              Plan {usageData.planName}
            </span>
          </div>
        </div>
      )}

      {/* ── Navegación ─────────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 overflow-y-auto pb-2">
        <SectionLabel>Asistentes IA</SectionLabel>
        <div className="space-y-0.5">
          {dokiItems.map((item) => (
            <NavItem
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isItemActive(item.href)}
              onClick={onClose}
            />
          ))}
        </div>

        <SectionLabel>Gestión</SectionLabel>
        <div className="space-y-0.5">
          {navigationItems.map((item) => {
            const badge = item.id === "cases" && urgentCount > 0 ? urgentCount : null;
            return (
              <NavItem
                key={item.id}
                href={item.href}
                icon={item.icon}
                label={item.label}
                isActive={isItemActive(item.href)}
                badge={badge}
                onClick={onClose}
              />
            );
          })}
        </div>

        <SectionLabel>Configuración</SectionLabel>
        <div className="space-y-0.5">
          {configItems.map((item) => (
            <NavItem
              key={item.id}
              href={item.href}
              icon={item.icon}
              label={item.label}
              isActive={isItemActive(item.href)}
              disabled={item.disabled}
              onClick={onClose}
            />
          ))}
        </div>
      </nav>

      {/* ── Uso + upgrade + usuario ───────────────────────────────────── */}
      <div className="border-t border-slate-200 dark:border-slate-800">
        {/* Uso */}
        {usageData && usageData.limit !== null && (
          <Link
            href="/settings/billing"
            onClick={onClose}
            className="block px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Docs este mes
              </span>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {usageData.used}/{usageData.limit}
              </span>
            </div>
            <div className="h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  usageData.used / usageData.limit >= 0.9
                    ? "bg-rose-500"
                    : usageData.used / usageData.limit >= 0.7
                    ? "bg-amber-500"
                    : "bg-gold-500",
                )}
                style={{
                  width: `${Math.min(100, Math.round((usageData.used / usageData.limit) * 100))}%`,
                }}
              />
            </div>
            {usageData.used >= usageData.limit && (
              <p className="text-[10px] text-rose-500 font-semibold mt-1">Límite alcanzado</p>
            )}
          </Link>
        )}

        {/* Upgrade pill — sólo si no es Pro/Premium */}
        {usageData && !/(pro|premium|enterprise)/i.test(usageData.planName) && (
          <div className="px-4 pb-3">
            <Link
              href="/settings/billing"
              onClick={onClose}
              className="group w-full inline-flex items-center justify-center gap-2 py-2.5 px-3 bg-ink hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all shadow-soft hover:shadow-hover"
            >
              <Sparkles className="w-3.5 h-3.5 text-gold-400" />
              Mejorar a Pro
              <ChevronRight className="w-3.5 h-3.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}

        {/* Usuario footer */}
        <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Link
            href="/settings"
            onClick={onClose}
            className="flex items-center gap-2.5 min-w-0 flex-1 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="size-8 rounded-full bg-gradient-to-br from-ink to-slate-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-1 ring-slate-200 dark:ring-slate-700">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt={userName} className="w-full h-full rounded-full object-cover" />
              ) : (
                userInitial
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-slate-900 dark:text-white truncate leading-tight">
                {userName}
              </p>
              {userEmail && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate leading-tight mt-0.5">
                  {userEmail}
                </p>
              )}
            </div>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="p-2 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Overlay backdrop — mobile */}
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
