/**
 * Document Generation Service
 *
 * Orchestrates the complete document generation process:
 * 1. Template assembly → baseDraft
 * 2. AI enhancement using baseDraft + structured form data
 */

import OpenAI from "openai";
import type {
  DocumentTypeId,
  StructuredDocumentData,
  DocumentGenerationResult,
  GenerationMetadata,
} from "../domain/document-types.js";
import {
  validateDocumentData,
  getValidationRulesForType,
} from "../domain/validation-engine.js";
import {
  generateDocument,
  enhanceDraftWithAI,
  generateClausePlan,
  assembleBaseDraft,
} from "../domain/generation-engine.js";
import type { TemplateBase } from "../domain/generation-engine.js";
import type { ClauseDefinition } from "../domain/generation-engine.js";
import { getTemplate } from "../templates/index.js";
import {
  getClausesForType,
  getRequiredClauseIds,
  getOptionalClauseIds,
} from "../clauses/index.js";
import { logger } from "../../../utils/logger.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

/**
 * Generate document using new architecture.
 * Passes both baseDraft and raw structured data to the AI enhancement step.
 */
export async function generateDocumentWithNewArchitecture(
  documentType: DocumentTypeId,
  data: StructuredDocumentData,
  tone: string
): Promise<DocumentGenerationResult> {
  logger.info(`[generation-service] Generating ${documentType} document`);

  // 1. Get template
  const template = getTemplate(documentType);
  if (!template) {
    throw new Error(`Template not found for document type: ${documentType}`);
  }

  // 2. Get clauses
  const clauses = getClausesForType(documentType);
  const requiredClauseIds = getRequiredClauseIds(documentType);
  const optionalClauseIds = getOptionalClauseIds(documentType);

  // 3. Validate data
  const validationRules = await getValidationRulesForType(documentType);
  const validationResult = validateDocumentData(
    data,
    validationRules.semantic,
    validationRules.warnings
  );

  if (!validationResult.valid) {
    const error = new Error(`Validation failed: ${validationResult.errors.join(", ")}`);
    (error as any).statusCode = 400;
    (error as any).validationErrors = validationResult.errors;
    throw error;
  }

  // 4. Generate clause plan
  const clausePlan = generateClausePlan(
    documentType,
    data,
    requiredClauseIds,
    optionalClauseIds
  );

  // 5. Assemble base draft
  const rawBaseDraft = assembleBaseDraft(template, clauses, clausePlan, data);

  // 5b. Append additionalClauses as a physical section in the baseDraft.
  //
  // This guarantees the content is present in two scenarios:
  //   a) AI path: the AI sees it as document content (not just instructions)
  //      and is instructed to keep/incorporate it as mandatory clauses.
  //   b) Fallback path: if OpenAI fails and baseDraft is returned as-is,
  //      additionalClauses is still visible to the user.
  //
  // NOTE (future): if a user writes clauses that contradict the document type
  // (e.g., a payment clause in a legal_notice), the AI should flag or ignore it.
  // Until that logic is implemented, the AI receives a strict instruction not to
  // invent content — conflicting clauses will be reformulated but not removed.
  const baseDraft = appendAdditionalClauses(rawBaseDraft, data);

  logger.info(`[generation-service] Base draft generated (${baseDraft.length} chars)`);

  // 6. Enhance with AI — now passes full data alongside the baseDraft
  const promptConfig = getPromptConfigForType(documentType, tone);
  let aiEnhancedDraft: string;
  let aiTokens: { prompt: number; completion: number } | undefined;

  try {
    const enhancedResult = await enhanceDraftWithAIWrapper(
      baseDraft,
      documentType,
      tone,
      promptConfig,
      data
    );
    aiEnhancedDraft = enhancedResult.text;
    aiTokens = enhancedResult.tokens;
  } catch (error) {
    logger.warn(`[generation-service] AI enhancement failed, using base draft: ${error}`);
    aiEnhancedDraft = baseDraft;
  }

  // 7. Build metadata
  const metadata: GenerationMetadata = {
    documentType,
    templateVersion: template.version,
    generationTimestamp: new Date().toISOString(),
    aiModel: "gpt-4o-mini",
    aiTokens,
  };

  return {
    structuredData: data,
    clausePlan,
    baseDraft,
    aiEnhancedDraft,
    warnings: validationResult.warnings,
    metadata,
  };
}

// ---------------------------------------------------------------------------
// buildStructuredContextForAI
// ---------------------------------------------------------------------------

/**
 * Formats raw form data into a structured, labeled context block for the AI.
 *
 * This is the "source of truth" section of the prompt: it gives OpenAI access
 * to all relevant form fields, grouped by semantic category, regardless of
 * whether they were interpolated into the baseDraft.
 *
 * @param data - Raw structured document data from the form
 * @param documentType - Document type ID
 * @returns Formatted multi-line string ready to embed in the AI prompt
 */
export function buildStructuredContextForAI(
  data: StructuredDocumentData,
  documentType: DocumentTypeId
): string {
  const lines: string[] = [];

  const add = (label: string, value: unknown): void => {
    const str = value !== null && value !== undefined ? String(value).trim() : "";
    if (str !== "" && str !== "undefined") {
      lines.push(`${label}: ${str}`);
    }
  };

  const addBool = (label: string, value: unknown, yesText = "Sí", noText = "No"): void => {
    if (value !== null && value !== undefined) {
      lines.push(`${label}: ${value ? yesText : noText}`);
    }
  };

  const section = (title: string): void => {
    if (lines.length > 0) lines.push("");
    lines.push(`[${title}]`);
  };

  // --- Config ---
  section("Configuración");
  add("Tipo de documento", documentType);
  add("Jurisdicción", formatJurisdictionText(String(data.jurisdiccion || "")));
  add("Tono", data.tono);

  // --- Parties ---
  section("Partes");

  if (documentType === "service_contract") {
    add("Proveedor", data.proveedor_nombre);
    add("CUIT/Doc Proveedor", data.proveedor_doc);
    add("Domicilio Proveedor", data.proveedor_domicilio);
    add("Cliente", data.cliente_nombre);
    add("CUIT/Doc Cliente", data.cliente_doc);
    add("Domicilio Cliente", data.cliente_domicilio);
  } else if (documentType === "nda") {
    add("Revelador", data.revelador_nombre);
    add("CUIT/Doc Revelador", data.revelador_doc);
    add("Domicilio Revelador", data.revelador_domicilio);
    add("Receptor", data.receptor_nombre);
    add("CUIT/Doc Receptor", data.receptor_doc);
    add("Domicilio Receptor", data.receptor_domicilio);
  } else if (documentType === "legal_notice") {
    add("Remitente", data.remitente_nombre);
    add("CUIT/Doc Remitente", data.remitente_doc);
    add("Domicilio Remitente", data.remitente_domicilio);
    add("Destinatario", data.destinatario_nombre);
    add("CUIT/Doc Destinatario", data.destinatario_doc);
    add("Domicilio Destinatario", data.destinatario_domicilio);
  } else if (documentType === "lease") {
    add("Locador", data.locador_nombre);
    add("CUIT/Doc Locador", data.locador_doc);
    add("Domicilio Locador", data.locador_domicilio);
    add("Locatario", data.locatario_nombre);
    add("CUIT/Doc Locatario", data.locatario_doc);
    add("Domicilio Locatario", data.locatario_domicilio);
  }

  // --- Content (type-specific) ---
  if (documentType === "service_contract") {
    section("Objeto del contrato");
    add("Descripción del servicio", data.descripcion_servicio);
    add("Alcance", data.alcance);
    add("Entregables", data.entregables);

    section("Condiciones comerciales");
    if (data.monto && data.moneda) add("Monto", `${data.moneda} ${data.monto}`);
    add("Periodicidad de pago", data.periodicidad);
    add("Forma de pago", data.forma_pago);
    add("Plazo de pago", data.plazo_pago);
    addBool("Precio incluye impuestos", data.precio_incluye_impuestos);
    if (data.ajuste_precio && data.ajuste_precio !== "ninguno") {
      add("Ajuste de precio", data.ajuste_precio);
    }

    section("Plazo y vigencia");
    add("Inicio de vigencia", data.inicio_vigencia);
    add("Duración mínima (meses)", data.plazo_minimo_meses);
    addBool("Renovación automática", data.renovacion_automatica);
    if (data.renovacion_automatica) add("Preaviso de renovación (días)", data.preaviso_renovacion);

    section("Rescisión");
    if (data.penalizacion_rescision) {
      addBool("Penalización por rescisión anticipada", data.penalizacion_rescision);
      add("Monto de penalización", data.penalizacion_monto);
    }
    add("Preaviso para rescisión (días)", data.preaviso_rescision);

    section("Cláusulas opcionales");
    if (data.confidencialidad) {
      addBool("Cláusula de confidencialidad", data.confidencialidad);
      add("Plazo de confidencialidad (años)", data.plazo_confidencialidad);
    }
    if (data.propiedad_intelectual) {
      addBool("Cláusula de propiedad intelectual", data.propiedad_intelectual);
      add("Tipo de cesión/licencia", data.tipo_propiedad_intelectual);
    }
    add("Domicilio especial para notificaciones", data.domicilio_especial);

  } else if (documentType === "nda") {
    section("Información confidencial");
    add("Definición de información confidencial", data.definicion_informacion);
    add("Finalidad permitida", data.finalidad_permitida);
    add("Exclusiones", data.exclusiones);

    section("Plazo y obligaciones");
    add("Plazo de confidencialidad (años)", data.plazo_confidencialidad);
    add("Inicio de vigencia", data.inicio_vigencia);
    if (data.devolucion_destruccion) {
      addBool("Obligación de devolución/destrucción", data.devolucion_destruccion);
      add("Plazo para devolución/destrucción (días)", data.plazo_devolucion);
    }

    section("Incumplimiento");
    add("Penalidad por incumplimiento", data.penalidad_incumplimiento);

  } else if (documentType === "legal_notice") {
    section("Contexto y antecedentes");
    add("Relación previa / contexto", data.relacion_previa);

    section("Hechos");
    add("Narración de hechos", data.hechos);

    section("Incumplimiento");
    add("Descripción del incumplimiento", data.incumplimiento);

    section("Intimación");
    add("Texto de la intimación", data.intimacion);
    const plazo = data.plazo_cumplimiento === "custom"
      ? data.plazo_custom
      : data.plazo_cumplimiento;
    add("Plazo para cumplir", plazo);
    add("Apercibimiento", data.apercibimiento);

  } else if (documentType === "lease") {
    section("Objeto de la locación");
    add("Descripción del bien", data.descripcion_inmueble);
    add("Dirección del bien", data.domicilio_inmueble);
    add("Destino de uso", data.destino_uso);

    section("Condiciones económicas");
    if (data.monto_alquiler && data.moneda) add("Canon mensual", `${data.moneda} ${data.monto_alquiler}`);
    add("Forma de pago", data.forma_pago);
    add("Día de pago del mes", data.dia_pago);
    add("Ajuste del canon", data.ajuste_precio);

    section("Plazo");
    add("Fecha de inicio", data.fecha_inicio);
    add("Duración (meses)", data.duracion_meses);
    addBool("Renovación automática", data.renovacion_automatica);

    section("Condiciones adicionales");
    if (data.deposito_garantia) {
      addBool("Depósito de garantía", data.deposito_garantia);
      add("Meses de depósito", data.meses_deposito);
    }
    add("Servicios a cargo del locatario", data.servicios_locatario);
    add("Preaviso para rescisión (días)", data.preaviso_rescision);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// AI Enhancement
// ---------------------------------------------------------------------------

/**
 * Calls OpenAI with a structured prompt that includes:
 * - The assembled baseDraft (structure + interpolated clauses)
 * - The raw structured form data (source of truth for all fields)
 * - additionalClauses when present
 * - Explicit output instructions
 */
async function enhanceDraftWithAIWrapper(
  baseDraft: string,
  documentType: DocumentTypeId,
  tone: string,
  promptConfig: {
    systemMessage: string;
    baseInstructions: string[];
    toneInstructions: Record<string, string>;
  },
  data: StructuredDocumentData
): Promise<{ text: string; tokens: { prompt: number; completion: number } }> {
  const toneInstruction =
    promptConfig.toneInstructions[tone] ||
    promptConfig.toneInstructions.commercial_clear;

  const jurisdiccionTexto = formatJurisdictionText(String(data.jurisdiccion || ""));
  const structuredContext = buildStructuredContextForAI(data, documentType);

  const hasAdditionalClauses =
    data.additionalClauses && String(data.additionalClauses).trim().length > 0;

  const userPrompt = `Generá el documento legal final completo del siguiente tipo: ${documentType}

TONO: ${toneInstruction}
JURISDICCIÓN: ${jurisdiccionTexto}

BORRADOR BASE (estructura y cláusulas ya ensambladas — usarlo como esqueleto):
---
${baseDraft}
---

DATOS ESTRUCTURADOS DEL FORMULARIO (fuente de verdad — completar el documento con estos datos):
---
${structuredContext}
---

INSTRUCCIONES DE SALIDA:
${promptConfig.baseInstructions.map((i) => `- ${i}`).join("\n")}
- Usá el borrador base como estructura principal del documento
- Completá y mejorá el texto con los datos estructurados cuando aporten información adicional o más precisa que el borrador
- Si un dato del formulario ya está en el borrador, no lo repitas — solo mejorá la redacción${hasAdditionalClauses ? "\n- El borrador incluye una sección CLÁUSULAS ADICIONALES con contenido solicitado por el usuario — es OBLIGATORIA, incorporarla y numerarla correctamente como cláusula dentro del documento" : ""}
- NO dejés placeholders como [indicar], [COMPLETAR], [___], {{VARIABLE}} — si falta un dato usá lo que ya está en el borrador
- NO inventés información que no esté en los datos estructurados ni en el borrador
- NO incluyas explicaciones, comentarios ni meta-texto
- Responde ÚNICAMENTE con el texto final del documento, listo para usar`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: promptConfig.systemMessage },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() || baseDraft;
    const tokens = {
      prompt: completion.usage?.prompt_tokens || 0,
      completion: completion.usage?.completion_tokens || 0,
    };

    return { text, tokens };
  } catch (error) {
    logger.error(`[generation-service] OpenAI error: ${error}`);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Prompt config per document type
// ---------------------------------------------------------------------------

/**
 * Returns the prompt configuration for a given document type.
 * Each type has a specialized system message and type-specific instructions.
 */
function getPromptConfigForType(
  documentType: DocumentTypeId,
  _tone: string
): {
  systemMessage: string;
  baseInstructions: string[];
  toneInstructions: Record<string, string>;
} {
  const toneInstructions = {
    formal_technical:
      "Formal y técnico legal. Terminología jurídica precisa. Cláusulas técnicas.",
    commercial_clear:
      "Comercial y claro. Lenguaje entendible para PyMEs sin sacrificar validez legal.",
    balanced_professional:
      "Balanceado: profesional pero accesible. Terminología jurídica correcta con claridad.",
  };

  const commonInstructions = [
    "El documento debe ser legalmente válido y ejecutable en Argentina",
    "Usar todos los datos concretos proporcionados (nombres, montos, fechas, domicilios)",
    "Estructura: encabezado con identificación completa de partes, luego cláusulas numeradas",
  ];

  if (documentType === "service_contract") {
    return {
      systemMessage:
        "Eres un abogado senior argentino especializado en derecho comercial y contratos de servicios con 20 años de experiencia. Generás contratos válidos, completos y ejecutables según el Código Civil y Comercial de la Nación.",
      baseInstructions: [
        ...commonInstructions,
        "Incluir obligatoriamente: identificación de partes, objeto y alcance del servicio, monto y forma de pago, vigencia, rescisión, foro de competencia",
        "Incluir las cláusulas opcionales que figuren en los datos estructurados (confidencialidad, propiedad intelectual)",
        "Numerar cláusulas en mayúsculas: PRIMERA, SEGUNDA, etc.",
        "Cerrar el documento con sección de FIRMAS con espacios para firma y aclaración de cada parte",
      ],
      toneInstructions,
    };
  }

  if (documentType === "nda") {
    return {
      systemMessage:
        "Eres un abogado senior argentino especializado en acuerdos de confidencialidad y propiedad intelectual. Generás NDAs válidos y completos según la normativa argentina vigente.",
      baseInstructions: [
        ...commonInstructions,
        "Incluir obligatoriamente: definición precisa de información confidencial, finalidad permitida, obligaciones del receptor, plazo de vigencia, consecuencias del incumplimiento, foro de competencia",
        "Incluir obligación de devolución/destrucción si figura en los datos estructurados",
        "Numerar cláusulas en mayúsculas: PRIMERA, SEGUNDA, etc.",
        "Cerrar con sección de FIRMAS",
      ],
      toneInstructions,
    };
  }

  if (documentType === "legal_notice") {
    return {
      systemMessage:
        "Eres un abogado senior argentino especializado en cartas documento y notificaciones legales con efectos fehacientes. Generás cartas documento CERRADAS y DEFINITIVAS — con todos los datos completos, sin dejar espacios en blanco ni placeholders. El documento debe poder enviarse sin ninguna modificación adicional.",
      baseInstructions: [
        ...commonInstructions,
        "Incluir obligatoriamente: identificación completa de remitente y destinatario, relación previa o contexto, narración cronológica de hechos, descripción del incumplimiento, intimación concreta y específica, plazo para cumplir, apercibimiento con consecuencias legales, foro de competencia",
        "La intimación debe ser clara, específica y no dejar lugar a ambigüedades",
        "El documento es definitivo — todos los campos deben estar completos con los datos del formulario",
        "Cerrar con lugar, fecha y sección de FIRMA del remitente",
      ],
      toneInstructions,
    };
  }

  if (documentType === "lease") {
    return {
      systemMessage:
        "Eres un abogado senior argentino especializado en contratos de locación inmobiliaria y la Ley de Alquileres vigente. Generás contratos de locación válidos y completos según la normativa argentina.",
      baseInstructions: [
        ...commonInstructions,
        "Incluir obligatoriamente: identificación de locador y locatario, descripción del inmueble, canon y forma de pago, plazo, condiciones de rescisión, depósito de garantía si corresponde, foro de competencia",
        "Aplicar normativa de la Ley de Alquileres vigente en Argentina",
        "Numerar cláusulas en mayúsculas: PRIMERA, SEGUNDA, etc.",
        "Cerrar con sección de FIRMAS",
      ],
      toneInstructions,
    };
  }

  // Fallback genérico
  return {
    systemMessage:
      "Eres un abogado senior argentino con 20 años de experiencia en derecho comercial. Generás documentos legales válidos y completos según la normativa argentina vigente.",
    baseInstructions: [
      ...commonInstructions,
      "Incluir todas las cláusulas necesarias para que el documento sea completo y ejecutable",
      "Numerar cláusulas en mayúsculas: PRIMERA, SEGUNDA, etc.",
      "Cerrar con sección de FIRMAS",
    ],
    toneInstructions,
  };
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Appends the user's additionalClauses as a dedicated section in the baseDraft,
 * positioned before the signatures block.
 *
 * Inserting BEFORE signatures (rather than at the very end) ensures the final
 * document structure is: main clauses → additional clauses → signatures.
 *
 * If no additionalClauses are present, the draft is returned unchanged.
 *
 * NOTE (future): clause conflict detection should be added here.
 * If additionalClauses contains content that contradicts the document type
 * (e.g., a payment obligation in a legal_notice), a warning should be added
 * to generationWarnings and the offending text should be flagged for review.
 */
function appendAdditionalClauses(
  draft: string,
  data: StructuredDocumentData
): string {
  const text =
    data.additionalClauses ? String(data.additionalClauses).trim() : "";

  if (text.length === 0) return draft;

  const additionalSection = `\nCLÁUSULAS ADICIONALES\n\n${text}\n`;

  // Try to insert before the signatures block.
  // Signatures are identified by a line starting with underscores (___) or
  // common labels like "Firma", "FIRMA", "Lugar:", "Fecha:" at the bottom.
  const signaturesPattern = /\n(?=_{3,}|\s*Lugar:|FIRMAS|En prueba)/i;
  const signaturesIndex = draft.search(signaturesPattern);

  if (signaturesIndex !== -1) {
    return (
      draft.slice(0, signaturesIndex) +
      "\n" +
      additionalSection +
      draft.slice(signaturesIndex)
    );
  }

  // Fallback: append at the end
  return `${draft}\n${additionalSection}`;
}

function formatJurisdictionText(jurisdiction: string): string {
  const map: Record<string, string> = {
    caba: "Ciudad Autónoma de Buenos Aires",
    buenos_aires: "Provincia de Buenos Aires",
    cordoba: "Provincia de Córdoba",
    santa_fe: "Provincia de Santa Fe",
    mendoza: "Provincia de Mendoza",
    corrientes_capital: "Corrientes Capital",
    posadas_misiones: "Posadas, Misiones",
  };
  return map[jurisdiction] || jurisdiction;
}
