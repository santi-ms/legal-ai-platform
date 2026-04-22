"use client";

import React from "react";
import { cn } from "@/app/lib/utils";
import { LucideIcon } from "lucide-react";

export interface SectionTab {
  key:     string;
  label:   string;
  icon?:   LucideIcon;
  badge?:  string | number;
}

interface SectionTabsProps {
  tabs:      SectionTab[];
  activeKey: string;
  onChange:  (key: string) => void;
  className?: string;
  /** "editorial" (default, underline+accent) | "pills" (rounded pills) */
  variant?: "editorial" | "pills";
}

/**
 * Navegación por pestañas consistente para secciones internas de la app.
 * Estilo editorial por defecto (underline con acento dorado/violeta) —
 * alineado con PageHeader y el resto del sistema.
 */
export const SectionTabs = React.memo(function SectionTabs({
  tabs,
  activeKey,
  onChange,
  className,
  variant = "editorial",
}: SectionTabsProps) {
  if (variant === "pills") {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl",
          className,
        )}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeKey === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                active
                  ? "bg-white dark:bg-slate-900 text-ink dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
              )}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {tab.label}
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    "ml-0.5 inline-flex items-center justify-center px-1.5 h-4 rounded-full text-[10px] font-bold",
                    active
                      ? "bg-primary/10 text-primary"
                      : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Editorial (default) — underline con acento
  return (
    <div
      className={cn(
        "flex items-end gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 -mx-1 px-1",
        className,
      )}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = activeKey === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              "relative inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              active
                ? "text-ink dark:text-white"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            {Icon && (
              <Icon
                className={cn(
                  "w-4 h-4",
                  active ? "text-violet-500" : "text-slate-400 dark:text-slate-500",
                )}
              />
            )}
            {tab.label}
            {tab.badge !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold",
                  active
                    ? "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {tab.badge}
              </span>
            )}
            {/* Underline activo */}
            <span
              className={cn(
                "absolute left-2.5 right-2.5 -bottom-px h-[2px] rounded-full transition-all",
                active
                  ? "bg-gradient-to-r from-violet-500 to-purple-600"
                  : "bg-transparent",
              )}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
});
