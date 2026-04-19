/**
 * Validation Error Panel
 * 
 * Displays validation errors in a clear and actionable format.
 */

"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";
import { darkModeClasses } from "../styles/dark-mode";

interface ValidationError {
  fieldId?: string;
  ruleId?: string;
  message: string;
}

interface ValidationErrorPanelProps {
  errors: ValidationError[];
  onDismiss?: () => void;
  onFieldClick?: (fieldId: string) => void;
}

/**
 * Validation error panel component
 */
export function ValidationErrorPanel({
  errors,
  onDismiss,
  onFieldClick,
}: ValidationErrorPanelProps) {
  if (errors.length === 0) {
    return null;
  }

  return (
    <div className={`p-4 rounded-lg ${darkModeClasses.errorPanel}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className={`h-5 w-5 ${darkModeClasses.errorText}`} />
          <h4 className={`font-semibold text-red-300`}>
            Errores de validación ({errors.length})
          </h4>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={`transition-colors ${darkModeClasses.errorText} hover:text-red-300`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <ul className="space-y-2">
        {errors.map((error, index) => (
          <li key={index} className="flex items-start space-x-2">
            <span className={`mt-0.5 ${darkModeClasses.errorText}`}>•</span>
            <span className={`text-sm flex-1 text-red-300`}>
              {error.message}
              {error.fieldId && onFieldClick && (
                <button
                  onClick={() => onFieldClick(error.fieldId!)}
                  className={`ml-2 underline transition-colors ${darkModeClasses.errorText} hover:text-red-300`}
                >
                  Ir al campo
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      
      <p className={`mt-3 text-xs ${darkModeClasses.errorText}`}>
        Corregí estos errores antes de continuar con la generación del documento.
      </p>
    </div>
  );
}

