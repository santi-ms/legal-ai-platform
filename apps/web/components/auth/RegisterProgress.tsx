"use client";

interface RegisterProgressProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
}

export function RegisterProgress({
  currentStep,
  totalSteps,
  stepTitle,
}: RegisterProgressProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-10">
      <div className="flex justify-between items-end mb-2">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary">
            Paso {currentStep} de {totalSteps}
          </span>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            {stepTitle}
          </h3>
        </div>
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
          {Math.round(percentage)}% completado
        </span>
      </div>
      <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
}



