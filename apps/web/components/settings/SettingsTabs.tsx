"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";

type SettingsTab = "profile" | "billing" | "security" | "team" | "integrations";

interface TabConfig {
  id: SettingsTab;
  label: string;
  href?: string;
  disabled?: boolean;
}

interface SettingsTabsProps {
  activeTab: SettingsTab;
  className?: string;
}

const tabs: TabConfig[] = [
  { id: "profile",      label: "Perfil",              href: "/settings" },
  { id: "billing",      label: "Plan y Facturación",  href: "/settings/billing" },
  { id: "security",     label: "Seguridad",            href: "/settings/security" },
  { id: "team",         label: "Equipo",               href: "/settings/team" },
  { id: "integrations", label: "Integraciones",        disabled: true },
];

export function SettingsTabs({ activeTab, className }: SettingsTabsProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-3 overflow-x-auto", className)}>
      <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 gap-8 min-w-max">
        {tabs.map((tab) => {
          const isActive = !tab.disabled && (activeTab === tab.id || pathname === tab.href);

          if (tab.disabled) {
            return (
              <div
                key={tab.id}
                className="relative flex flex-col items-center justify-center border-b-[3px] border-transparent pb-[13px] pt-4 opacity-50 cursor-not-allowed select-none"
                aria-disabled="true"
                title="Próximamente"
              >
                <p className="text-sm font-bold leading-normal tracking-wide text-slate-500 dark:text-slate-400">
                  {tab.label}
                </p>
                <span className="absolute -top-0.5 -right-4 text-[9px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1 py-0.5 rounded leading-none">
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
                "flex flex-col items-center justify-center border-b-[3px] pb-[13px] pt-4 transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-primary"
              )}
            >
              <p className="text-sm font-bold leading-normal tracking-wide">{tab.label}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
