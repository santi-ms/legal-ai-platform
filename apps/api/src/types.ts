import { z } from "zod";

export const GenerateDocumentSchema = z.object({
  // Datos generales del documento
  type: z.string().min(1),            // ej: "contrato_servicios" o "Contrato de Servicios"
  jurisdiccion: z.string().min(1),    // ej: "corrientes_capital" o "Posadas, Misiones"
  tono: z.string().min(1),            // ej: "formal" o "comercial_claro"

  // Parte proveedora
  proveedor_nombre: z.string().min(1),
  proveedor_doc: z.string().min(1),
  proveedor_domicilio: z.string().min(1),

  // Parte cliente
  cliente_nombre: z.string().min(1),
  cliente_doc: z.string().min(1),
  cliente_domicilio: z.string().min(1),

  // Condiciones comerciales
  descripcion_servicio: z.string().min(1),
  monto_mensual: z.string().min(1),
  forma_pago: z.string().min(1),
  inicio_vigencia: z.string().min(1), // ej "2025-11-01"

  plazo_minimo_meses: z.number().int().positive(),
  penalizacion_rescision: z.boolean(),
  penalizacion_monto: z.string().optional(),

  // Fiscal / facturación
  preferencias_fiscales: z.string().min(1), // ej "Monotributo", "Responsable Inscripto", etc.
});

export type GenerateDocumentInput = z.infer<typeof GenerateDocumentSchema>;
