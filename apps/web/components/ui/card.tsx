import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Card primitive editorial.
 *
 * Por defecto: superficie blanca / slate-900 + borde sutil + radius 2xl.
 * Variantes: `subtle` (sin sombra), `tinted` (parchment suave), `ink` (dark)
 */

type CardVariant = "default" | "subtle" | "tinted" | "ink";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  /** Padding built-in. `false` desactiva el padding (útil para cards con header/list custom). */
  padded?: boolean;
  /** Hover sutil. */
  interactive?: boolean;
}

const VARIANTS: Record<CardVariant, string> = {
  default:
    "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft",
  subtle:
    "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800",
  tinted:
    "bg-parchment/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200/60 dark:border-slate-800/60",
  ink:
    "bg-ink text-white rounded-2xl border border-slate-800 shadow-soft",
};

export function Card({
  className,
  variant = "default",
  padded = false,
  interactive = false,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        VARIANTS[variant],
        padded && "p-6",
        interactive &&
          "transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-hover",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-6 pt-6 pb-4 border-b border-slate-200/70 dark:border-slate-800/70",
        className,
      )}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-lg font-bold tracking-tight text-slate-900 dark:text-white",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("mt-1 text-sm text-slate-600 dark:text-slate-400", className)}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-t border-slate-200/70 dark:border-slate-800/70 flex items-center",
        className,
      )}
      {...props}
    />
  );
}
