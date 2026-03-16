"use client";

import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

interface InlineAISuggestionProps {
  quote: string;
  recommendation: string;
  onAccept?: () => void;
  onDiscard?: () => void;
  className?: string;
}

export function InlineAISuggestion({
  quote,
  recommendation,
  onAccept,
  onDiscard,
  className,
}: InlineAISuggestionProps) {
  return (
    <div className={cn("relative group my-6", className)}>
      <div className="absolute -left-8 top-0 h-full w-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-transparent hover:border-primary/20 transition-all">
        <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" />
          Sugerencia de IA: Claridad Contractual
        </h3>
        <p className="mb-2 italic text-slate-600 dark:text-slate-400">"{quote}"</p>
        <p className="text-sm text-slate-700 dark:text-slate-300">{recommendation}</p>
        <div className="flex gap-2 mt-3">
          {onAccept && (
            <Button
              onClick={onAccept}
              size="sm"
              className="text-[10px] font-bold bg-primary text-white px-3 py-1 rounded h-auto"
            >
              Aceptar
            </Button>
          )}
          {onDiscard && (
            <Button
              onClick={onDiscard}
              variant="ghost"
              size="sm"
              className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded h-auto"
            >
              Descartar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}


