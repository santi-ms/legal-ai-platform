/**
 * Document Mapper
 * 
 * Maps between old format (GenerateDocumentInput) and new structured format.
 * Provides backward compatibility during migration.
 */

import type { GenerateDocumentInput } from "../../../types.js";
import type {
  DocumentTypeId,
  StructuredDocumentData,
} from "../domain/document-types.js";
import { validateGenerateDocumentRequest } from "../dto/generate-document.dto.js";

/**
 * Map old format to new structured format
 * 
 * @param oldData - Old format data
 * @returns New structured data
 */
export function mapOldFormatToStructured(
  oldData: GenerateDocumentInput
): {
  documentType: DocumentTypeId;
  jurisdiction: string;
  tone: string;
  structuredData: StructuredDocumentData;
} {
  // Map old type values to new type IDs
  const typeMap: Record<string, DocumentTypeId> = {
    contrato_servicios: "service_contract",
    contrato_suministro: "supply_contract",
    nda: "nda",
    carta_documento: "legal_notice",
    contrato_locacion: "lease",
  };
  
  // Map old tone values to new tone IDs
  const toneMap: Record<string, string> = {
    formal: "formal_technical",
    comercial_claro: "commercial_clear",
  };
  
  const documentType = typeMap[oldData.type] || "service_contract";
  const tone = toneMap[oldData.tono] || "commercial_clear";
  
  // Build structured data from old format
  const structuredData: StructuredDocumentData = {
    // Legal config
    jurisdiccion: oldData.jurisdiccion,
    tono: tone,
    
    // Parties (service contract format)
    proveedor_nombre: oldData.proveedor_nombre,
    proveedor_doc: oldData.proveedor_doc,
    proveedor_domicilio: oldData.proveedor_domicilio,
    cliente_nombre: oldData.cliente_nombre,
    cliente_doc: oldData.cliente_doc,
    cliente_domicilio: oldData.cliente_domicilio,
    
    // Service definition
    descripcion_servicio: oldData.descripcion_servicio,
    
    // Commercial terms
    monto: oldData.monto_mensual,
    moneda: "ARS", // Default, old format didn't have this
    periodicidad: "mensual", // Default
    forma_pago: oldData.forma_pago,
    plazo_pago: "30_dias", // Default
    preferencias_fiscales: oldData.preferencias_fiscales,
    
    // Term
    inicio_vigencia: oldData.inicio_vigencia,
    plazo_minimo_meses: oldData.plazo_minimo_meses,
    
    // Termination
    penalizacion_rescision: oldData.penalizacion_rescision,
    penalizacion_monto: oldData.penalizacion_monto,
  };
  
  return {
    documentType,
    jurisdiction: oldData.jurisdiccion,
    tone,
    structuredData,
  };
}

/**
 * Try to use new DTO format, fallback to old format mapping
 * 
 * @param body - Request body
 * @returns Mapped data or error
 */
export async function normalizeDocumentRequest(body: unknown): Promise<{
  success: true;
  documentType: DocumentTypeId;
  jurisdiction: string;
  tone: string;
  structuredData: StructuredDocumentData;
} | {
  success: false;
  error: string;
}> {
  // Try new DTO format first
  const dtoResult = validateGenerateDocumentRequest(body);
  if (dtoResult.success) {
    return {
      success: true,
      documentType: dtoResult.data.documentType,
      jurisdiction: dtoResult.data.jurisdiction,
      tone: dtoResult.data.tone,
      structuredData: dtoResult.data as StructuredDocumentData,
    };
  }
  
  // Fallback to old format
  try {
    // Dynamic import for ESM compatibility
    const typesModule = await import("../../../types.js");
    const { GenerateDocumentSchema } = typesModule;
    const oldParsed = GenerateDocumentSchema.safeParse(body);
    
    if (oldParsed.success) {
      const mapped = mapOldFormatToStructured(oldParsed.data);
      return {
        success: true,
        ...mapped,
      };
    }
    
    return {
      success: false,
      error: "Invalid request format",
    };
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to parse request: ${error?.message || String(error)}`,
    };
  }
}

