"use client";

import { ChevronLeft, ChevronRight, Check, Loader2 } from "lucide-react";
import { cn } from "../../lib/utils";

export interface WizardStep {
  id: string;
  title: string;
  description?: string;
  isValid?: boolean;
  isCompleted?: boolean;
}

interface WizardProps {
  steps: WizardStep[];
  currentStep: number;
  onStepChange: (step: number) => void;
  children: React.ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  onComplete?: () => void;
  isLoading?: boolean;
  canProceed?: boolean;
  nextButtonText?: string;
  previousButtonText?: string;
  completeButtonText?: string;
}

export function Wizard({
  steps,
  currentStep,
  onStepChange,
  children,
  onNext,
  onPrevious,
  onComplete,
  isLoading = false,
  canProceed = true,
  nextButtonText = "Continuar",
  previousButtonText = "Anterior",
  completeButtonText = "Finalizar",
}: WizardProps) {
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const currentStepData = steps[currentStep];

  const handleNext = () => {
    if (isLastStep && onComplete) {
      onComplete();
    } else if (onNext) {
      onNext();
    } else {
      onStepChange(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (onPrevious) {
      onPrevious();
    } else {
      onStepChange(currentStep - 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicator */}
      <div className="mb-8">
        <nav className="flex items-center justify-between gap-4 pb-4">
          {steps.map((step, index) => {
            const isCurrent = index === currentStep;
            const isCompleted = step.isCompleted || index < currentStep;
            const isClickable = index <= currentStep;

            return (
              <button
                key={step.id}
                onClick={() => isClickable && onStepChange(index)}
                disabled={!isClickable}
                className={cn(
                  "flex flex-col items-center text-xs font-medium transition-all flex-1",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded",
                  isClickable ? "cursor-pointer" : "cursor-not-allowed",
                  isCurrent
                    ? "text-primary"
                    : isCompleted
                    ? "text-primary/70 hover:text-primary"
                    : "text-slate-400 dark:text-slate-600"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all mb-2",
                    isCurrent
                      ? "border-primary bg-primary/10 dark:bg-primary/20"
                      : isCompleted
                      ? "border-primary bg-primary text-white"
                      : "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className={cn(
                      "text-xs font-semibold",
                      isCurrent ? "text-primary" : "text-slate-400 dark:text-slate-500"
                    )}>
                      {index + 1}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <div className="leading-tight">{step.title}</div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Paso {currentStep + 1} de {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% completado</span>
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="text-slate-500 dark:text-slate-400">{currentStepData.description}</p>
          )}
        </div>

        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6 md:p-8">
          {children}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        {/* Botón Anterior */}
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirstStep || isLoading}
          className={cn(
            "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            isFirstStep || isLoading
              ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          )}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {previousButtonText}
        </button>

        {/* Botón Siguiente / Finalizar */}
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          className={cn(
            "inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            !canProceed || isLoading
              ? "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
              : "bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20"
          )}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              {isLastStep ? completeButtonText : nextButtonText}
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export function WizardStepContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}
