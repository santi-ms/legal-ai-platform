/**
 * Document Schemas Index
 * 
 * Central export point for all document schemas.
 * Importing this file will register all schemas in the registry.
 */

// Import schemas to register them
import "./service-contract";
import "./nda";
import "./legal-notice";

// Export registry functions
export {
  getDocumentSchema,
  getAllDocumentSchemas,
  getDocumentTypeIds,
  isDocumentTypeRegistered,
  getRegistryStats,
} from "../core/registry";

// Export types
export type {
  DocumentTypeId,
  DocumentTone,
  JurisdictionId,
  DocumentSchemaDefinition,
  StructuredDocumentData,
  ClausePlan,
  GenerationWarning,
  DocumentGenerationResult,
} from "../core/types";

// Export validation functions
export {
  validateField,
  validateFields,
  validateSemantic,
  checkWarnings,
  getValidationErrors,
  isFormValid,
} from "../core/validation";

// Export warning functions
export {
  checkAllWarnings,
  groupWarningsByCategory,
  filterWarningsBySeverity,
  getWarningSummary,
} from "../core/warnings";

