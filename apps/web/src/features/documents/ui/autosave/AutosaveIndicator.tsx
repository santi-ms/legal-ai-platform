/**
 * Autosave Indicator
 * 
 * Shows visual feedback when draft is being saved.
 */

"use client";

import React, { useState, useEffect } from "react";
import { Save, CheckCircle2 } from "lucide-react";
import { darkModeClasses } from "../styles/dark-mode";

interface AutosaveIndicatorProps {
  isSaving: boolean;
  lastSaved?: Date | null;
}

/**
 * Autosave indicator component
 */
export function AutosaveIndicator({
  isSaving,
  lastSaved,
}: AutosaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    if (lastSaved && !isSaving) {
      setShowSaved(true);
      const timeout = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [lastSaved, isSaving]);

  if (!isSaving && !showSaved) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 text-sm ${darkModeClasses.helpText}`}>
      {isSaving ? (
        <>
          <Save className="h-4 w-4 animate-pulse text-blue-400" />
          <span>Guardando borrador...</span>
        </>
      ) : showSaved ? (
        <>
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          <span>Borrador guardado</span>
        </>
      ) : null}
    </div>
  );
}

