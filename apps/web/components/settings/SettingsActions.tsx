"use client";

import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
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
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-3",
        className,
      )}
    >
      {onDiscard && (
        <Button
          variant="ghost"
          onClick={onDiscard}
          disabled={!hasChanges || isLoading}
          className="px-6 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Descartar cambios
        </Button>
      )}
      {onSave && (
        <Button
          onClick={onSave}
          disabled={!hasChanges || isLoading}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold bg-ink text-white hover:bg-slate-900 shadow-soft hover:shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar cambios
            </>
          )}
        </Button>
      )}
    </div>
  );
}
