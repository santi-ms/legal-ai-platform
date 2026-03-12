/**
 * Generate Document DTO
 * 
 * Data Transfer Objects for document generation requests.
 */

import { z } from "zod";
import type {
  DocumentTypeId,
  DocumentTone,
  JurisdictionId,
  StructuredDocumentData,
} from "../domain/document-types";

/**
 * Base DTO Schema
 * Common fields for all document types
 */
const BaseDocumentDTOSchema = z.object({
  documentType: z.enum([
    "service_contract",
    "supply_contract",
    "nda",
    "legal_notice",
    "lease",
  ]),
  jurisdiction: z.enum([
    "caba",
    "buenos_aires",
    "cordoba",
    "santa_fe",
    "mendoza",
    "corrientes_capital",
    "posadas_misiones",
  ]),
  tone: z.enum([
    "formal_technical",
    "commercial_clear",
    "balanced_professional",
  ]),
});

/**
 * Service Contract DTO Schema
 */
export const ServiceContractDTOSchema = BaseDocumentDTOSchema.extend({
  documentType: z.literal("service_contract"),
  // Parties
  proveedor_nombre: z.string().min(1),
  proveedor_doc: z.string().min(1),
  proveedor_domicilio: z.string().min(1),
  cliente_nombre: z.string().min(1),
  cliente_doc: z.string().min(1),
  cliente_domicilio: z.string().min(1),
  // Service definition
  descripcion_servicio: z.string().min(1),
  alcance: z.string().optional(),
  entregables: z.string().optional(),
  // Commercial terms
  monto: z.string().min(1),
  moneda: z.enum(["ARS", "USD"]),
  periodicidad: z.enum(["mensual", "bimestral", "trimestral", "semestral", "anual", "unico"]),
  forma_pago: z.string().min(1),
  plazo_pago: z.string().min(1),
  precio_incluye_impuestos: z.boolean().optional(),
  ajuste_precio: z.string().optional(),
  // Billing
  preferencias_fiscales: z.string().min(1),
  // Term
  inicio_vigencia: z.string().min(1),
  plazo_minimo_meses: z.number().int().positive(),
  renovacion_automatica: z.boolean().optional(),
  preaviso_renovacion: z.number().optional(),
  // Termination
  penalizacion_rescision: z.boolean().optional(),
  penalizacion_monto: z.string().optional(),
  preaviso_rescision: z.number().optional(),
  // Intellectual property
  propiedad_intelectual: z.boolean().optional(),
  tipo_propiedad_intelectual: z.string().optional(),
  // Confidentiality
  confidencialidad: z.boolean().optional(),
  plazo_confidencialidad: z.number().optional(),
  // Notifications
  domicilio_notificaciones: z.string().optional(),
  domicilio_especial: z.string().optional(),
});

/**
 * NDA DTO Schema
 */
export const NDADTOSchema = BaseDocumentDTOSchema.extend({
  documentType: z.literal("nda"),
  // Parties
  revelador_nombre: z.string().min(1),
  revelador_doc: z.string().min(1),
  revelador_domicilio: z.string().min(1),
  receptor_nombre: z.string().min(1),
  receptor_doc: z.string().min(1),
  receptor_domicilio: z.string().min(1),
  // Confidential information
  definicion_informacion: z.string().min(1),
  finalidad_permitida: z.string().min(1),
  exclusiones: z.string().optional(),
  // Term
  plazo_confidencialidad: z.number().int().positive(),
  inicio_vigencia: z.string().min(1),
  // Obligations
  devolucion_destruccion: z.boolean().optional(),
  plazo_devolucion: z.number().optional(),
  // Breach
  penalidad_incumplimiento: z.string().optional(),
});

/**
 * Legal Notice DTO Schema
 */
export const LegalNoticeDTOSchema = BaseDocumentDTOSchema.extend({
  documentType: z.literal("legal_notice"),
  // Parties
  remitente_nombre: z.string().min(1),
  remitente_doc: z.string().min(1),
  remitente_domicilio: z.string().min(1),
  destinatario_nombre: z.string().min(1),
  destinatario_doc: z.string().min(1),
  destinatario_domicilio: z.string().min(1),
  // Context
  relacion_previa: z.string().min(1),
  // Facts
  hechos: z.string().min(1),
  incumplimiento: z.string().min(1),
  // Demand
  intimacion: z.string().min(1),
  plazo_cumplimiento: z.string().min(1),
  plazo_custom: z.string().optional(),
  apercibimiento: z.string().optional(),
});

/**
 * Union of all DTO schemas
 */
export const GenerateDocumentDTOSchema = z.discriminatedUnion("documentType", [
  ServiceContractDTOSchema,
  NDADTOSchema,
  LegalNoticeDTOSchema,
]);

/**
 * Generate Document DTO Type
 */
export type GenerateDocumentDTO = z.infer<typeof GenerateDocumentDTOSchema>;

/**
 * Validate generate document request
 * 
 * @param data - Request data
 * @returns Validation result
 */
export function validateGenerateDocumentRequest(
  data: unknown
): { success: true; data: GenerateDocumentDTO } | { success: false; error: z.ZodError } {
  const result = GenerateDocumentDTOSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return { success: false, error: result.error };
}

