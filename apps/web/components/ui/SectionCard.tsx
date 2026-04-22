"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { TOKENS, type GradientKey } from "@/app/lib/design-tokens";

interface SectionCardProps {
  icon?:         LucideIcon;
  /** Si se provee, el icono usa gradient editorial con texto blanco. */
  iconGradient?: GradientKey;
  eyebrow?:      string;
  title?:        string;
  description?:  string;
  actions?:      React.ReactNode;
  children?:     React.ReactNode;
  className?:    string;
  /** Padding del body. Default: md. */
  padding?:      "none" | "sm" | "md" | "lg";
  /** Variante visual. default=card con shadow, subtle=sin shadow, tinted=fondo suave */
  variant?:      "default" | "subtle" | "tinted";
  /** Si true, remueve el padding del header */
  headless?:     boolean;
}

/**
 * Contenedor editorial consistente para secciones dentro de páginas.
 * Reemplaza los divs ad-hoc de "bg-white rounded-2xl border..." que están
 * dispersos por los módulos.
 */
export const SectionCard = React.memo(function SectionCard({
  icon: Icon,
  iconGradient,
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
  padding = "md",
  variant = "default",
  headless = false,
}: SectionCardProps) {
  const variantCls =
    variant === "subtle" ? TOKENS.card.subtle :
    variant === "tinted" ? TOKENS.card.tinted + " border border-slate-200/70 dark:border-slate-800/70" :
    TOKENS.card.base + " " + TOKENS.card.shadow;

  const padCls =
    padding === "none" ? "" :
    padding === "sm"   ? "p-4" :
    padding === "lg"   ? "p-7 sm:p-8" :
    "p-5 sm:p-6";

  const hasHeader = !headless && (Icon || eyebrow || title || description || actions);

  return (
    <section className={cn(variantCls, "overflow-hidden", className)}>
      {hasHeader && (
        <header
          className={cn(
            "flex items-start justify-between gap-4 flex-wrap",
            padding === "none" ? "px-5 pt-5 sm:px-6 sm:pt-6" : `${padCls} pb-0`,
          )}
        >
          <div className="flex items-start gap-3 min-w-0 flex-1">
            {Icon && (
              <div
                className={cn(
                  "flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center",
                  iconGradient
                    ? `bg-gradient-to-br ${TOKENS.gradients[iconGradient]} text-white shadow-soft`
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
                )}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {eyebrow && (
                <p className={cn(TOKENS.eyebrow, "mb-1")}>
                  {eyebrow}
                </p>
              )}
              {title && (
                <h2 className="text-lg sm:text-xl font-bold text-ink dark:text-white tracking-tight leading-tight">
                  {title}
                </h2>
              )}
              {description && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {description}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
        </header>
      )}

      {children != null && (
        <div className={cn(hasHeader ? `${padCls} pt-4 sm:pt-5` : padCls)}>
          {children}
        </div>
      )}
    </section>
  );
});
