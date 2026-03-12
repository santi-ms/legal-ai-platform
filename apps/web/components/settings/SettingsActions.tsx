"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

interface SettingsActionsProps {
  onDiscard?: () => void;
  onSave?: () => void;
  hasChanges?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function SettingsActions({
  onDiscard,
  onSave,
  hasChanges = false,
  isLoading = false,
  className,
}: SettingsActionsProps) {
  return (
    <div className={cn("flex items-center justify-end gap-3 px-4 py-10", className)}>
      {onDiscard && (
        <Button
          variant="ghost"
          onClick={onDiscard}
          disabled={!hasChanges || isLoading}
          className="px-6 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Descartar cambios
        </Button>
      )}
      {onSave && (
        <Button
          onClick={onSave}
          disabled={!hasChanges || isLoading}
          className="px-8 py-2.5 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
              Guardando...
            </>
          ) : (
            "Guardar configuración"
          )}
        </Button>
      )}
    </div>
  );
}

