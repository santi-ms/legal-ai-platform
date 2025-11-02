"use client";

import { ChevronLeft, ChevronRight, Check } from "lucide-react";
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
                  isClickable ? "cursor-pointer" : "cursor-not-allowed",
                  isCurrent
                    ? "text-emerald-400"
                    : isCompleted
                    ? "text-emerald-300 hover:text-emerald-200"
                    : "text-neutral-500"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all mb-2",
                    isCurrent
                      ? "border-emerald-400 bg-emerald-400/10"
                      : isCompleted
                      ? "border-emerald-500 bg-emerald-500 text-black"
                      : "border-neutral-600 bg-neutral-800"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
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
          <div className="bg-neutral-800 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full h-2 transition-all duration-300"
              style={{
                width: `${((currentStep + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-500">
            <span>Paso {currentStep + 1} de {steps.length}</span>
            <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% completado</span>
          </div>
        </div>
      </div>

      {/* Current Step Content */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">
            {currentStepData.title}
          </h2>
          {currentStepData.description && (
            <p className="text-neutral-400">{currentStepData.description}</p>
          )}
        </div>

        <div className="bg-neutral-900/50 rounded-xl border border-neutral-800 p-6 md:p-8">
          {children}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={isFirstStep || isLoading}
          className={cn(
            "inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all",
            isFirstStep || isLoading
              ? "text-neutral-600 cursor-not-allowed"
              : "text-neutral-300 hover:text-white hover:bg-neutral-800"
          )}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {previousButtonText}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed || isLoading}
          className={cn(
            "inline-flex items-center px-6 py-3 text-sm font-semibold rounded-lg transition-all",
            !canProceed || isLoading
              ? "bg-neutral-700 text-neutral-400 cursor-not-allowed"
              : "bg-emerald-500 text-black hover:bg-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          )}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
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
  className 
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






