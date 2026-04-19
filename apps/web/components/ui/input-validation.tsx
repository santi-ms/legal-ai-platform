"use client";

import { useState, useCallback } from "react";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

interface InputValidationProps {
  isValid?: boolean;
  isChecking?: boolean;
  isValidating?: boolean;
  errorMessage?: string;
  successMessage?: string;
  className?: string;
}

export function InputValidation({
  isValid,
  isChecking,
  isValidating,
  errorMessage,
  successMessage,
  className,
}: InputValidationProps) {
  if (!isChecking && !isValidating && isValid === undefined) return null;

  if (isValidating || isChecking) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-neutral-400", className)}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Verificando...</span>
      </div>
    );
  }

  if (isValid === true) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-emerald-600", className)}>
        <CheckCircle className="w-3.5 h-3.5" />
        <span>{successMessage || "Válido"}</span>
      </div>
    );
  }

  if (isValid === false && errorMessage) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-red-600", className)}>
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  return null;
}

// Hook para validar campos en tiempo real
export function useFieldValidation() {
  const [status, setStatus] = useState<Record<string, boolean | undefined>>({});
  const [checking, setChecking] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    async (field: string, validator: () => Promise<boolean>) => {
      setChecking((prev) => ({ ...prev, [field]: true }));
      try {
        const result = await validator();
        setStatus((prev) => ({ ...prev, [field]: result }));
        return result;
      } catch {
        setStatus((prev) => ({ ...prev, [field]: false }));
        return false;
      } finally {
        setChecking((prev) => ({ ...prev, [field]: false }));
      }
    },
    []
  );

  return { status, checking, validateField };
}

