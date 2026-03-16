"use client";

import { cn } from "@/app/lib/utils";

interface GenerationProgressProps {
  percentage: number;
  currentStep?: string;
  className?: string;
}

export function GenerationProgress({
  percentage,
  currentStep,
  className,
}: GenerationProgressProps) {
  const clampedPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <div className="flex flex-col gap-1">
            <p className="text-slate-900 dark:text-white text-lg font-semibold">
              Progreso de Redacción
            </p>
            {currentStep && (
              <p className="text-slate-500 dark:text-slate-400 text-sm">{currentStep}</p>
            )}
          </div>
          <span className="text-primary text-2xl font-bold">{Math.round(clampedPercentage)}%</span>
        </div>
        <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${clampedPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}


