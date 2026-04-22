"use client";

import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  /** Icono decorativo a la izquierda (opcional) */
  icon?: ReactNode;
  /** Ayuda debajo del campo (mostrada cuando no hay error) */
  hint?: string;
  /** Si es "password", muestra toggle de visibilidad */
  passwordToggle?: boolean;
}

/**
 * Campo de formulario con label flotante.
 *
 * Usa el patrón `peer` + `placeholder-transparent`: el input tiene
 * `placeholder=" "` para que `:placeholder-shown` sea true solo cuando
 * el usuario no tipeó nada. El label flota arriba cuando el campo está
 * focuseado o tiene contenido.
 *
 * Diseño alineado con la landing: paleta ink/parchment/gold/primary,
 * rounded-xl, focus rings sobrios (ring-2 ring-primary).
 */
export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  function AuthField(
    {
      label,
      error,
      icon,
      hint,
      passwordToggle,
      type: typeProp,
      className,
      id,
      disabled,
      ...rest
    },
    ref,
  ) {
    const [revealed, setRevealed] = useState(false);
    const isPassword = passwordToggle && typeProp === "password";
    const actualType = isPassword ? (revealed ? "text" : "password") : typeProp;

    // Generamos un id estable si no vino uno
    const autoId =
      id ?? `authfield-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

    return (
      <div className="space-y-1.5">
        <div className="relative">
          {icon && (
            <span
              aria-hidden="true"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10"
            >
              {icon}
            </span>
          )}

          <input
            ref={ref}
            id={autoId}
            type={actualType}
            placeholder=" "
            disabled={disabled}
            aria-invalid={!!error}
            aria-describedby={error ? `${autoId}-error` : hint ? `${autoId}-hint` : undefined}
            className={cn(
              // Base
              "peer w-full rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-white",
              "pt-6 pb-2 text-sm font-medium transition-all duration-200",
              "placeholder:text-transparent",
              // Padding horizontal (depende si hay icon)
              icon ? "pl-12 pr-4" : "px-4",
              // Padding extra derecha cuando hay toggle
              isPassword ? (icon ? "pr-12" : "pr-12") : "",
              // Borde según estado
              error
                ? "border-red-500 focus:border-red-500 focus:ring-red-500/30"
                : "border-slate-200 dark:border-slate-700 focus:border-primary",
              // Focus ring
              "focus:outline-none focus:ring-2 focus:ring-primary/20",
              // Disabled
              disabled && "opacity-60 cursor-not-allowed",
              className,
            )}
            {...rest}
          />

          <label
            htmlFor={autoId}
            className={cn(
              "absolute pointer-events-none font-medium transition-all duration-200",
              // Posición base (label arriba, pequeño)
              icon ? "left-12" : "left-4",
              "top-2 text-[11px] uppercase tracking-[0.12em]",
              // Color
              error
                ? "text-red-500"
                : "text-slate-500 peer-focus:text-primary dark:text-slate-400 dark:peer-focus:text-primary",
              // Cuando el placeholder se muestra (input vacío y sin focus), label baja y agranda
              "peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2",
              "peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal",
              "peer-placeholder-shown:text-slate-400 dark:peer-placeholder-shown:text-slate-500",
              // En focus, vuelve a la posición flotante
              "peer-focus:top-2 peer-focus:-translate-y-0",
              "peer-focus:text-[11px] peer-focus:uppercase peer-focus:tracking-[0.12em]",
            )}
          >
            {label}
          </label>

          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? "Ocultar contraseña" : "Mostrar contraseña"}
              tabIndex={-1}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              {revealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>

        {error ? (
          <p
            id={`${autoId}-error`}
            role="alert"
            className="text-xs text-red-500 font-medium pl-1"
          >
            {error}
          </p>
        ) : hint ? (
          <p
            id={`${autoId}-hint`}
            className="text-xs text-slate-500 dark:text-slate-400 pl-1"
          >
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
