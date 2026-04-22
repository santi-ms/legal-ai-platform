import * as React from "react";
import { cn } from "../../lib/utils";

export type ButtonVariant =
  | "default"     // CTA azul primary — acento clásico
  | "ink"         // CTA editorial bg-ink (preferido en hero y acciones principales)
  | "accent"      // Sinónimo de "default" para claridad semántica
  | "gold"        // Acciones dorado — destacadas / upgrade
  | "outline"     // Borde editorial
  | "ghost"       // Terciario
  | "subtle"      // Botón de filtro, chip-like
  | "danger";     // Destructivo

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
}

const BASE =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed select-none";

const VARIANTS: Record<ButtonVariant, string> = {
  default:
    "bg-primary text-white hover:bg-primary/90 shadow-soft hover:shadow-hover",
  ink:
    "bg-ink text-white hover:bg-slate-900 shadow-soft hover:shadow-hover",
  accent:
    "bg-primary text-white hover:bg-primary/90 shadow-soft hover:shadow-hover",
  gold:
    "bg-gold-500 text-ink hover:bg-gold-600 shadow-soft hover:shadow-glow-gold",
  outline:
    "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800",
  ghost:
    "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
  subtle:
    "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 shadow-soft",
};

const SIZES: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-[15px] rounded-xl",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
