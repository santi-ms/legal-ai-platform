"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { TOKENS, type StatusKey } from "@/app/lib/design-tokens";

interface StatusPillProps {
  /** Semántica: danger | warning | success | info | neutral | gold */
  tone?:     StatusKey;
  /** Icon opcional a la izquierda del texto. */
  icon?:     LucideIcon;
  /** Punto de color a la izquierda (alternativa al icon) */
  dot?:      boolean;
  /** Tamaño: sm (denso, tablas) | md (default) */
  size?:     "sm" | "md";
  /** Uppercase + tracking wider (para badges de estado fuertes) */
  uppercase?: boolean;
  className?: string;
  children:   React.ReactNode;
}

/**
 * Pill editorial para estados, riesgo, urgencia, etiquetas.
 * Usar SIEMPRE en lugar de bg-{color}-50 rounded-full ad-hoc.
 * Los tonos se mapean a TOKENS.status para consistencia dark/light.
 */
export function StatusPill({
  tone = "neutral",
  icon: Icon,
  dot,
  size = "md",
  uppercase,
  className,
  children,
}: StatusPillProps) {
  const t = TOKENS.status[tone];
  const sizeCls =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-xs";

  const dotColor =
    tone === "danger"  ? "bg-rose-500"    :
    tone === "warning" ? "bg-amber-500"   :
    tone === "success" ? "bg-emerald-500" :
    tone === "info"    ? "bg-blue-500"    :
    tone === "gold"    ? "bg-gold-500"    :
                         "bg-slate-400";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold border",
        sizeCls,
        t.bg,
        t.text,
        t.border,
        uppercase && "uppercase tracking-wider",
        className,
      )}
    >
      {Icon && <Icon className={size === "sm" ? "w-3 h-3" : "w-3.5 h-3.5"} />}
      {dot && !Icon && (
        <span className={cn("w-1.5 h-1.5 rounded-full", dotColor)} aria-hidden />
      )}
      {children}
    </span>
  );
}
