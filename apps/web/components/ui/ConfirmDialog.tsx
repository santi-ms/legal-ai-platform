"use client";

import { useEffect, useRef } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { Button } from "@/components/ui/button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  variant?: "default" | "destructive";
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "default",
}: ConfirmDialogProps) {
  // Foco inicial en Cancelar — patrón defensivo para acciones destructivas
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Cerrar con ESC (desactivado mientras carga para evitar cierre accidental)
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, isLoading, onCancel]);

  // Foco al abrir el dialog
  useEffect(() => {
    if (open) {
      // Pequeño defer para que el elemento ya esté en el DOM
      const timeout = setTimeout(() => cancelRef.current?.focus(), 50);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  if (!open) return null;

  const isDestructive = variant === "destructive";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => { if (!isLoading) onCancel(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={description ? "confirm-dialog-description" : undefined}
    >
      {/* Card — stopPropagation para que el clic interno no cierre el backdrop */}
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start gap-4">
          {isDestructive && (
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/30">
              <AlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
          )}
          <div className="space-y-1">
            <h2
              id="confirm-dialog-title"
              className="text-base font-semibold text-slate-900 dark:text-white leading-snug"
            >
              {title}
            </h2>
            {description && (
              <p
                id="confirm-dialog-description"
                className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
          <Button
            ref={cancelRef}
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "sm:w-auto",
              isDestructive &&
                "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white border-transparent focus-visible:ring-red-500"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

