/**
 * Document Domain Types (Backend)
 * 
 * Shared types between frontend and backend for document generation.
 * These types mirror the frontend types but are backend-specific.
 */

/**
 * Document Type Identifiers
 */
/**
 * Canonical document type identifiers — source of truth for all backend modules.
 *
 * Template-backed types (have template + clauses + AI prompt):
 *   service_contract | nda | legal_notice | lease | debt_recognition | simple_authorization
 *
 * Free-form types: any other string is accepted and handled by the generic AI
 *   generation path (no template required — Claude generates the full document).
 *
 * Legacy / deprecated:
 *   supply_contract — kept for backward compatibility with existing DB records.
 */
export type KnownDocumentTypeId =
  | "service_contract"
  | "nda"
  | "legal_notice"
  | "lease"
  | "debt_recognition"
  | "simple_authorization"
  | "supply_contract"; // @deprecated

/** Accepts all known types AND any free-form string (e.g. "comodato", "poder_especial") */
export type DocumentTypeId = KnownDocumentTypeId | string;

/** List of types that have a full template + clause system */
export const TEMPLATED_DOCUMENT_TYPES: KnownDocumentTypeId[] = [
  "service_contract",
  "nda",
  "legal_notice",
  "lease",
  "debt_recognition",
  "simple_authorization",
];

/** Returns true if the given type has a template + clause pipeline */
export function isTemplatedDocumentType(type: string): type is KnownDocumentTypeId {
  return TEMPLATED_DOCUMENT_TYPES.includes(type as KnownDocumentTypeId);
}

/**
 * Document Tone Options
 */
export type DocumentTone =
  | "formal_technical"
  | "commercial_clear"
  | "balanced_professional";

/**
 * Supported Jurisdictions
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
 * Generation Warning
 */
export interface GenerationWarning {
  id: string;
  ruleId: string;
  message: string;
  suggestion?: string;
  severity: "info" | "warning" | "error";
}

/**
 * Document Status
 */
export type DocumentStatus =
  | "draft"
  | "generated"
  | "reviewed"
  | "final";

/**
 * Document Generation Metadata
 */
export interface GenerationMetadata {
  documentType: string;
  templateVersion: string;
  generationTimestamp: string;
  aiModel?: string;
  aiTokens?: {
    prompt: number;
    completion: number;
  };
}

/**
 * Document Generation Result
 */
export interface DocumentGenerationResult {
  structuredData: StructuredDocumentData;
  clausePlan: ClausePlan;
  baseDraft: string; // Template-based draft
  aiEnhancedDraft: string; // Final AI-enhanced text
  warnings: GenerationWarning[];
  metadata: GenerationMetadata;
}

