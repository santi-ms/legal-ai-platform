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
        // Map clause IDs to template slot names - Lease
        clauseId === "objeto_locacion" ? "{{CLAUSE_PROPERTY}}" : null,
        clauseId === "canon_locativo" ? "{{CLAUSE_AMOUNT}}" : null,
        clauseId === "plazo_locacion" ? "{{CLAUSE_TERM}}" : null,
        clauseId === "condiciones_locacion" ? "{{CLAUSE_CONDITIONS}}" : null,
        clauseId === "obligaciones_especiales_locacion" ? "{{CLAUSE_OBLIGATIONS}}" : null,
        clauseId === "fiador_garante_locacion" ? "{{CLAUSE_GUARANTOR}}" : null,
        clauseId === "rescision_anticipada_locacion" ? "{{CLAUSE_LEASE_TERMINATION}}" : null,
        clauseId === "domicilios_locacion" ? "{{CLAUSE_JURISDICTION}}" : null,
        clauseId === "jurisdiccion_locacion" ? "{{CLAUSE_DISPUTES}}" : null,
        // Map clause IDs to template slot names - Debt Recognition
        clauseId === "reconocimiento_deuda" ? "{{CLAUSE_DEBT}}" : null,
        clauseId === "forma_pago_deuda" ? "{{CLAUSE_PAYMENT}}" : null,
        clauseId === "incumplimiento_deuda" ? "{{CLAUSE_DEFAULT}}" : null,
        // Map clause IDs to template slot names - Simple Authorization
        clauseId === "alcance_autorizacion" ? "{{CLAUSE_SCOPE}}" : null,
        clauseId === "vigencia_autorizacion" ? "{{CLAUSE_VALIDITY}}" : null,
        clauseId === "observaciones_autorizacion" ? "{{CLAUSE_OBSERVATIONS}}" : null,
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
 * Get clause number text (PRIMERA, SEGUNDA, ... VIGÉSIMA PRIMERA, etc.)
 * Follows Argentine legal drafting conventions.
 */
function getClauseNumberText(num: number): string {
  const numbers = [
    "PRIMERA",        //  1
    "SEGUNDA",        //  2
    "TERCERA",        //  3
    "CUARTA",         //  4
    "QUINTA",         //  5
    "SEXTA",          //  6
    "SÉPTIMA",        //  7
    "OCTAVA",         //  8
    "NOVENA",         //  9
    "DÉCIMA",         // 10
    "UNDÉCIMA",       // 11
    "DÉCIMO SEGUNDA", // 12
    "DÉCIMO TERCERA", // 13
    "DÉCIMO CUARTA",  // 14
    "DÉCIMO QUINTA",  // 15
    "DÉCIMO SEXTA",   // 16
    "DÉCIMO SÉPTIMA", // 17
    "DÉCIMO OCTAVA",  // 18
    "DÉCIMO NOVENA",  // 19
    "VIGÉSIMA",       // 20
  ];

  if (num >= 1 && num <= numbers.length) {
    return numbers[num - 1];
  }

  // For numbers > 20, use ordinal
  return `VIGÉSIMA ${getClauseNumberText(num - 20)}`;
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
    // ---- Shared ----
    PARTIES: formatParties(data),
    JURISDICTION: formatJurisdiction(data),
    FECHA_ACTUAL: new Date().toLocaleDateString("es-AR"),
    FECHA_DIA: new Date().getDate().toString().padStart(2, "0"),
    FECHA_MES: new Date().toLocaleDateString("es-AR", { month: "long" }).toUpperCase(),
    FECHA_ANIO: new Date().getFullYear().toString(),

    // ---- Service contract ----
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
    PROVEEDOR_NOMBRE: String(data.proveedor_nombre || ""),
    CLIENTE_NOMBRE: String(data.cliente_nombre || ""),

    // ---- NDA ----
    REVELADOR_NOMBRE: String(data.revelador_nombre || ""),
    RECEPTOR_NOMBRE: String(data.receptor_nombre || ""),
    DEFINITION: String(data.definicion_informacion || ""),
    PURPOSE: String(data.finalidad_permitida || ""),
    EXCLUSIONS: String(data.exclusiones || ""),
    PLAZO_DEVOLUCION: String(data.plazo_devolucion ? `${data.plazo_devolucion} días` : ""),
    PENALIDAD_INCUMPLIMIENTO: String(data.penalidad_incumplimiento || ""),

    // ---- Legal notice ----
    REMITENTE_NOMBRE: String(data.remitente_nombre || ""),
    DESTINATARIO_NOMBRE: String(data.destinatario_nombre || ""),
    CONTEXT: String(data.relacion_previa || ""),
    FACTS: String(data.hechos || ""),
    BREACH: String(data.incumplimiento || ""),
    DEMAND: String(data.intimacion || ""),
    DEADLINE: formatDeadline(data),
    WARNING: String(data.apercibimiento || ""),

    // ---- Lease ----
    LOCADOR_NOMBRE: String(data.locador_nombre || ""),
    LOCATARIO_NOMBRE: String(data.locatario_nombre || ""),
    PROPERTY_DESC: String(data.descripcion_inmueble || ""),
    PROPERTY_ADDRESS: String(data.domicilio_inmueble || ""),
    PROPERTY_USE: formatDestinoUso(data),
    RENT_AMOUNT: formatRentAmount(data),
    DIA_PAGO: String(data.dia_pago ? `día ${data.dia_pago}` : "día 1"),
    LEASE_TERM: formatLeaseTerm(data),
    LEASE_RENEWAL: formatLeaseRenewal(data),
    AJUSTE_CANON: formatAjusteCanon(data),
    DEPOSITO: formatDeposito(data),
    SERVICIOS_LOCATARIO: data.servicios_cargo_locatario
      ? `Servicios a cargo del locatario: ${String(data.servicios_cargo_locatario)}.`
      : "",
    USUARIOS_INMUEBLE: formatUsuariosInmueble(data),
    FIADOR_INFO: formatFiadorInfo(data),
    FIADOR_FIRMA: formatFiadorFirma(data),
    RESTRICCIONES_ADICIONALES: data.restricciones_uso
      ? `Restricciones específicas pactadas: ${String(data.restricciones_uso)}.`
      : "",
    PREAVISO_RESCISION_LOCACION: String(data.preaviso_rescision ? `${data.preaviso_rescision} días` : "30 días"),

    // ---- Debt Recognition ----
    ACREEDOR_NOMBRE: String(data.acreedor_nombre || ""),
    DEUDOR_NOMBRE: String(data.deudor_nombre || ""),
    DEBT_AMOUNT: formatDebtAmount(data),
    DEBT_CAUSE: String(data.causa_deuda || ""),
    RECOGNITION_DATE: String(data.fecha_reconocimiento || ""),
    PAYMENT_PLAN: formatPaymentPlan(data),
    INTEREST_CLAUSE: formatInterestClause(data),
    DEFAULT_CLAUSE: formatDefaultClause(data),

    // ---- Simple Authorization ----
    AUTORIZANTE_NOMBRE: String(data.autorizante_nombre || ""),
    AUTORIZADO_NOMBRE: String(data.autorizado_nombre || ""),
    TRAMITE: String(data.tramite_autorizado || ""),
    SCOPE_DESC: String(data.descripcion_alcance || ""),
    LIMITATIONS: data.limitaciones
      ? `Limitaciones: ${String(data.limitaciones)}`
      : "",
    AUTH_DATE: String(data.fecha_autorizacion || ""),
    AUTH_VALIDITY: formatAuthValidity(data),
    SPECIAL_CONDITIONS: formatSpecialConditions(data),
  };
  
  return mapping[key] || "";
}

/**
 * Format parties section — one branch per document type, keyed by party field names.
 */
function formatParties(data: StructuredDocumentData): string {
  const p = (label: string, nombre: unknown, doc: unknown, domicilio: unknown) =>
    `${label}: ${String(nombre || "")}, ${String(doc || "")}, con domicilio en ${String(domicilio || "")}`;

  if (data.proveedor_nombre && data.cliente_nombre) {
    return `${p("PROVEEDOR", data.proveedor_nombre, data.proveedor_doc, data.proveedor_domicilio)}\n${p("CLIENTE", data.cliente_nombre, data.cliente_doc, data.cliente_domicilio)}`;
  }
  if (data.revelador_nombre && data.receptor_nombre) {
    return `${p("REVELADOR", data.revelador_nombre, data.revelador_doc, data.revelador_domicilio)}\n${p("RECEPTOR", data.receptor_nombre, data.receptor_doc, data.receptor_domicilio)}`;
  }
  if (data.remitente_nombre && data.destinatario_nombre) {
    return `${p("REMITENTE", data.remitente_nombre, data.remitente_doc, data.remitente_domicilio)}\n${p("DESTINATARIO", data.destinatario_nombre, data.destinatario_doc, data.destinatario_domicilio)}`;
  }
  if (data.locador_nombre && data.locatario_nombre) {
    const destino = String(data.destino_uso || "habitacional").toLowerCase();
    const tipoLabel = destino.includes("comercial") ? "CON DESTINO COMERCIAL"
      : destino.includes("profesional") ? "CON DESTINO PROFESIONAL"
      : "CON DESTINO HABITACIONAL";
    const locadorNombre = String(data.locador_nombre || "");
    const locatarioNombre = String(data.locatario_nombre || "");
    const locadorDoc = String(data.locador_doc || "");
    const locatarioDoc = String(data.locatario_doc || "");
    const locadorDom = String(data.locador_domicilio || "");
    const locatarioDom = String(data.locatario_domicilio || "");
    const locatarioEmail = data.locatario_email ? `, correo electrónico: ${String(data.locatario_email)}` : "";
    return `Entre ${locadorNombre}, D.N.I./C.U.I.T. Nº ${locadorDoc}, con domicilio en ${locadorDom}, en adelante denominado EL LOCADOR, por una parte; y por la otra, ${locatarioNombre}, D.N.I./C.U.I.T. Nº ${locatarioDoc}${locatarioEmail}, con domicilio real en ${locatarioDom}, en adelante denominado EL LOCATARIO; celebran el presente CONTRATO DE LOCACIÓN ${tipoLabel}, en adelante «CONTRATO», sujeto al régimen legal vigente y a las estipulaciones siguientes:`;
  }
  if (data.acreedor_nombre && data.deudor_nombre) {
    return `${p("ACREEDOR", data.acreedor_nombre, data.acreedor_doc, data.acreedor_domicilio)}\n${p("DEUDOR", data.deudor_nombre, data.deudor_doc, data.deudor_domicilio)}`;
  }
  if (data.autorizante_nombre && data.autorizado_nombre) {
    return `${p("AUTORIZANTE", data.autorizante_nombre, data.autorizante_doc, data.autorizante_domicilio)}\n${p("AUTORIZADO", data.autorizado_nombre, data.autorizado_doc, data.autorizado_domicilio)}`;
  }
  return "";
}

/**
 * Format amount section (service contract: uses data.monto)
 */
function formatAmount(data: StructuredDocumentData): string {
  if (data.monto && data.moneda) {
    return `${data.moneda} ${data.monto}`;
  }
  return "";
}

/** Lease: uses data.monto_alquiler */
function formatRentAmount(data: StructuredDocumentData): string {
  if (data.monto_alquiler && data.moneda) {
    return `${data.moneda} ${data.monto_alquiler}`;
  }
  return "";
}

/** Debt recognition: uses data.monto_deuda */
function formatDebtAmount(data: StructuredDocumentData): string {
  if (data.monto_deuda && data.moneda) {
    return `${data.moneda} ${data.monto_deuda}`;
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
    icl: "El canon se ajustará según el Índice Casa Propia (ICL) publicado por el BCRA.",
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
 * Format term section (service contract: uses inicio_vigencia + plazo_minimo_meses)
 */
function formatTerm(data: StructuredDocumentData): string {
  const parts: string[] = [];

  if (data.inicio_vigencia) parts.push(`Inicio: ${data.inicio_vigencia}`);
  if (data.plazo_minimo_meses) parts.push(`Plazo mínimo: ${data.plazo_minimo_meses} meses`);
  if (data.plazo_confidencialidad) parts.push(`Plazo de confidencialidad: ${data.plazo_confidencialidad} años`);

  return parts.join(", ");
}

/** Lease: uses fecha_inicio + duracion_meses */
function formatLeaseTerm(data: StructuredDocumentData): string {
  const parts: string[] = [];
  if (data.fecha_inicio) parts.push(`${data.duracion_meses || ""} meses a partir del ${String(data.fecha_inicio)}`);
  else if (data.duracion_meses) parts.push(`${data.duracion_meses} meses`);
  return parts.join("") || "";
}

/** Lease: destino de uso */
function formatDestinoUso(data: StructuredDocumentData): string {
  const map: Record<string, string> = {
    vivienda:  "Vivienda familiar",
    comercial: "Local / comercio",
    oficina:   "Oficina / consultorio",
    deposito:  "Depósito / galpón",
    otro:      "Otro uso permitido",
  };
  return map[String(data.destino_uso || "")] || String(data.destino_uso || "");
}

/** Lease renewal clause */
function formatLeaseRenewal(data: StructuredDocumentData): string {
  if (data.renovacion_automatica === true) {
    return "Al vencimiento del plazo, el contrato se renovará automáticamente por períodos iguales, salvo que cualquiera de las partes notifique su voluntad de no renovar con al menos 60 días de anticipación.";
  }
  return "El presente contrato no se renovará automáticamente al vencimiento.";
}

/** Lease: ajuste del canon (reuses formatPriceAdjustment but exposed as separate alias for clarity) */
function formatAjusteCanon(data: StructuredDocumentData): string {
  return formatPriceAdjustment(data);
}

/** Lease: depósito de garantía */
function formatDeposito(data: StructuredDocumentData): string {
  const meses = Number(data.deposito_meses ?? 1);
  if (data.deposito_meses || data.deposito) {
    const montoStr = data.monto_alquiler && data.moneda
      ? ` (equivalente a ${data.moneda} ${Number(data.monto_alquiler) * meses})`
      : "";
    return `DEPÓSITO DE GARANTÍA: Al momento de la firma del presente contrato, el LOCATARIO entregará al LOCADOR la suma equivalente a ${meses} (${meses === 1 ? "UN" : meses}) mes/es de canon locativo${montoStr}, en concepto de depósito de garantía. Dicho depósito será devuelto al LOCATARIO dentro de los treinta (30) días hábiles de restituido el inmueble en las condiciones pactadas, previa deducción de los daños que correspondan.`;
  }
  return "";
}

/** Lease: usuarios del inmueble */
function formatUsuariosInmueble(data: StructuredDocumentData): string {
  if (data.usuarios_inmueble) {
    return `El inmueble será ocupado exclusivamente por el LOCATARIO y las siguientes personas: ${String(data.usuarios_inmueble)}. Queda prohibida la cesión o sublocación total o parcial del inmueble sin previa autorización escrita del LOCADOR.`;
  }
  return "El inmueble será ocupado exclusivamente por el LOCATARIO. Queda prohibida la cesión o sublocación total o parcial del inmueble sin previa autorización escrita del LOCADOR.";
}

/** Lease: fiador information line */
function formatFiadorInfo(data: StructuredDocumentData): string {
  if (!data.fiador_nombre) return "";
  const doc = data.fiador_doc && data.fiador_doc !== "-" ? `, DNI/CUIT ${String(data.fiador_doc)}` : "";
  const domicilio = data.fiador_domicilio ? `, con domicilio en ${String(data.fiador_domicilio)}` : "";
  return `FIADOR: ${String(data.fiador_nombre)}${doc}${domicilio}.`;
}

/** Lease: fiador signature line (shown at the end of the document) */
function formatFiadorFirma(data: StructuredDocumentData): string {
  if (!data.fiador_nombre) return "";
  return `\n___________________________\n${String(data.fiador_nombre)}\nFiador - Firma y aclaración`;
}

/** Debt recognition: payment plan */
function formatPaymentPlan(data: StructuredDocumentData): string {
  const formaPagoMap: Record<string, string> = {
    transferencia_bancaria: "transferencia bancaria",
    efectivo: "efectivo",
    cheque: "cheque",
    mercado_pago: "Mercado Pago",
    otro: "otro medio acordado",
  };
  const forma = formaPagoMap[String(data.forma_pago || "")] || String(data.forma_pago || "");

  if (data.pago_en_cuotas && data.cantidad_cuotas) {
    const parts: string[] = [
      `La deuda reconocida se cancelará en ${data.cantidad_cuotas} cuota/s`,
    ];
    if (data.monto_cuota && data.moneda) {
      parts.push(`de ${data.moneda} ${data.monto_cuota} cada una`);
    }
    if (data.fecha_primer_vencimiento) {
      parts.push(`siendo el primer vencimiento el ${String(data.fecha_primer_vencimiento)}`);
    }
    if (forma) parts.push(`mediante ${forma}`);
    return parts.join(", ") + ".";
  }

  const parts: string[] = ["La deuda se cancelará mediante pago único"];
  if (data.fecha_primer_vencimiento) {
    parts.push(`con vencimiento el ${String(data.fecha_primer_vencimiento)}`);
  }
  if (forma) parts.push(`mediante ${forma}`);
  return parts.join(", ") + ".";
}

/** Debt recognition: interest clause */
function formatInterestClause(data: StructuredDocumentData): string {
  if (data.incluye_intereses && data.tasa_interes) {
    return `Se pactan intereses a la tasa de ${String(data.tasa_interes)}, aplicables sobre el saldo adeudado desde la fecha de reconocimiento hasta la cancelación total.`;
  }
  if (data.incluye_intereses) {
    return "Se pactan intereses sobre el monto adeudado, cuya tasa será acordada entre las partes.";
  }
  return "No se pactan intereses adicionales sobre el monto reconocido.";
}

/** Debt recognition: default / mora consequences */
function formatDefaultClause(data: StructuredDocumentData): string {
  const parts: string[] = [];
  if (data.clausula_aceleracion) {
    parts.push("Ante el incumplimiento de cualquier cuota, el total adeudado se tornará exigible de inmediato (cláusula de aceleración).");
  }
  if (data.consecuencias_mora) {
    parts.push(String(data.consecuencias_mora));
  }
  if (parts.length === 0) {
    parts.push("El incumplimiento en los pagos pactados dará derecho al acreedor a reclamar la totalidad de la deuda, más los intereses y costas que correspondan.");
  }
  return parts.join(" ");
}

/** Simple authorization: validity */
function formatAuthValidity(data: StructuredDocumentData): string {
  if (data.acto_unico) {
    return `La presente autorización es otorgada para el acto único indicado y quedará extinguida de pleno derecho una vez realizado el mismo. Fecha de otorgamiento: ${String(data.fecha_autorizacion || "")}.`;
  }
  if (data.vigencia_hasta) {
    return `La presente autorización tiene vigencia desde el ${String(data.fecha_autorizacion || "")} hasta el ${String(data.vigencia_hasta)}, pudiendo ser revocada anticipadamente por el autorizante mediante notificación fehaciente.`;
  }
  return `La presente autorización es otorgada con fecha ${String(data.fecha_autorizacion || "")} y permanecerá vigente hasta su revocación expresa por parte del autorizante.`;
}

/** Simple authorization: special conditions and documentation */
function formatSpecialConditions(data: StructuredDocumentData): string {
  const parts: string[] = [];
  if (data.condiciones_especiales) parts.push(String(data.condiciones_especiales));
  if (data.documentacion_asociada) parts.push(`Documentación asociada: ${String(data.documentacion_asociada)}`);
  return parts.join("\n");
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
  promptConfig: {
    systemMessage: string;
    baseInstructions: string[];
  }
): Promise<string> {
  // TODO: Implement AI enhancement
  // For now, return base draft as-is
  return baseDraft;
}

