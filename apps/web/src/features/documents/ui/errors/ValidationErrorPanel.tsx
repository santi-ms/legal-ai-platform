/**
 * Validation Error Panel
 * 
 * Displays validation errors in a clear and actionable format.
 */

"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";

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
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <h4 className="font-semibold text-red-900">
            Errores de validación ({errors.length})
          </h4>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      <ul className="space-y-2">
        {errors.map((error, index) => (
          <li key={index} className="flex items-start space-x-2">
            <span className="text-red-600 mt-0.5">•</span>
            <span className="text-sm text-red-800 flex-1">
              {error.message}
              {error.fieldId && onFieldClick && (
                <button
                  onClick={() => onFieldClick(error.fieldId!)}
                  className="ml-2 text-red-600 underline hover:text-red-800"
                >
                  Ir al campo
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>
      
      <p className="mt-3 text-xs text-red-700">
        Corregí estos errores antes de continuar con la generación del documento.
      </p>
    </div>
  );
}

