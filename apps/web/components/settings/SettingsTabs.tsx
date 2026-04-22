"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, CreditCard, Shield, Users, Sparkles, PlugZap } from "lucide-react";
import { cn } from "@/app/lib/utils";

type SettingsTab = "profile" | "billing" | "security" | "team" | "integrations" | "prompts";

interface TabConfig {
  id:        SettingsTab;
  label:     string;
  href?:     string;
  disabled?: boolean;
  icon?:     typeof User;
}

interface SettingsTabsProps {
  /** Opcional — si no se pasa, se deriva del pathname. */
  activeTab?: SettingsTab;
  className?: string;
}

const tabs: TabConfig[] = [
  { id: "profile",      label: "Perfil",              icon: User,       href: "/settings" },
  { id: "billing",      label: "Plan y Facturación",  icon: CreditCard, href: "/settings/billing" },
  { id: "security",     label: "Seguridad",           icon: Shield,     href: "/settings/security" },
  { id: "team",         label: "Equipo",              icon: Users,      href: "/settings/team" },
  { id: "prompts",      label: "Prompts IA",          icon: Sparkles,   href: "/settings/prompts" },
  { id: "integrations", label: "Integraciones",       icon: PlugZap,    disabled: true },
];

/**
 * Navegación editorial de pestañas para la sección de ajustes.
 * Underline violeta con icono + badge "Próx." para pestañas deshabilitadas.
 */
export function SettingsTabs({ activeTab, className }: SettingsTabsProps) {
  const pathname = usePathname();

  // Si no nos pasaron activeTab, lo derivamos del pathname.
  const derivedActive: SettingsTab | undefined =
    activeTab ??
    (pathname === "/settings"              ? "profile"      :
     pathname?.startsWith("/settings/billing")      ? "billing"      :
     pathname?.startsWith("/settings/security")     ? "security"     :
     pathname?.startsWith("/settings/team")         ? "team"         :
     pathname?.startsWith("/settings/prompts")      ? "prompts"      :
     pathname?.startsWith("/settings/integrations") ? "integrations" :
     undefined);

  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="flex items-end gap-1 border-b border-slate-200 dark:border-slate-800 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = !tab.disabled && (derivedActive === tab.id || pathname === tab.href);

          if (tab.disabled) {
            return (
              <div
                key={tab.id}
                className="relative inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap text-slate-400 dark:text-slate-500 cursor-not-allowed select-none"
                aria-disabled="true"
                title="Próximamente"
              >
                {Icon && <Icon className="w-4 h-4" />}
                {tab.label}
                <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                  Próx.
                </span>
              </div>
            );
          }

          return (
            <Link
              key={tab.id}
              href={tab.href!}
              className={cn(
                "relative inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
                isActive
                  ? "text-ink dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
              )}
            >
              {Icon && (
                <Icon
                  className={cn(
                    "w-4 h-4",
                    isActive ? "text-violet-500" : "text-slate-400 dark:text-slate-500",
                  )}
                />
              )}
              {tab.label}
              <span
                className={cn(
                  "absolute left-2.5 right-2.5 -bottom-px h-[2px] rounded-full transition-all",
                  isActive ? "bg-gradient-to-r from-violet-500 to-purple-600" : "bg-transparent",
                )}
                aria-hidden
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
