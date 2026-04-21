"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { TOKENS, type GradientKey } from "@/app/lib/design-tokens";

interface EmptyStateProps {
  icon?: LucideIcon;
  iconGradient?: GradientKey;
  title: string;
  description?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  tips?: string[];
  className?: string;
  /** Optional "compact" size for smaller containers */
  size?: "default" | "compact";
}

export const EmptyState = React.memo(function EmptyState({
  icon: Icon,
  iconGradient = "primary",
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
        "relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
        isCompact ? "p-8" : "p-10 sm:p-14",
        className
      )}
    >
      {/* Soft background glow */}
      <div
        className={cn(
          "absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10 dark:opacity-20 blur-3xl bg-gradient-to-br pointer-events-none",
          TOKENS.gradients[iconGradient]
        )}
        aria-hidden
      />

      <div className="relative flex flex-col items-center text-center max-w-md mx-auto">
        {Icon && (
          <div
            className={cn(
              "rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md mb-5",
              TOKENS.gradients[iconGradient],
              isCompact ? "w-12 h-12" : "w-16 h-16"
            )}
          >
            <Icon className={cn("text-white", isCompact ? "w-6 h-6" : "w-8 h-8")} strokeWidth={2} />
          </div>
        )}

        <h3
          className={cn(
            "font-bold text-slate-900 dark:text-slate-50 tracking-tight",
            isCompact ? "text-lg" : "text-xl sm:text-2xl"
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
          <div className="mt-6 w-full text-left rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-4">
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
