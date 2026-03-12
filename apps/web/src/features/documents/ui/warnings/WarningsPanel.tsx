/**
 * Warnings Panel
 * 
 * Displays generation warnings in a user-friendly format.
 */

"use client";

import React from "react";
import type { GenerationWarning } from "../../core/types";

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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

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
      {warnings.map((warning) => (
        <div
          key={warning.id}
          className={`rounded-lg border p-4 ${getSeverityColor(warning.severity)}`}
        >
          <div className="flex items-start">
            <span className="text-lg mr-2">{getSeverityIcon(warning.severity)}</span>
            <div className="flex-1">
              <p className="font-medium">{warning.message}</p>
              {warning.suggestion && (
                <p className="mt-1 text-sm opacity-90">{warning.suggestion}</p>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(warning.id)}
                className="ml-2 text-sm opacity-70 hover:opacity-100"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

