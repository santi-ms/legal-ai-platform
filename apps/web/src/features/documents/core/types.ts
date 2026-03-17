/**
 * Core Types for Document Domain
 * 
 * This module defines the foundational types for the document generation system.
 * All document types, schemas, and validation rules are built on top of these types.
 */

/**
 * Document Type Identifiers
 * Each document type has a unique identifier used throughout the system.
 */
export type DocumentTypeId =
  | "service_contract"
  | "supply_contract"
  | "nda"
  | "legal_notice"
  | "lease"
  | "debt_recognition"
  | "simple_authorization";

/**
 * Document Tone Options
 * Controls the language style and formality of the generated document.
 */
export type DocumentTone =
  | "formal_technical"      // Formal y técnico legal
  | "commercial_clear"       // Comercial y claro
  | "balanced_professional"; // Balanceado profesional

/**
 * Supported Jurisdictions in Argentina
 */
export type JurisdictionId =
  | "caba"
  | "buenos_aires"
  | "cordoba"
  | "santa_fe"
  | "mendoza"
  | "corrientes_capital"
  | "posadas_misiones";

/**
 * Field Types for Dynamic Forms
 */
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "switch"
  | "cuit"
  | "address"
  | "email"
  | "phone";

/**
 * Field Configuration
 * Defines how a field should be rendered and validated in the form.
 */
export interface DocumentFieldConfig {
  id: string;
  label: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  options?: { value: string; label: string }[];
  visibleWhen?: string[]; // Array of field IDs that must be truthy for this field to be visible
  validation?: FieldValidation;
  defaultValue?: unknown;
  rows?: number;
}

/**
 * Field Validation Rules
 */
export interface FieldValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string; // Regex pattern
  min?: number;
  max?: number;
  custom?: (value: unknown) => boolean | string; // Returns true if valid, or error message string
}

/**
 * Document Section
 * Groups related fields together in the form.
 */
export interface DocumentSection {
  id: string;
  title: string;
  description?: string;
  fields: DocumentFieldConfig[];
  order: number;
}

/**
 * Semantic Validation Rule
 * Business logic validation that checks relationships between fields.
 */
export interface SemanticValidationRule {
  id: string;
  name: string;
  description: string;
  check: (data: Record<string, unknown>) => boolean | string; // Returns true if valid, or error message
  severity: "error" | "warning";
}

/**
 * Warning Rule
 * Non-blocking alerts that suggest improvements or highlight missing information.
 */
export interface WarningRule {
  id: string;
  name: string;
  description: string;
  check: (data: Record<string, unknown>) => boolean; // Returns true if warning should be shown
  message: string;
  suggestion?: string; // Optional suggestion for fixing the issue
}

/**
 * Required Clause Reference
 * Identifies clauses that must be included in the document.
 */
export interface RequiredClause {
  id: string;
  name: string;
  description: string;
  category: "common" | "type_specific";
}

/**
 * Optional Clause Reference
 * Clauses that can be included based on user choices or conditions.
 */
export interface OptionalClause {
  id: string;
  name: string;
  description: string;
  condition?: (data: Record<string, unknown>) => boolean; // When to include this clause
  category: "common" | "type_specific";
}

/**
 * Prompt Configuration
 * Controls how the AI prompt is constructed for this document type.
 */
export interface PromptConfig {
  systemMessage: string;
  baseInstructions: string[];
  toneInstructions: Record<DocumentTone, string>;
  requiredClausesInstructions: string[];
  formatInstructions: string;
}

/**
 * Template Configuration
 * Controls template-based generation (before AI enhancement).
 */
export interface TemplateConfig {
  templateId: string;
  version: string;
  variablePlaceholders: string[]; // e.g., "{{PARTIES}}", "{{OBJECT}}"
  clauseSlots: string[]; // Where clauses should be inserted
}

/**
 * Document Schema Definition
 * Complete definition of a document type including all its configuration.
 */
export interface DocumentSchemaDefinition {
  id: DocumentTypeId;
  label: string;
  description: string;
  useCases: string[];
  noUseCases: string[]; // When NOT to use this document type
  jurisdictionSupport: JurisdictionId[];
  
  sections: DocumentSection[];
  semanticValidations: SemanticValidationRule[];
  warningRules: WarningRule[];
  
  requiredClauses: RequiredClause[];
  optionalClauses: OptionalClause[];
  
  promptConfig: PromptConfig;
  templateConfig: TemplateConfig;
}

/**
 * Structured Document Data
 * The structured representation of user input for a document.
 */
export type StructuredDocumentData = Record<string, unknown>;

/**
 * Clause Plan
 * Defines which clauses will be included and in what order.
 */
export interface ClausePlan {
  required: string[]; // Clause IDs
  optional: string[]; // Clause IDs
  order: string[]; // Final order of clause IDs
  metadata: Record<string, unknown>; // Additional metadata for clause assembly
}

/**
 * Generation Warnings
 * Warnings generated during document creation.
 */
export interface GenerationWarning {
  id: string;
  ruleId: string;
  message: string;
  suggestion?: string;
  severity: "info" | "warning" | "error";
}

/**
 * Document Generation Result
 * Complete result of the document generation process.
 */
export interface DocumentGenerationResult {
  structuredData: StructuredDocumentData;
  clausePlan: ClausePlan;
  baseDraft: string; // Template-based draft
  aiEnhancedDraft: string; // Final AI-enhanced text
  warnings: GenerationWarning[];
  metadata: {
    documentType: DocumentTypeId;
    templateVersion: string;
    generationTimestamp: string;
    aiModel?: string;
    aiTokens?: {
      prompt: number;
      completion: number;
    };
  };
}

/**
 * Document Status
 * Lifecycle status of a document.
 */
export type DocumentStatus =
  | "draft"           // Being created
  | "generated"       // Generated but not reviewed
  | "reviewed"        // User has reviewed
  | "final";          // Final version

/**
 * Extended Document Version (for database)
 * Extends the base DocumentVersion with structured data.
 */
export interface ExtendedDocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  rawText: string;
  structuredData?: StructuredDocumentData | null;
  clausePlan?: ClausePlan | null;
  generationWarnings?: GenerationWarning[] | null;
  templateVersion?: string | null;
  status?: DocumentStatus;
  pdfUrl?: string | null;
  hashSha256?: string | null;
  generatedBy?: string;
  createdAt: Date;
}

