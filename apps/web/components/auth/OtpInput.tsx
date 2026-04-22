"use client";

import {
  useRef,
  useEffect,
  type ClipboardEvent,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { cn } from "@/app/lib/utils";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

/**
 * Input de código de un solo uso (OTP) con cajas independientes.
 *
 * Soporta:
 * - Auto-focus progresivo al tipear
 * - Backspace que retrocede a la caja anterior
 * - Flechas para navegar entre cajas
 * - Pegar un código completo desde el portapapeles
 * - Sólo dígitos (filtra el resto)
 *
 * El `value` se controla desde afuera — no guarda estado interno. La UI
 * sigue la estética de la landing: rounded-xl, border sobrio, focus ring
 * primary, tipografía Inter extrabold.
 */
export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  error = false,
  autoFocus = false,
}: OtpInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus && refs.current[0]) {
      refs.current[0].focus();
    }
  }, [autoFocus]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const setDigit = (index: number, digit: string) => {
    const next = digits.slice();
    next[index] = digit;
    onChange(next.join(""));
  };

  const handleChange = (
    index: number,
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const raw = event.target.value.replace(/\D/g, "");

    if (!raw) {
      setDigit(index, "");
      return;
    }

    // Si ingresan más de un dígito (autocomplete o paste parcial), los
    // distribuimos en las cajas siguientes
    if (raw.length > 1) {
      const next = digits.slice();
      for (let i = 0; i < raw.length && index + i < length; i++) {
        next[index + i] = raw[i];
      }
      onChange(next.join(""));
      const nextIndex = Math.min(index + raw.length, length - 1);
      refs.current[nextIndex]?.focus();
      return;
    }

    setDigit(index, raw);

    // Mover al siguiente
    if (index < length - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      if (!digits[index] && index > 0) {
        event.preventDefault();
        setDigit(index - 1, "");
        refs.current[index - 1]?.focus();
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < length - 1) {
      event.preventDefault();
      refs.current[index + 1]?.focus();
      return;
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    onChange(pasted.padEnd(length, "").slice(0, length));
    const targetIndex = Math.min(pasted.length, length - 1);
    refs.current[targetIndex]?.focus();
  };

  return (
    <div
      className="flex items-center justify-between gap-2 sm:gap-3"
      role="group"
      aria-label="Código de verificación"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          disabled={disabled}
          aria-label={`Dígito ${index + 1} de ${length}`}
          className={cn(
            "w-11 h-14 sm:w-12 sm:h-16 rounded-xl border-2 text-center font-extrabold text-xl sm:text-2xl tracking-tight bg-white dark:bg-slate-900 text-slate-900 dark:text-white",
            "transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/20",
            error
              ? "border-red-500 focus:border-red-500"
              : digit
              ? "border-primary"
              : "border-slate-200 dark:border-slate-700 focus:border-primary",
            disabled && "opacity-60 cursor-not-allowed",
          )}
        />
      ))}
    </div>
  );
}
