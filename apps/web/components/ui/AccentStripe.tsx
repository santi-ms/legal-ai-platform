"use client";

import React from "react";
import { cn } from "@/app/lib/utils";
import { TOKENS, type GradientKey } from "@/app/lib/design-tokens";

interface AccentStripeProps {
  tone?:     GradientKey;
  /** Orientación: left (default) = barra vertical a la izquierda | top = horizontal arriba */
  side?:     "left" | "top";
  /** Grosor: thin (2px) | md (3px, default) | thick (4px) */
  thickness?: "thin" | "md" | "thick";
  className?: string;
}

/**
 * Barra de acento editorial para señalar categoría/riesgo/tono
 * SIN pintar fondos grandes. Se posiciona absolute dentro de un card
 * con `relative`. Alternativa sobria a los bg-{color}-50 extendidos.
 */
export function AccentStripe({
  tone = "primary",
  side = "left",
  thickness = "md",
  className,
}: AccentStripeProps) {
  const gradient = TOKENS.gradients[tone];

  const thicknessPx =
    thickness === "thin"  ? (side === "left" ? "w-[2px]" : "h-[2px]") :
    thickness === "thick" ? (side === "left" ? "w-1"      : "h-1")     :
                            (side === "left" ? "w-[3px]" : "h-[3px]");

  const positionCls =
    side === "left"
      ? "left-0 top-0 bottom-0"
      : "top-0 left-0 right-0";

  return (
    <span
      aria-hidden
      className={cn(
        "absolute pointer-events-none bg-gradient-to-b",
        side === "top" && "bg-gradient-to-r",
        gradient,
        thicknessPx,
        positionCls,
        className,
      )}
    />
  );
}
