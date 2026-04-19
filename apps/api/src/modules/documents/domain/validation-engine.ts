/**
 * Validation Engine (Backend)
 * 
 * Server-side validation for document generation.
 * Validates structured data before document assembly.
 */

import type {
  StructuredDocumentData,
  GenerationWarning,
} from "./document-types.js";

/**
 * Validation Result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: GenerationWarning[];
}

/**
 * Semantic Validation Rule (Backend)
 */
export interface SemanticValidationRule {
  id: string;
  name: string;
  description: string;
  check: (data: StructuredDocumentData) => boolean | string;
  severity: "error" | "warning";
}

/**
 * Warning Rule (Backend)
 */
export interface WarningRule {
  id: string;
  name: string;
  description: string;
  check: (data: StructuredDocumentData) => boolean;
  message: string;
  suggestion?: string;
}

/**
 * Validate structured document data
 * 
 * @param data - Structured document data
 * @param semanticRules - Semantic validation rules
 * @param warningRules - Warning rules
 * @returns Validation result
 */
export function validateDocumentData(
  data: StructuredDocumentData,
  semanticRules: SemanticValidationRule[] = [],
  warningRules: WarningRule[] = []
): ValidationResult {
  const errors: string[] = [];
  const warnings: GenerationWarning[] = [];
  
  // Run semantic validations
  semanticRules.forEach(rule => {
    const result = rule.check(data);
    
    if (result !== true) {
      const errorMessage = typeof result === "string" ? result : rule.description;
      
      if (rule.severity === "error") {
        errors.push(errorMessage);
      } else {
        warnings.push({
          id: `warning-${rule.id}-${Date.now()}`,
          ruleId: rule.id,
          message: errorMessage,
          severity: "warning",
        });
      }
    }
  });
  
  // Check warning rules
  warningRules.forEach(rule => {
    if (rule.check(data)) {
      warnings.push({
        id: `warning-${rule.id}-${Date.now()}`,
        ruleId: rule.id,
        message: rule.message,
        suggestion: rule.suggestion,
        severity: "warning",
      });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get validation rules for a document type
 * 
 * @param documentType - Document type ID
 * @returns Array of validation rules for this type
 */
export async function getValidationRulesForType(
  documentType: string
): Promise<{
  semantic: SemanticValidationRule[];
  warnings: WarningRule[];
}> {
  // Import and use validation rules
  const { getValidationRulesForType: getRules } = await import("./validation-rules.js");
  return getRules(documentType);
}

