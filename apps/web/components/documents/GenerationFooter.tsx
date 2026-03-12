"use client";

import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

interface GenerationFooterProps {
  estimatedTime?: string;
  onCancel?: () => void;
  className?: string;
}

export function GenerationFooter({
  estimatedTime = "entre 45 y 60 segundos",
  onCancel,
  className,
}: GenerationFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 py-6 border-t border-slate-200 dark:border-slate-800",
        className
      )}
    >
      <div className="flex gap-2 items-center text-slate-500 dark:text-slate-400 text-sm">
        <Info className="w-4 h-4" />
        <span>Este proceso suele tardar {estimatedTime}.</span>
      </div>
      {onCancel && (
        <Button
          variant="ghost"
          onClick={onCancel}
          className="px-6 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <X className="w-4 h-4 mr-2" />
          Cancelar Generación
        </Button>
      )}
    </div>
  );
}

