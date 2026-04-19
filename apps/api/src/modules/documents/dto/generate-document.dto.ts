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
} from "../domain/document-types.js";

/**
 * Base DTO Schema
 * Common fields for all document types
 */
const BaseDocumentDTOSchema = z.object({
  documentType: z.enum([
    "service_contract",
    "nda",
    "legal_notice",
    "lease",
    "debt_recognition",
    "simple_authorization",
    "supply_contract", // kept for legacy compatibility — not implemented, returns 400 on generation
  ]),
  jurisdiction: z.preprocess(
    // Normalizar alias comunes que la IA puede extraer del texto del usuario
    (val) => {
      const aliases: Record<string, string> = {
        misiones: "posadas_misiones",
        corrientes: "corrientes_capital",
        posadas: "posadas_misiones",
        // Alias de otras provincias → redirigir a Corrientes por defecto
        caba: "corrientes_capital",
        buenos_aires: "corrientes_capital",
        buenos_aires_provincia: "corrientes_capital",
        pba: "corrientes_capital",
        cordoba: "corrientes_capital",
        cba: "corrientes_capital",
        santa_fe: "corrientes_capital",
        mendoza: "corrientes_capital",
      };
      return typeof val === "string" && aliases[val] ? aliases[val] : val;
    },
    z.enum([
      "corrientes_capital",
      "posadas_misiones",
    ])
  ),
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
  plazo_pago: z.string().min(1).optional().default("30 días"),
  precio_incluye_impuestos: z.boolean().optional(),
  ajuste_precio: z.string().optional(),
  // Billing
  preferencias_fiscales: z.string().min(1).optional().default("Monotributo"),
  // Term
  inicio_vigencia: z.string().min(1).optional(),
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
  inicio_vigencia: z.string().min(1).optional(),
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
  cbu_remitente: z.string().optional(),
  apercibimiento: z.string().optional(),
});

/**
 * Passthrough DTO for types whose field-level validation is handled
 * by the backend validation-engine (validation-rules.ts).
 * All form fields are forwarded as structuredData.
 */
const LooseDocumentDTOSchema = BaseDocumentDTOSchema.passthrough();

export const LeaseDTOSchema = LooseDocumentDTOSchema.extend({
  documentType: z.literal("lease"),
});

export const DebtRecognitionDTOSchema = LooseDocumentDTOSchema.extend({
  documentType: z.literal("debt_recognition"),
});

export const SimpleAuthorizationDTOSchema = LooseDocumentDTOSchema.extend({
  documentType: z.literal("simple_authorization"),
});

// supply_contract is kept for legacy compatibility.
export const SupplyContractDTOSchema = LooseDocumentDTOSchema.extend({
  documentType: z.literal("supply_contract"),
});

/**
 * Free-form DTO: accepts any document type string not in the known list.
 * Used for "tipo libre" generation — Claude generates the full document from scratch.
 * Requires at minimum: documentType (any string), jurisdiction, tone.
 * All other fields are passed through as-is to the generation engine.
 */
export const FreeFormDocumentDTOSchema = z.object({
  documentType: z.string().min(1).max(100),
  jurisdiction: z.preprocess(
    (val) => {
      const aliases: Record<string, string> = {
        misiones: "posadas_misiones",
        corrientes: "corrientes_capital",
        posadas: "posadas_misiones",
        caba: "corrientes_capital",
        buenos_aires: "corrientes_capital",
        buenos_aires_provincia: "corrientes_capital",
        pba: "corrientes_capital",
        cordoba: "corrientes_capital",
        cba: "corrientes_capital",
        santa_fe: "corrientes_capital",
        mendoza: "corrientes_capital",
      };
      return typeof val === "string" && aliases[val] ? aliases[val] : val;
    },
    z.enum([
      "corrientes_capital",
      "posadas_misiones",
    ]).default("corrientes_capital")
  ),
  tone: z.enum([
    "formal_technical",
    "commercial_clear",
    "balanced_professional",
  ]).default("commercial_clear"),
}).passthrough(); // Accept any additional fields

/**
 * Union of all DTO schemas (known types)
 */
export const GenerateDocumentDTOSchema = z.discriminatedUnion("documentType", [
  ServiceContractDTOSchema,
  NDADTOSchema,
  LegalNoticeDTOSchema,
  LeaseDTOSchema,
  DebtRecognitionDTOSchema,
  SimpleAuthorizationDTOSchema,
  SupplyContractDTOSchema,
]);

/**
 * Generate Document DTO Type
 */
export type GenerateDocumentDTO =
  | z.infer<typeof GenerateDocumentDTOSchema>
  | z.infer<typeof FreeFormDocumentDTOSchema>;

/**
 * Validate generate document request.
 * 1. Try the known-type discriminated union first (strict validation per type).
 * 2. Fall back to free-form schema (any documentType string, passthrough fields).
 */
export function validateGenerateDocumentRequest(
  data: unknown
): { success: true; data: GenerateDocumentDTO } | { success: false; error: z.ZodError } {
  // Try known types first
  const result = GenerateDocumentDTOSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  // Fall back to free-form for any other document type
  const freeResult = FreeFormDocumentDTOSchema.safeParse(data);
  if (freeResult.success) {
    return { success: true, data: freeResult.data };
  }

  // Both failed — return the original union error (more informative)
  return { success: false, error: result.error };
}

