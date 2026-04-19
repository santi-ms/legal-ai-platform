"use client";

import { cn } from "@/app/lib/utils";

interface Step {
  id: string;
  label: string;
}

interface DocumentProgressBarProps {
  currentStep: number;
  totalSteps: number;
  documentTitle: string;
  steps: Step[];
}

export function DocumentProgressBar({
  currentStep,
  totalSteps,
  documentTitle,
  steps,
}: DocumentProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            Paso {currentStep} de {totalSteps}
          </span>
          <h1 className="text-2xl font-bold lg:text-3xl text-slate-900 dark:text-white">
            {documentTitle}
          </h1>
        </div>
        <div className="text-right">
          <span className="text-sm font-bold text-primary">
            {Math.round(percentage)}% completado
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-3 w-full overflow-hidden rounded-full bg-primary/10">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Steps Labels */}
      <div className="mt-4 flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;

          return (
            <span
              key={step.id}
              className={cn(
                "transition-colors",
                isActive && "text-primary font-bold",
                isCompleted && "text-slate-400"
              )}
            >
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}



