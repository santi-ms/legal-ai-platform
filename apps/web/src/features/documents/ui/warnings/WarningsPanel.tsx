/**
 * Warnings Panel
 * 
 * Displays generation warnings in a user-friendly format.
 */

"use client";

import React from "react";
import type { GenerationWarning } from "../../core/types";
import { getSeverityClasses } from "../styles/dark-mode";

interface WarningsPanelProps {
  warnings: GenerationWarning[];
  onDismiss?: (warningId: string) => void;
}

/**
 * Warnings panel component
 */
export function WarningsPanel({
  warnings,
  onDismiss,
}: WarningsPanelProps) {
  if (warnings.length === 0) {
    return null;
  }


  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "error":
        return "⚠️";
      case "warning":
        return "⚠️";
      case "info":
        return "ℹ️";
      default:
        return "ℹ️";
    }
  };

  return (
    <div className="space-y-3">
      {warnings.map((warning) => {
        const severityClasses = getSeverityClasses(
          (warning.severity as 'error' | 'warning' | 'info') || 'default'
        );
        return (
          <div
            key={warning.id}
            className={`rounded-lg border p-4 ${severityClasses.bg} ${severityClasses.border}`}
          >
            <div className="flex items-start">
              <span className={`text-lg mr-2 ${severityClasses.icon}`}>{getSeverityIcon(warning.severity)}</span>
              <div className="flex-1">
                <p className={`font-medium ${severityClasses.text}`}>{warning.message}</p>
                {warning.suggestion && (
                  <p className={`mt-1 text-sm text-gray-400`}>{warning.suggestion}</p>
                )}
              </div>
              {onDismiss && (
                <button
                  onClick={() => onDismiss(warning.id)}
                  className="ml-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

