"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { TOKENS, type GradientKey } from "@/app/lib/design-tokens";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  icon?: LucideIcon;
  iconGradient?: GradientKey;
  /**
   * Kicker editorial sobre el título — uppercase, dorado, tracking ancho.
   * Ej: "Asistentes IA", "Gestión", "Configuración".
   */
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: {
    label: string;
    tone?: "default" | "warning" | "danger" | "success" | "info" | "gold";
  };
  actions?: React.ReactNode;
  breadcrumbs?: Breadcrumb[];
  className?: string;
}

const BADGE_STYLES: Record<NonNullable<PageHeaderProps["badge"]>["tone"] & string, string> = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  danger:  "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  info:    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  gold:    "bg-gold-50 text-gold-700 dark:bg-gold-900/30 dark:text-gold-300",
};

export const PageHeader = React.memo(function PageHeader({
  icon: Icon,
  iconGradient = "primary",
  eyebrow,
  title,
  description,
  badge,
  actions,
  breadcrumbs,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-4">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{crumb.label}</span>
                )}
                {i < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400" />}
              </li>
            ))}
          </ol>
        </nav>
      )}

      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          {Icon && (
            <div
              className={cn(
                "flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-soft",
                TOKENS.gradients[iconGradient]
              )}
            >
              <Icon className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className={cn(TOKENS.eyebrow, "mb-2")}>
                {eyebrow}
              </p>
            )}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink dark:text-white leading-[1.1]">
                {title}
              </h1>
              {badge && (
                <span
                  className={cn(
                    "text-[11px] font-semibold px-2 py-1 rounded-full uppercase tracking-wider",
                    BADGE_STYLES[badge.tone ?? "default"]
                  )}
                >
                  {badge.label}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-2.5 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
});
