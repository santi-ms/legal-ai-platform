"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

interface DocumentNavigationButtonsProps {
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  showPrevious?: boolean;
  showNext?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function DocumentNavigationButtons({
  onPrevious,
  onNext,
  previousLabel = "Anterior",
  nextLabel = "Continuar",
  showPrevious = true,
  showNext = true,
  isLoading = false,
  className,
}: DocumentNavigationButtonsProps) {
  return (
    <div className={cn("flex items-center justify-between pt-6", className)}>
      {showPrevious && onPrevious ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onPrevious}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-slate-600 hover:bg-slate-100 transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
          {previousLabel}
        </Button>
      ) : (
        <div></div>
      )}

      {showNext && onNext && (
        <Button
          type="button"
          onClick={onNext}
          disabled={isLoading}
          className="flex items-center gap-2 rounded-lg bg-primary px-8 py-3 font-semibold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:translate-y-[-1px] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Procesando...
            </>
          ) : (
            <>
              {nextLabel}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}

