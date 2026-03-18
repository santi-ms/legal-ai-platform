/**
 * Document Validation System
 * 
 * Provides three levels of validation:
 * 1. Field-level validation (format, required, etc.)
 * 2. Semantic validation (business logic rules)
 * 3. Warning rules (non-blocking alerts)
 */

import type {
  DocumentFieldConfig,
  DocumentSchemaDefinition,
  DocumentSection,
  SemanticValidationRule,
  WarningRule,
  StructuredDocumentData,
  GenerationWarning,
} from "./types";

/**
 * Field Validation Result
 */
export interface FieldValidationResult {
  fieldId: string;
  valid: boolean;
  error?: string;
}

/**
 * Semantic Validation Result
 */
export interface SemanticValidationResult {
  ruleId: string;
  valid: boolean;
  error?: string;
  severity: "error" | "warning";
}

/**
 * Validate a single field value
 * 
 * @param field - Field configuration
 * @param value - Field value to validate
 * @param allData - All form data (for conditional validation)
 * @returns Validation result
 */
export function validateField(
  field: DocumentFieldConfig,
  value: unknown,
  allData: StructuredDocumentData = {}
): FieldValidationResult {
  // Check required
  if (field.required && (value === undefined || value === null || value === "")) {
    return {
      fieldId: field.id,
      valid: false,
      error: `${field.label} es requerido`,
    };
  }
  
  // Skip further validation if field is empty and not required
  if (!field.required && (value === undefined || value === null || value === "")) {
    return { fieldId: field.id, valid: true };
  }
  
  // Type-specific validation
  if (field.validation) {
    const validation = field.validation;
    
    // String validations
    if (typeof value === "string") {
      if (validation.minLength && value.length < validation.minLength) {
        return {
          fieldId: field.id,
          valid: false,
          error: `${field.label} debe tener al menos ${validation.minLength} caracteres`,
        };
      }
      
      if (validation.maxLength && value.length > validation.maxLength) {
        return {
          fieldId: field.id,
          valid: false,
          error: `${field.label} no puede tener más de ${validation.maxLength} caracteres`,
        };
      }
      
      if (validation.pattern) {
        const regex = new RegExp(validation.pattern);
        if (!regex.test(value)) {
          return {
            fieldId: field.id,
            valid: false,
            error: `${field.label} tiene un formato inválido`,
          };
        }
      }
    }
    
    // Number validations
    if (typeof value === "number") {
      if (validation.min !== undefined && value < validation.min) {
        return {
          fieldId: field.id,
          valid: false,
          error: `${field.label} debe ser al menos ${validation.min}`,
        };
      }
      
      if (validation.max !== undefined && value > validation.max) {
        return {
          fieldId: field.id,
          valid: false,
          error: `${field.label} no puede ser más de ${validation.max}`,
        };
      }
    }
    
    // Custom validation
    if (validation.custom) {
      const customResult = validation.custom(value);
      if (customResult !== true) {
        return {
          fieldId: field.id,
          valid: false,
          error: typeof customResult === "string" ? customResult : `${field.label} es inválido`,
        };
      }
    }
  }
  
  // Special validations for specific field types
  if (field.type === "cuit" && typeof value === "string") {
    if (!isValidCUIT(value)) {
      return {
        fieldId: field.id,
        valid: false,
        error: `${field.label} no es un CUIT válido`,
      };
    }
  }
  
  if (field.type === "date" && typeof value === "string") {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return {
        fieldId: field.id,
        valid: false,
        error: `${field.label} no es una fecha válida`,
      };
    }
  }
  
  return { fieldId: field.id, valid: true };
}

/**
 * Validate all fields in a section
 * 
 * @param fields - Array of field configurations
 * @param data - Form data
 * @returns Array of validation results
 */
export function validateFields(
  fields: DocumentFieldConfig[],
  data: StructuredDocumentData
): FieldValidationResult[] {
  return fields.map(field => {
    const value = data[field.id];
    return validateField(field, value, data);
  });
}

/**
 * Run semantic validations
 * 
 * @param rules - Array of semantic validation rules
 * @param data - Form data
 * @returns Array of validation results
 */
export function validateSemantic(
  rules: SemanticValidationRule[],
  data: StructuredDocumentData
): SemanticValidationResult[] {
  return rules.map(rule => {
    const result = rule.check(data);
    
    if (result === true) {
      return {
        ruleId: rule.id,
        valid: true,
        severity: rule.severity,
      };
    }
    
    return {
      ruleId: rule.id,
      valid: false,
      error: typeof result === "string" ? result : rule.description,
      severity: rule.severity,
    };
  });
}

/**
 * Check warning rules
 * 
 * @param rules - Array of warning rules
 * @param data - Form data
 * @returns Array of warnings
 */
export function checkWarnings(
  rules: WarningRule[],
  data: StructuredDocumentData
): GenerationWarning[] {
  return rules
    .filter(rule => rule.check(data))
    .map(rule => ({
      id: `warning-${rule.id}-${Date.now()}`,
      ruleId: rule.id,
      message: rule.message,
      suggestion: rule.suggestion,
      severity: "warning" as const,
    }));
}

/**
 * Validate CUIT format (Argentine tax ID)
 * Basic validation - checks format, not actual validity
 * 
 * @param cuit - CUIT string (format: XX-XXXXXXXX-X)
 * @returns True if format is valid
 */
function isValidCUIT(cuit: string): boolean {
  // Remove dashes and spaces
  const cleaned = cuit.replace(/[-\s]/g, "");
  
  // Should be 11 digits
  if (!/^\d{11}$/.test(cleaned)) {
    return false;
  }
  
  // Basic format check: XX-XXXXXXXX-X
  const formatted = /^\d{2}-\d{8}-\d{1}$/.test(cuit);
  return formatted;
}

/**
 * Get all validation errors (blocking)
 * 
 * @param fieldResults - Field validation results
 * @param semanticResults - Semantic validation results
 * @returns Array of error messages
 */
export function getValidationErrors(
  fieldResults: FieldValidationResult[],
  semanticResults: SemanticValidationResult[]
): string[] {
  const errors: string[] = [];
  
  fieldResults.forEach(result => {
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  });
  
  semanticResults.forEach(result => {
    if (!result.valid && result.error && result.severity === "error") {
      errors.push(result.error);
    }
  });
  
  return errors;
}

/**
 * Check if form data is valid
 * 
 * @param fieldResults - Field validation results
 * @param semanticResults - Semantic validation results
 * @returns True if all validations pass
 */
export function isFormValid(
  fieldResults: FieldValidationResult[],
  semanticResults: SemanticValidationResult[]
): boolean {
  const hasFieldErrors = fieldResults.some(r => !r.valid);
  const hasSemanticErrors = semanticResults.some(r => !r.valid && r.severity === "error");
  
  return !hasFieldErrors && !hasSemanticErrors;
}

/**
 * Validate form data against a document schema
 * 
 * @param data - Form data to validate
 * @param schema - Document schema definition
 * @returns Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: Array<{ fieldId?: string; ruleId?: string; message: string }>;
}

export function validateFormData(
  data: StructuredDocumentData,
  schema: DocumentSchemaDefinition
): ValidationResult {
  const errors: Array<{ fieldId?: string; ruleId?: string; message: string }> = [];
  
  // Validate all fields
  schema.sections.forEach((section: DocumentSection) => {
    section.fields.forEach((field: DocumentFieldConfig) => {
      const result = validateField(field, data[field.id], data);
      if (!result.valid && result.error) {
        errors.push({ fieldId: field.id, message: result.error });
      }
    });
  });
  
  // Validate semantic rules
  const semanticResults = validateSemantic(schema.semanticValidations, data);
  semanticResults.forEach(result => {
    if (!result.valid && result.error && result.severity === "error") {
      errors.push({ ruleId: result.ruleId, message: result.error });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

