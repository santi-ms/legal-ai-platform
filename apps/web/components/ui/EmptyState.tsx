"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { TOKENS, type GradientKey } from "@/app/lib/design-tokens";

interface EmptyStateProps {
  icon?: LucideIcon;
  iconGradient?: GradientKey;
  /**
   * · "gradient" (default) — cuadrado pintado con gradiente, icono blanco.
   * · "outline" — cuadrado blanco con borde slate y trazo del icono en color.
   *   Versión editorial, sin bloques saturados.
   */
  iconTreatment?: "gradient" | "outline";
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  tips?: string[];
  className?: string;
  /** Optional "compact" size for smaller containers */
  size?: "default" | "compact";
}

const OUTLINE_ICON_COLOR: Record<GradientKey, string> = {
  primary:  "text-primary",
  violet:   "text-violet-600 dark:text-violet-400",
  emerald:  "text-emerald-600 dark:text-emerald-400",
  amber:    "text-amber-600 dark:text-amber-400",
  rose:     "text-rose-600 dark:text-rose-400",
  sky:      "text-sky-600 dark:text-sky-400",
  slate:    "text-slate-600 dark:text-slate-300",
  gold:     "text-gold-600 dark:text-gold-400",
  ink:      "text-ink dark:text-white",
};

export const EmptyState = React.memo(function EmptyState({
  icon: Icon,
  iconGradient = "primary",
  iconTreatment = "gradient",
  title,
  description,
  primaryAction,
  secondaryAction,
  tips,
  className,
  size = "default",
}: EmptyStateProps) {
  const isCompact = size === "compact";
  return (
    <div
      className={cn(
        "relative overflow-hidden w-full flex flex-col items-center justify-center",
        isCompact ? "min-h-[320px] p-8" : "min-h-[60vh] p-10 sm:p-14",
        className
      )}
    >
      {/* Soft background glow */}
      <div
        className={cn(
          "absolute -top-16 -right-16 w-96 h-96 rounded-full opacity-5 dark:opacity-10 blur-3xl bg-gradient-to-br pointer-events-none",
          TOKENS.gradients[iconGradient]
        )}
        aria-hidden
      />

      <div className="relative flex flex-col items-center text-center max-w-lg mx-auto w-full">
        {Icon && (
          iconTreatment === "outline" ? (
            <div
              className={cn(
                "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center mb-5",
                isCompact ? "w-12 h-12" : "w-16 h-16"
              )}
            >
              <Icon
                className={cn(OUTLINE_ICON_COLOR[iconGradient], isCompact ? "w-5 h-5" : "w-7 h-7")}
                strokeWidth={1.75}
              />
            </div>
          ) : (
            <div
              className={cn(
                "rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md mb-5",
                TOKENS.gradients[iconGradient],
                isCompact ? "w-12 h-12" : "w-16 h-16"
              )}
            >
              <Icon className={cn("text-white", isCompact ? "w-6 h-6" : "w-8 h-8")} strokeWidth={2} />
            </div>
          )
        )}

        <h3
          className={cn(
            "font-extrabold text-ink dark:text-white tracking-tight",
            isCompact ? "text-xl" : "text-2xl sm:text-3xl"
          )}
        >
          {title}
        </h3>

        {description && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        )}

        {(primaryAction || secondaryAction) && (
          <div className="mt-6 flex items-center gap-2 flex-wrap justify-center">
            {primaryAction}
            {secondaryAction}
          </div>
        )}

        {tips && tips.length > 0 && (
          <div className="mt-6 w-full text-left rounded-xl bg-white/60 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 p-4 backdrop-blur-sm">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
              Sugerencias para empezar
            </p>
            <ul className="space-y-1.5">
              {tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span className="mt-1 inline-block w-1 h-1 rounded-full bg-primary flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
});
