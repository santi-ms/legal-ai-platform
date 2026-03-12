/**
 * Document Type Registry
 * 
 * Central registry for all document types in the system.
 * This is the single source of truth for document type definitions.
 */

import type {
  DocumentTypeId,
  DocumentSchemaDefinition,
} from "./types";

/**
 * Registry Map
 * Stores all registered document schemas by their ID.
 */
const documentRegistry = new Map<DocumentTypeId, DocumentSchemaDefinition>();

/**
 * Register a document schema
 * 
 * @param schema - The complete document schema definition
 * @throws Error if schema ID is already registered
 */
export function registerDocumentSchema(schema: DocumentSchemaDefinition): void {
  if (documentRegistry.has(schema.id)) {
    throw new Error(`Document schema with ID "${schema.id}" is already registered`);
  }
  
  // Validate schema structure
  validateSchema(schema);
  
  documentRegistry.set(schema.id, schema);
}

/**
 * Get a document schema by ID
 * 
 * @param id - Document type ID
 * @returns The schema definition or undefined if not found
 */
export function getDocumentSchema(id: DocumentTypeId): DocumentSchemaDefinition | undefined {
  return documentRegistry.get(id);
}

/**
 * Get all registered document schemas
 * 
 * @returns Array of all registered schemas
 */
export function getAllDocumentSchemas(): DocumentSchemaDefinition[] {
  return Array.from(documentRegistry.values());
}

/**
 * Get all document type IDs
 * 
 * @returns Array of all registered document type IDs
 */
export function getDocumentTypeIds(): DocumentTypeId[] {
  return Array.from(documentRegistry.keys());
}

/**
 * Check if a document type is registered
 * 
 * @param id - Document type ID
 * @returns True if registered, false otherwise
 */
export function isDocumentTypeRegistered(id: string): id is DocumentTypeId {
  return documentRegistry.has(id as DocumentTypeId);
}

/**
 * Validate schema structure
 * 
 * @param schema - Schema to validate
 * @throws Error if schema is invalid
 */
function validateSchema(schema: DocumentSchemaDefinition): void {
  // Required fields
  if (!schema.id) {
    throw new Error("Schema must have an id");
  }
  
  if (!schema.label) {
    throw new Error("Schema must have a label");
  }
  
  if (!schema.sections || schema.sections.length === 0) {
    throw new Error("Schema must have at least one section");
  }
  
  // Validate sections
  schema.sections.forEach((section, index) => {
    if (!section.id) {
      throw new Error(`Section at index ${index} must have an id`);
    }
    
    if (!section.title) {
      throw new Error(`Section "${section.id}" must have a title`);
    }
    
    if (!section.fields || section.fields.length === 0) {
      throw new Error(`Section "${section.id}" must have at least one field`);
    }
    
    // Validate fields
    section.fields.forEach((field, fieldIndex) => {
      if (!field.id) {
        throw new Error(`Field at index ${fieldIndex} in section "${section.id}" must have an id`);
      }
      
      if (!field.label) {
        throw new Error(`Field "${field.id}" must have a label`);
      }
      
      if (!field.type) {
        throw new Error(`Field "${field.id}" must have a type`);
      }
    });
  });
  
  // Validate prompt config
  if (!schema.promptConfig) {
    throw new Error("Schema must have a promptConfig");
  }
  
  if (!schema.promptConfig.systemMessage) {
    throw new Error("Schema promptConfig must have a systemMessage");
  }
  
  // Validate template config
  if (!schema.templateConfig) {
    throw new Error("Schema must have a templateConfig");
  }
  
  if (!schema.templateConfig.templateId) {
    throw new Error("Schema templateConfig must have a templateId");
  }
}

/**
 * Clear registry (useful for testing)
 */
export function clearRegistry(): void {
  documentRegistry.clear();
}

/**
 * Get registry statistics
 * 
 * @returns Object with registry statistics
 */
export function getRegistryStats() {
  const schemas = getAllDocumentSchemas();
  
  return {
    totalTypes: schemas.length,
    totalSections: schemas.reduce((sum, s) => sum + s.sections.length, 0),
    totalFields: schemas.reduce((sum, s) => 
      sum + s.sections.reduce((sectionSum, section) => sectionSum + section.fields.length, 0), 
      0
    ),
    totalValidations: schemas.reduce((sum, s) => sum + s.semanticValidations.length, 0),
    totalWarnings: schemas.reduce((sum, s) => sum + s.warningRules.length, 0),
  };
}

