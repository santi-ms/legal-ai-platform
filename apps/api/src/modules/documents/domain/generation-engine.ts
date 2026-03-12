/**
 * Document Generation Engine
 * 
 * Hybrid generation system: templates + clauses + AI enhancement.
 * This engine assembles documents from templates and clauses, then
 * uses AI to enhance coherence, tone, and consistency.
 */

import type {
  DocumentTypeId,
  StructuredDocumentData,
  ClausePlan,
  DocumentGenerationResult,
  GenerationWarning,
  GenerationMetadata,
} from "./document-types.js";

/**
 * Template Base
 * Base template structure for a document type
 */
export interface TemplateBase {
  id: string;
  version: string;
  content: string; // Template with placeholders like {{PARTIES}}, {{OBJECT}}, etc.
  variablePlaceholders: string[];
  clauseSlots: string[];
}

/**
 * Clause Definition
 * A reusable clause that can be inserted into documents
 */
export interface ClauseDefinition {
  id: string;
  name: string;
  content: string; // Clause template with placeholders
  category: "common" | "type_specific";
  required: boolean;
  condition?: (data: StructuredDocumentData) => boolean;
}

/**
 * Generate clause plan from structured data
 * 
 * @param documentType - Document type ID
 * @param data - Structured document data
 * @param requiredClauseIds - Required clause IDs for this document type
 * @param optionalClauseIds - Optional clause IDs with conditions
 * @returns Clause plan
 */
export function generateClausePlan(
  documentType: DocumentTypeId,
  data: StructuredDocumentData,
  requiredClauseIds: string[],
  optionalClauseIds: Array<{ id: string; condition?: (data: StructuredDocumentData) => boolean }>
): ClausePlan {
  const required: string[] = [...requiredClauseIds];
  const optional: string[] = [];
  
  // Check optional clauses
  optionalClauseIds.forEach(clause => {
    if (!clause.condition || clause.condition(data)) {
      optional.push(clause.id);
    }
  });
  
  // Determine order (required first, then optional)
  const order = [...required, ...optional];
  
  return {
    required,
    optional,
    order,
    metadata: {
      documentType,
      totalClauses: order.length,
      requiredCount: required.length,
      optionalCount: optional.length,
    },
  };
}

/**
 * Assemble base draft from template and clauses
 * 
 * @param template - Template base
 * @param clauses - Map of clause ID to clause content
 * @param clausePlan - Clause plan
 * @param data - Structured document data
 * @returns Base draft text
 */
export function assembleBaseDraft(
  template: TemplateBase,
  clauses: Map<string, ClauseDefinition>,
  clausePlan: ClausePlan,
  data: StructuredDocumentData
): string {
  let draft = template.content;
  
  // First, replace variable placeholders in template
  template.variablePlaceholders.forEach(placeholder => {
    const value = getPlaceholderValue(placeholder, data);
    // Replace placeholder, removing empty lines if value is empty
    if (value) {
      draft = draft.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
    } else {
      // Remove placeholder and any trailing newlines/whitespace
      draft = draft.replace(new RegExp(`\\s*${placeholder.replace(/[{}]/g, "\\$&")}\\s*`, "g"), "");
    }
  });
  
  // Track clause numbers for numbering
  let clauseNumber = 1;
  const clauseNumberMap = new Map<string, number>();
  
  // Insert clauses in order
  clausePlan.order.forEach((clauseId: string) => {
    const clause = clauses.get(clauseId);
    if (clause) {
      let clauseContent = clause.content;
      
      // Assign clause number
      clauseNumberMap.set(clauseId, clauseNumber);
      
      // Replace clause number placeholder
      clauseContent = clauseContent.replace(/\{\{CLAUSE_NUMBER\}\}/g, getClauseNumberText(clauseNumber));
      
      // Replace all placeholders in clause
      const allPlaceholders = [
        ...template.variablePlaceholders,
        "{{CLAUSE_NUMBER}}",
      ];
      
      allPlaceholders.forEach(placeholder => {
        const value = getPlaceholderValue(placeholder, data);
        if (value) {
          clauseContent = clauseContent.replace(new RegExp(placeholder.replace(/[{}]/g, "\\$&"), "g"), value);
        } else {
          // Remove empty placeholders and clean up extra whitespace
          clauseContent = clauseContent.replace(new RegExp(`\\s*${placeholder.replace(/[{}]/g, "\\$&")}\\s*`, "g"), "");
        }
      });
      
      // Clean up multiple consecutive newlines
      clauseContent = clauseContent.replace(/\n{3,}/g, "\n\n");
      
      // Find clause slot and replace
      // Try multiple slot formats
      const slotFormats = [
        `{{CLAUSE_${clauseId.toUpperCase()}}}`,
        `{{${clauseId.toUpperCase()}}}`,
        // Map clause IDs to template slot names
        clauseId === "identificacion_partes" ? "{{CLAUSE_IDENTIFICATION}}" : null,
        clauseId === "objeto_contrato" ? "{{CLAUSE_OBJECT}}" : null,
        clauseId === "monto_pago" ? "{{CLAUSE_AMOUNT}}" : null,
        clauseId === "vigencia_plazo" ? "{{CLAUSE_TERM}}" : null,
        clauseId === "penalizacion_rescision" ? "{{CLAUSE_TERMINATION}}" : null,
        clauseId === "confidencialidad" ? "{{CLAUSE_CONFIDENTIALITY}}" : null,
        clauseId === "propiedad_intelectual" ? "{{CLAUSE_INTELLECTUAL_PROPERTY}}" : null,
        clauseId === "foro_competencia" ? "{{CLAUSE_JURISDICTION}}" : null,
        clauseId === "resolucion_disputas" ? "{{CLAUSE_DISPUTES}}" : null,
        // Map clause IDs to template slot names - NDA
        clauseId === "definicion_informacion" ? "{{CLAUSE_DEFINITION}}" : null,
        clauseId === "finalidad_permitida" ? "{{CLAUSE_PURPOSE}}" : null,
        clauseId === "obligaciones_receptor" ? "{{CLAUSE_OBLIGATIONS}}" : null,
        clauseId === "plazo_confidencialidad" ? "{{CLAUSE_TERM}}" : null,
        clauseId === "devolucion_destruccion" ? "{{CLAUSE_RETURN}}" : null,
        clauseId === "penalidad_incumplimiento" ? "{{CLAUSE_BREACH}}" : null,
        // Map clause IDs to template slot names - Legal Notice
        clauseId === "contexto_relacion" ? "{{CLAUSE_CONTEXT}}" : null,
        clauseId === "hechos" ? "{{CLAUSE_FACTS}}" : null,
        clauseId === "incumplimiento" ? "{{CLAUSE_BREACH}}" : null,
        clauseId === "intimacion" ? "{{CLAUSE_DEMAND}}" : null,
        clauseId === "plazo_cumplimiento" ? "{{CLAUSE_DEADLINE}}" : null,
        clauseId === "apercibimiento" ? "{{CLAUSE_WARNING}}" : null,
      ].filter(Boolean) as string[];
      
      let replaced = false;
      for (const slot of slotFormats) {
        if (draft.includes(slot)) {
          draft = draft.replace(slot, clauseContent);
          replaced = true;
          break;
        }
      }
      
      if (!replaced) {
        // Append clause if no slot found
        draft += `\n\n${clauseContent}`;
      }
      
      clauseNumber++;
    }
  });
  
  // Remove any remaining clause slots (empty slots)
  draft = draft.replace(/\{\{CLAUSE_[A-Z_]+\}\}/g, "");
  draft = draft.replace(/\{\{[A-Z_]+\}\}/g, "");
  
  // Clean up multiple consecutive newlines
  draft = draft.replace(/\n{3,}/g, "\n\n");
  
  // Remove empty lines at the start/end
  return draft.trim();
}

/**
 * Get clause number text (PRIMERA, SEGUNDA, etc.)
 */
function getClauseNumberText(num: number): string {
  const numbers = [
    "PRIMERA",
    "SEGUNDA",
    "TERCERA",
    "CUARTA",
    "QUINTA",
    "SEXTA",
    "SÉPTIMA",
    "OCTAVA",
    "NOVENA",
    "DÉCIMA",
  ];
  
  if (num <= numbers.length) {
    return numbers[num - 1];
  }
  
  // For numbers > 10, use ordinal
  return `CLÁUSULA ${num}ª`;
}

/**
 * Get placeholder value from data
 * 
 * @param placeholder - Placeholder like {{PARTIES}}
 * @param data - Structured document data
 * @returns Value to replace placeholder
 */
function getPlaceholderValue(placeholder: string, data: StructuredDocumentData): string {
  // Remove {{ and }}
  const key = placeholder.replace(/[{}]/g, "");
  
  // Map common placeholders to data fields
  const mapping: Record<string, string> = {
    PARTIES: formatParties(data),
    OBJECT: String(data.descripcion_servicio || data.definicion_informacion || data.hechos || ""),
    SCOPE: String(data.alcance || ""),
    DELIVERABLES: String(data.entregables || ""),
    AMOUNT: formatAmount(data),
    PERIODICIDAD: formatPeriodicidad(data),
    PAYMENT_TERMS: formatPaymentTerms(data),
    PAYMENT_DEADLINE: formatPaymentDeadline(data),
    TAX_INCLUSION: formatTaxInclusion(data),
    PRICE_ADJUSTMENT: formatPriceAdjustment(data),
    TERM: formatTerm(data),
    INICIO_VIGENCIA: String(data.inicio_vigencia || ""),
    PLAZO_MINIMO_MESES: String(data.plazo_minimo_meses || ""),
    RENEWAL_CLAUSE: formatRenewal(data),
    PREAVISO_RENOVACION: String(data.preaviso_renovacion ? `${data.preaviso_renovacion} días` : "30 días"),
    TERMINATION: formatTermination(data),
    PENALIZACION_MONTO: String(data.penalizacion_monto || ""),
    PREAVISO_RESCISION: String(data.preaviso_rescision ? `${data.preaviso_rescision} días` : "30 días"),
    CONFIDENTIALITY: formatConfidentiality(data),
    PLAZO_CONFIDENCIALIDAD: String(data.plazo_confidencialidad || ""),
    INTELLECTUAL_PROPERTY: formatIntellectualProperty(data),
    IP_TYPE_TEXT: formatIPTypeText(data),
    IP_DISPOSITION: formatIPDisposition(data),
    NOTIFICATIONS: formatNotifications(data),
    JURISDICTION: formatJurisdiction(data),
    PROVEEDOR_NOMBRE: String(data.proveedor_nombre || ""),
    CLIENTE_NOMBRE: String(data.cliente_nombre || ""),
    REVELADOR_NOMBRE: String(data.revelador_nombre || ""),
    RECEPTOR_NOMBRE: String(data.receptor_nombre || ""),
    REMITENTE_NOMBRE: String(data.remitente_nombre || ""),
    DESTINATARIO_NOMBRE: String(data.destinatario_nombre || ""),
    DEFINITION: String(data.definicion_informacion || ""),
    PURPOSE: String(data.finalidad_permitida || ""),
    EXCLUSIONS: String(data.exclusiones || ""),
    PLAZO_DEVOLUCION: String(data.plazo_devolucion ? `${data.plazo_devolucion} días` : ""),
    PENALIDAD_INCUMPLIMIENTO: String(data.penalidad_incumplimiento || ""),
    CONTEXT: String(data.relacion_previa || ""),
    FACTS: String(data.hechos || ""),
    BREACH: String(data.incumplimiento || ""),
    DEMAND: String(data.intimacion || ""),
    DEADLINE: formatDeadline(data),
    WARNING: String(data.apercibimiento || ""),
    FECHA_ACTUAL: new Date().toLocaleDateString("es-AR"),
  };
  
  return mapping[key] || "";
}

/**
 * Format parties section
 */
function formatParties(data: StructuredDocumentData): string {
  // Service contract
  if (data.proveedor_nombre && data.cliente_nombre) {
    return `PROVEEDOR: ${data.proveedor_nombre}, ${data.proveedor_doc}, con domicilio en ${data.proveedor_domicilio}\nCLIENTE: ${data.cliente_nombre}, ${data.cliente_doc}, con domicilio en ${data.cliente_domicilio}`;
  }
  
  // NDA
  if (data.revelador_nombre && data.receptor_nombre) {
    return `REVELADOR: ${data.revelador_nombre}, ${data.revelador_doc}, con domicilio en ${data.revelador_domicilio}\nRECEPTOR: ${data.receptor_nombre}, ${data.receptor_doc}, con domicilio en ${data.receptor_domicilio}`;
  }
  
  // Legal notice
  if (data.remitente_nombre && data.destinatario_nombre) {
    return `REMITENTE: ${data.remitente_nombre}, ${data.remitente_doc}, con domicilio en ${data.remitente_domicilio}\nDESTINATARIO: ${data.destinatario_nombre}, ${data.destinatario_doc}, con domicilio en ${data.destinatario_domicilio}`;
  }
  
  return "";
}

/**
 * Format amount section
 */
function formatAmount(data: StructuredDocumentData): string {
  if (data.monto && data.moneda) {
    return `${data.moneda} ${data.monto}`;
  }
  return "";
}

/**
 * Format periodicidad
 */
function formatPeriodicidad(data: StructuredDocumentData): string {
  const periodicidadMap: Record<string, string> = {
    mensual: "mensual",
    bimestral: "bimestral",
    trimestral: "trimestral",
    semestral: "semestral",
    anual: "anual",
    unico: "único",
  };
  return periodicidadMap[String(data.periodicidad)] || String(data.periodicidad || "mensual");
}

/**
 * Format payment deadline
 */
function formatPaymentDeadline(data: StructuredDocumentData): string {
  const plazoMap: Record<string, string> = {
    contado: "al contado",
    "7_dias": "7 días hábiles",
    "15_dias": "15 días hábiles",
    "30_dias": "30 días hábiles",
    "45_dias": "45 días hábiles",
    "60_dias": "60 días hábiles",
  };
  return plazoMap[String(data.plazo_pago)] || String(data.plazo_pago || "30 días hábiles");
}

/**
 * Format tax inclusion
 */
function formatTaxInclusion(data: StructuredDocumentData): string {
  if (data.precio_incluye_impuestos === true) {
    return "El precio incluye todos los impuestos aplicables.";
  } else if (data.precio_incluye_impuestos === false) {
    return "El precio no incluye impuestos. Los impuestos se agregarán según corresponda.";
  }
  return "";
}

/**
 * Format price adjustment
 */
function formatPriceAdjustment(data: StructuredDocumentData): string {
  if (!data.ajuste_precio || data.ajuste_precio === "ninguno") {
    return "";
  }
  
  const ajusteMap: Record<string, string> = {
    inflacion: "El precio se ajustará mensualmente según el índice de precios al consumidor (IPC) publicado por el INDEC.",
    dolar: "El precio se ajustará según la cotización del dólar oficial.",
    acuerdo: "El precio podrá ser ajustado por acuerdo mutuo entre las partes.",
  };
  
  return ajusteMap[String(data.ajuste_precio)] || "";
}

/**
 * Format renewal clause
 */
function formatRenewal(data: StructuredDocumentData): string {
  if (data.renovacion_automatica === true) {
    return `El presente contrato se renovará automáticamente por períodos iguales al plazo mínimo establecido, salvo que cualquiera de las partes notifique su intención de no renovar con ${data.preaviso_renovacion || 30} días de anticipación al vencimiento de cada período.`;
  }
  return "";
}

/**
 * Format payment terms
 */
function formatPaymentTerms(data: StructuredDocumentData): string {
  const parts: string[] = [];
  
  if (data.forma_pago) {
    const formaPagoMap: Record<string, string> = {
      transferencia_bancaria: "Transferencia bancaria",
      efectivo: "Efectivo",
      cheque: "Cheque",
      mercado_pago: "Mercado Pago",
    };
    parts.push(formaPagoMap[String(data.forma_pago)] || String(data.forma_pago));
  }
  
  if (data.preferencias_fiscales) {
    const fiscalMap: Record<string, string> = {
      monotributo: "Monotributo",
      responsable_inscripto: "Responsable Inscripto",
      exento: "Exento",
      precio_mas_impuestos: "Precio + Impuestos",
    };
    parts.push(`Modalidad de facturación: ${fiscalMap[String(data.preferencias_fiscales)] || String(data.preferencias_fiscales)}`);
  }
  
  return parts.length > 0 ? parts.join(". ") : "";
}

/**
 * Format term section
 */
function formatTerm(data: StructuredDocumentData): string {
  const parts: string[] = [];
  
  if (data.inicio_vigencia) {
    parts.push(`Inicio: ${data.inicio_vigencia}`);
  }
  
  if (data.plazo_minimo_meses) {
    parts.push(`Plazo mínimo: ${data.plazo_minimo_meses} meses`);
  }
  
  if (data.plazo_confidencialidad) {
    parts.push(`Plazo de confidencialidad: ${data.plazo_confidencialidad} años`);
  }
  
  return parts.join(", ");
}

/**
 * Format termination section
 */
function formatTermination(data: StructuredDocumentData): string {
  if (data.penalizacion_rescision && data.penalizacion_monto) {
    return `Penalización por rescisión anticipada: ${data.penalizacion_monto}`;
  }
  return "";
}

/**
 * Format confidentiality section
 */
function formatConfidentiality(data: StructuredDocumentData): string {
  if (data.confidencialidad && data.plazo_confidencialidad) {
    return `Confidencialidad por ${data.plazo_confidencialidad} años`;
  }
  return "";
}

/**
 * Format intellectual property section
 */
function formatIntellectualProperty(data: StructuredDocumentData): string {
  if (data.propiedad_intelectual && data.tipo_propiedad_intelectual) {
    return `Propiedad intelectual: ${data.tipo_propiedad_intelectual}`;
  }
  return "";
}

/**
 * Format IP type text
 */
function formatIPTypeText(data: StructuredDocumentData): string {
  const tipoMap: Record<string, string> = {
    cesion_total: "El PROVEEDOR cede al CLIENTE todos los derechos de propiedad intelectual sobre los trabajos realizados.",
    licencia_exclusiva: "El PROVEEDOR otorga al CLIENTE una licencia exclusiva sobre los trabajos realizados.",
    licencia_no_exclusiva: "El PROVEEDOR otorga al CLIENTE una licencia no exclusiva sobre los trabajos realizados.",
    reserva_proveedor: "El PROVEEDOR se reserva todos los derechos de propiedad intelectual sobre los trabajos realizados.",
  };
  
  return tipoMap[String(data.tipo_propiedad_intelectual)] || "";
}

/**
 * Format deadline for legal notice
 */
function formatDeadline(data: StructuredDocumentData): string {
  if (!data.plazo_cumplimiento) {
    return "";
  }
  
  if (data.plazo_cumplimiento === "custom" && data.plazo_custom) {
    return String(data.plazo_custom);
  }
  
  const plazoMap: Record<string, string> = {
    "3_dias": "3 días hábiles",
    "5_dias": "5 días hábiles",
    "10_dias": "10 días hábiles",
    "15_dias": "15 días hábiles",
    "30_dias": "30 días hábiles",
  };
  
  return plazoMap[String(data.plazo_cumplimiento)] || String(data.plazo_cumplimiento);
}

/**
 * Format IP disposition
 */
function formatIPDisposition(data: StructuredDocumentData): string {
  const tipoMap: Record<string, string> = {
    cesion_total: "de propiedad del CLIENTE",
    licencia_exclusiva: "licenciados exclusivamente al CLIENTE",
    licencia_no_exclusiva: "licenciados no exclusivamente al CLIENTE",
    reserva_proveedor: "de propiedad del PROVEEDOR",
  };
  
  return tipoMap[String(data.tipo_propiedad_intelectual)] || "según lo acordado";
}

/**
 * Format notifications section
 */
function formatNotifications(data: StructuredDocumentData): string {
  if (data.domicilio_notificaciones) {
    return `Domicilio para notificaciones: ${data.domicilio_notificaciones}`;
  }
  return "";
}

/**
 * Format jurisdiction section
 */
function formatJurisdiction(data: StructuredDocumentData): string {
  const jurisdictionMap: Record<string, string> = {
    caba: "Ciudad Autónoma de Buenos Aires",
    buenos_aires: "Provincia de Buenos Aires",
    cordoba: "Provincia de Córdoba",
    santa_fe: "Provincia de Santa Fe",
    mendoza: "Provincia de Mendoza",
    corrientes_capital: "Corrientes Capital",
    posadas_misiones: "Posadas, Misiones",
  };
  
  const jurisdiction = String(data.jurisdiccion || "");
  return jurisdictionMap[jurisdiction] || jurisdiction;
}

/**
 * Generate document using hybrid approach
 * 
 * @param documentType - Document type ID
 * @param data - Structured document data
 * @param template - Template base
 * @param clauses - Map of available clauses
 * @param requiredClauseIds - Required clause IDs
 * @param optionalClauseIds - Optional clause IDs with conditions
 * @param warnings - Pre-generated warnings
 * @returns Document generation result
 */
export function generateDocument(
  documentType: DocumentTypeId,
  data: StructuredDocumentData,
  template: TemplateBase,
  clauses: Map<string, ClauseDefinition>,
  requiredClauseIds: string[],
  optionalClauseIds: Array<{ id: string; condition?: (data: StructuredDocumentData) => boolean }>,
  warnings: GenerationWarning[] = []
): Omit<DocumentGenerationResult, "aiEnhancedDraft" | "metadata"> {
  // Generate clause plan
  const clausePlan = generateClausePlan(
    documentType,
    data,
    requiredClauseIds,
    optionalClauseIds
  );
  
  // Assemble base draft
  const baseDraft = assembleBaseDraft(template, clauses, clausePlan, data);
  
  return {
    structuredData: data,
    clausePlan,
    baseDraft,
    warnings,
  };
}

/**
 * TODO: AI Enhancement Function
 * 
 * This function will take the baseDraft and enhance it with AI:
 * - Improve coherence
 * - Adapt tone
 * - Review consistency
 * - Polish language
 * 
 * For now, this is a placeholder that returns the base draft as-is.
 * It will be implemented in a future phase when we integrate with OpenAI.
 */
export async function enhanceDraftWithAI(
  baseDraft: string,
  documentType: DocumentTypeId,
  tone: string,
  promptConfig: {
    systemMessage: string;
    baseInstructions: string[];
    toneInstructions: Record<string, string>;
  }
): Promise<string> {
  // TODO: Implement AI enhancement
  // For now, return base draft as-is
  return baseDraft;
}

