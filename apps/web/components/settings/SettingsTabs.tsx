"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";

type SettingsTab = "profile" | "billing" | "security" | "integrations";

interface SettingsTabsProps {
  activeTab: SettingsTab;
  className?: string;
}

const tabs: { id: SettingsTab; label: string; href: string }[] = [
  { id: "profile", label: "Perfil", href: "/settings" },
  { id: "billing", label: "Plan y Facturación", href: "/settings/billing" },
  { id: "security", label: "Seguridad", href: "/settings/security" },
  { id: "integrations", label: "Integraciones", href: "/settings/integrations" },
];

export function SettingsTabs({ activeTab, className }: SettingsTabsProps) {
  const pathname = usePathname();

  return (
    <div className={cn("pb-3 overflow-x-auto", className)}>
      <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 gap-8 min-w-max">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id || pathname === tab.href;
          return (
            <Link
              key={tab.id}
              href={tab.href}
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

