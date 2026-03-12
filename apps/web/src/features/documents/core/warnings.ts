/**
 * Warning System
 * 
 * Non-blocking alerts that suggest improvements or highlight missing information.
 * Warnings don't prevent document generation but inform the user about potential issues.
 */

import type {
  WarningRule,
  GenerationWarning,
  StructuredDocumentData,
} from "./types";

/**
 * Warning Severity Levels
 */
export type WarningSeverity = "info" | "warning" | "error";

/**
 * Warning Category
 */
export type WarningCategory =
  | "missing_information"
  | "incomplete_data"
  | "potential_issue"
  | "best_practice"
  | "legal_recommendation";

/**
 * Enhanced Warning with Category
 */
export interface EnhancedWarning extends GenerationWarning {
  category: WarningCategory;
  fieldIds?: string[]; // Fields related to this warning
}

/**
 * Check all warning rules and return enhanced warnings
 * 
 * @param rules - Array of warning rules
 * @param data - Form data
 * @returns Array of enhanced warnings
 */
export function checkAllWarnings(
  rules: WarningRule[],
  data: StructuredDocumentData
): EnhancedWarning[] {
  return rules
    .filter(rule => rule.check(data))
    .map(rule => ({
      id: `warning-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      message: rule.message,
      suggestion: rule.suggestion,
      severity: "warning" as const,
      category: inferCategory(rule),
    }));
}

/**
 * Infer warning category from rule
 * 
 * @param rule - Warning rule
 * @returns Inferred category
 */
function inferCategory(rule: WarningRule): WarningCategory {
  const name = rule.name.toLowerCase();
  const description = rule.description.toLowerCase();
  
  if (name.includes("missing") || name.includes("falta") || description.includes("no se definió")) {
    return "missing_information";
  }
  
  if (name.includes("incomplete") || name.includes("incompleto")) {
    return "incomplete_data";
  }
  
  if (name.includes("potential") || name.includes("potencial") || name.includes("puede")) {
    return "potential_issue";
  }
  
  if (name.includes("best practice") || name.includes("buena práctica") || name.includes("recomendación")) {
    return "best_practice";
  }
  
  if (name.includes("legal") || name.includes("jurídico") || name.includes("recomendación legal")) {
    return "legal_recommendation";
  }
  
  return "potential_issue";
}

/**
 * Group warnings by category
 * 
 * @param warnings - Array of warnings
 * @returns Warnings grouped by category
 */
export function groupWarningsByCategory(
  warnings: EnhancedWarning[]
): Record<WarningCategory, EnhancedWarning[]> {
  const grouped: Record<WarningCategory, EnhancedWarning[]> = {
    missing_information: [],
    incomplete_data: [],
    potential_issue: [],
    best_practice: [],
    legal_recommendation: [],
  };
  
  warnings.forEach(warning => {
    grouped[warning.category].push(warning);
  });
  
  return grouped;
}

/**
 * Filter warnings by severity
 * 
 * @param warnings - Array of warnings
 * @param severity - Severity level to filter
 * @returns Filtered warnings
 */
export function filterWarningsBySeverity(
  warnings: GenerationWarning[],
  severity: WarningSeverity
): GenerationWarning[] {
  return warnings.filter(w => w.severity === severity);
}

/**
 * Get warning summary
 * 
 * @param warnings - Array of warnings
 * @returns Summary object
 */
export function getWarningSummary(warnings: GenerationWarning[]) {
  return {
    total: warnings.length,
    info: warnings.filter(w => w.severity === "info").length,
    warning: warnings.filter(w => w.severity === "warning").length,
    error: warnings.filter(w => w.severity === "error").length,
  };
}

/**
 * Evaluate warning rules and return warnings
 * 
 * @param data - Form data
 * @param rules - Array of warning rules
 * @returns Array of warnings
 */
export function evaluateWarningRules(
  data: StructuredDocumentData,
  rules: WarningRule[]
): GenerationWarning[] {
  return rules
    .filter(rule => rule.check(data))
    .map(rule => ({
      id: `warning-${rule.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      message: rule.message,
      suggestion: rule.suggestion,
      severity: "warning" as const,
    }));
}

