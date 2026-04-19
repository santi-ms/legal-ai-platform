/**
 * Autosave Indicator
 *
 * Shows persistent visual feedback of draft save status with timestamp.
 * - While saving: animated spinner + "Guardando borrador..."
 * - After saved: persists with "Guardado a las HH:MM" until next save cycle
 */

"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface AutosaveIndicatorProps {
  isSaving: boolean;
  lastSaved?: Date | null;
  className?: string;
}

function formatSavedTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) {
    return "Guardado hace un momento";
  }
  if (diffMin === 1) {
    return "Guardado hace 1 min";
  }
  if (diffMin < 60) {
    return `Guardado hace ${diffMin} min`;
  }
  return `Guardado a las ${date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function AutosaveIndicator({
  isSaving,
  lastSaved,
  className,
}: AutosaveIndicatorProps) {
  // Re-render cada 30s para actualizar el tiempo relativo
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!lastSaved) return;
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, [lastSaved]);

  // No mostrar nada si nunca se guardó y no está guardando
  if (!isSaving && !lastSaved) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all",
        isSaving
          ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800"
          : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={isSaving ? "Guardando borrador" : lastSaved ? formatSavedTime(lastSaved) : ""}
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          <span>Guardando...</span>
        </>
      ) : lastSaved ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>{formatSavedTime(lastSaved)}</span>
        </>
      ) : null}
    </div>
  );
}
