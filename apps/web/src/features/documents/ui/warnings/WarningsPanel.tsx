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
        return "!bg-red-900/30 !border-red-700 !text-red-300";
      case "warning":
        return "!bg-yellow-900/30 !border-yellow-700 !text-yellow-300";
      case "info":
        return "!bg-blue-900/30 !border-blue-700 !text-blue-300";
      default:
        return "!bg-gray-800 !border-gray-700 !text-gray-300";
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
                <p className="mt-1 text-sm !text-gray-400">{warning.suggestion}</p>
              )}
            </div>
            {onDismiss && (
              <button
                onClick={() => onDismiss(warning.id)}
                className="ml-2 text-sm !text-gray-400 hover:!text-gray-200 transition-colors"
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

