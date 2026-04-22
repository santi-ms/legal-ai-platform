"use client";

import React from "react";
import { cn } from "@/app/lib/utils";
import { TOKENS, type GradientKey } from "@/app/lib/design-tokens";

interface RiskDotProps {
  tone?:     GradientKey;
  size?:     "xs" | "sm" | "md";
  /** Agrega pulse animado para máxima urgencia */
  pulse?:    boolean;
  className?: string;
  title?:    string;
}

/**
 * Punto de color con gradient editorial — para listas densas
 * donde un pill es demasiado pesado. Siempre con shadow-soft sutil.
 */
export function RiskDot({
  tone = "primary",
  size = "sm",
  pulse,
  className,
  title,
}: RiskDotProps) {
  const gradient = TOKENS.gradients[tone];
  const sizeCls =
    size === "xs" ? "w-2 h-2"    :
    size === "md" ? "w-3 h-3"    :
                    "w-2.5 h-2.5";

  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-gradient-to-br shadow-soft flex-shrink-0",
        gradient,
        sizeCls,
        className,
      )}
      title={title}
      aria-hidden={!title}
    >
      {pulse && (
        <span
          className={cn(
            "absolute inline-flex rounded-full opacity-60 animate-ping bg-gradient-to-br",
            gradient,
            sizeCls,
          )}
        />
      )}
    </span>
  );
}
