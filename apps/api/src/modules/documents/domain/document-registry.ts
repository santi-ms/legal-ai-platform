/**
 * Document Type Registry (Backend)
 * 
 * Backend registry for document types.
 * This mirrors the frontend registry but is used server-side.
 */

import type { DocumentTypeId } from "./document-types.js";

/**
 * Document Type Metadata
 * Lightweight metadata about document types (no full schema here)
 */
export interface DocumentTypeMetadata {
  id: DocumentTypeId;
  label: string;
  description: string;
  useCases: string[];
  noUseCases: string[];
  jurisdictionSupport: string[];
}

/**
 * Registry Map
 */
const documentTypeRegistry = new Map<DocumentTypeId, DocumentTypeMetadata>();

/**
 * Register a document type
 */
export function registerDocumentType(metadata: DocumentTypeMetadata): void {
  if (documentTypeRegistry.has(metadata.id)) {
    throw new Error(`Document type with ID "${metadata.id}" is already registered`);
  }
  
  documentTypeRegistry.set(metadata.id, metadata);
}

/**
 * Get document type metadata
 */
export function getDocumentTypeMetadata(id: DocumentTypeId): DocumentTypeMetadata | undefined {
  return documentTypeRegistry.get(id);
}

/**
 * Check if document type is registered
 */
export function isDocumentTypeRegistered(id: string): id is DocumentTypeId {
  return documentTypeRegistry.has(id as DocumentTypeId);
}

/**
 * Get all registered document types
 */
export function getAllDocumentTypes(): DocumentTypeMetadata[] {
  return Array.from(documentTypeRegistry.values());
}

/**
 * Initialize registry with known document types
 * This should be called at server startup
 */
export function initializeDocumentRegistry(): void {
  // Service Contract
  registerDocumentType({
    id: "service_contract",
    label: "Contrato de Servicios",
    description: "Contrato para la prestación de servicios profesionales o comerciales",
    useCases: [
      "Prestación de servicios profesionales",
      "Servicios comerciales",
      "Servicios de mantenimiento o soporte técnico",
    ],
    noUseCases: [
      "Venta de productos físicos",
      "Alquiler de inmuebles",
    ],
    jurisdictionSupport: [
      "caba",
      "buenos_aires",
      "cordoba",
      "santa_fe",
      "mendoza",
      "corrientes_capital",
      "posadas_misiones",
    ],
  });
  
  // NDA
  registerDocumentType({
    id: "nda",
    label: "Acuerdo de Confidencialidad (NDA)",
    description: "Acuerdo para proteger información confidencial compartida entre partes",
    useCases: [
      "Protección de información comercial sensible",
      "Protección de secretos comerciales",
    ],
    noUseCases: [
      "Contratos de servicios",
    ],
    jurisdictionSupport: [
      "caba",
      "buenos_aires",
      "cordoba",
      "santa_fe",
      "mendoza",
      "corrientes_capital",
      "posadas_misiones",
    ],
  });
  
  // Legal Notice
  registerDocumentType({
    id: "legal_notice",
    label: "Carta Documento",
    description: "Notificación formal con carácter de documento público",
    useCases: [
      "Intimación de pago",
      "Notificación de incumplimiento contractual",
      "Requerimiento de cumplimiento",
    ],
    noUseCases: [
      "Contratos",
      "Acuerdos de confidencialidad",
    ],
    jurisdictionSupport: [
      "caba",
      "buenos_aires",
      "cordoba",
      "santa_fe",
      "mendoza",
      "corrientes_capital",
      "posadas_misiones",
    ],
  });
  
  // Supply Contract (placeholder - to be implemented)
  registerDocumentType({
    id: "supply_contract",
    label: "Contrato de Suministro",
    description: "Contrato para la venta y suministro de productos",
    useCases: [],
    noUseCases: [],
    jurisdictionSupport: [
      "caba",
      "buenos_aires",
      "cordoba",
      "santa_fe",
      "mendoza",
      "corrientes_capital",
      "posadas_misiones",
    ],
  });
  
  // Lease (placeholder - to be implemented)
  registerDocumentType({
    id: "lease",
    label: "Contrato de Locación",
    description: "Contrato de alquiler de inmuebles",
    useCases: [],
    noUseCases: [],
    jurisdictionSupport: [
      "caba",
      "buenos_aires",
      "cordoba",
      "santa_fe",
      "mendoza",
      "corrientes_capital",
      "posadas_misiones",
    ],
  });
}

