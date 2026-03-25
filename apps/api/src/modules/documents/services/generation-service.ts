/**
 * Document Generation Service
 *
 * Orchestrates the complete document generation process:
 * 1. Template assembly → baseDraft
 * 2. AI enhancement using baseDraft + structured form data
 */

import Anthropic from "@anthropic-ai/sdk";
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

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
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
  tone: string,
  referenceText?: string | null
): Promise<DocumentGenerationResult> {
  logger.info(`[generation-service] Generating ${documentType} document`);

  // Guard: supply_contract is declared for legacy compatibility but has no template.
  // Return a clear 400 instead of an opaque "Template not found" 500.
  if (documentType === "supply_contract") {
    const err = new Error(
      "El tipo 'Contrato de Suministro' (supply_contract) no está implementado todavía. " +
      "Para contratos de prestación de servicios usá 'Contrato de Servicios' (service_contract)."
    );
    (err as any).statusCode = 400;
    throw err;
  }

  // 1. Get template
  const template = getTemplate(documentType);
  if (!template) {
    const err = new Error(`Tipo documental '${documentType}' no reconocido por el motor de generación.`);
    (err as any).statusCode = 400;
    throw err;
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

  let aiUsed = false;

  try {
    const enhancedResult = await enhanceDraftWithAIWrapper(
      baseDraft,
      documentType,
      tone,
      promptConfig,
      data,
      referenceText
    );
    aiEnhancedDraft = enhancedResult.text;
    aiTokens = enhancedResult.tokens;
    aiUsed = true;
  } catch (error) {
    logger.warn(`[generation-service] AI enhancement failed, using base draft: ${error}`);
    aiEnhancedDraft = baseDraft;
    // Agregamos un warning explícito para que el frontend pueda informarle al usuario
    validationResult.warnings.push({
      id: "ai_enhancement_failed",
      ruleId: "ai_enhancement_failed",
      message:
        "La mejora automática con IA no pudo completarse. El documento fue generado con la plantilla base sin mejora. Revisalo antes de descargarlo.",
      severity: "warning",
    });
  }

  // 7. Build metadata
  const metadata: GenerationMetadata = {
    documentType,
    templateVersion: template.version,
    generationTimestamp: new Date().toISOString(),
    aiModel: aiUsed ? "claude-sonnet-4-6" : "base-template",
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
    if (data.deposito) {
      addBool("Depósito de garantía", data.deposito);
      add("Meses de depósito", data.deposito_meses);
    }
    add("Servicios a cargo del locatario", data.servicios_cargo_locatario);
    add("Preaviso para rescisión (días)", data.preaviso_rescision);

  } else if (documentType === "debt_recognition") {
    section("Partes");
    add("Acreedor", data.acreedor_nombre);
    add("CUIT/Doc Acreedor", data.acreedor_doc);
    add("Domicilio Acreedor", data.acreedor_domicilio);
    add("Deudor", data.deudor_nombre);
    add("CUIT/Doc Deudor", data.deudor_doc);
    add("Domicilio Deudor", data.deudor_domicilio);

    section("Datos de la deuda");
    if (data.monto_deuda && data.moneda) add("Monto total reconocido", `${data.moneda} ${data.monto_deuda}`);
    add("Origen / causa de la deuda", data.causa_deuda);
    add("Fecha de reconocimiento", data.fecha_reconocimiento);

    section("Forma de pago");
    addBool("Pago en cuotas", data.pago_en_cuotas);
    if (data.pago_en_cuotas) {
      add("Cantidad de cuotas", data.cantidad_cuotas);
      if (data.monto_cuota && data.moneda) add("Monto por cuota", `${data.moneda} ${data.monto_cuota}`);
    }
    add("Fecha primer vencimiento", data.fecha_primer_vencimiento);
    add("Forma de pago", data.forma_pago);
    addBool("Incluye intereses", data.incluye_intereses);
    if (data.incluye_intereses) add("Tasa de interés", data.tasa_interes);

    section("Incumplimiento");
    addBool("Cláusula de aceleración", data.clausula_aceleracion);
    add("Consecuencias por mora", data.consecuencias_mora);

  } else if (documentType === "simple_authorization") {
    section("Partes");
    add("Autorizante", data.autorizante_nombre);
    add("CUIT/Doc Autorizante", data.autorizante_doc);
    add("Domicilio Autorizante", data.autorizante_domicilio);
    add("Autorizado", data.autorizado_nombre);
    add("CUIT/Doc Autorizado", data.autorizado_doc);
    add("Domicilio Autorizado", data.autorizado_domicilio);

    section("Alcance de la autorización");
    add("Trámite o acto autorizado", data.tramite_autorizado);
    add("Descripción detallada del alcance", data.descripcion_alcance);
    add("Limitaciones / restricciones", data.limitaciones);

    section("Vigencia");
    add("Fecha de otorgamiento", data.fecha_autorizacion);
    addBool("Autorización por acto único", data.acto_unico);
    add("Vigente hasta", data.vigencia_hasta);

    section("Observaciones");
    add("Condiciones especiales", data.condiciones_especiales);
    add("Documentación asociada", data.documentacion_asociada);
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
  data: StructuredDocumentData,
  referenceText?: string | null
): Promise<{ text: string; tokens: { prompt: number; completion: number } }> {
  // Allow tests to skip the AI call and receive the assembled baseDraft directly.
  // Set SKIP_AI_ENHANCEMENT=true when starting the server in test/CI mode.
  if (process.env.SKIP_AI_ENHANCEMENT === "true") {
    return { text: baseDraft, tokens: { prompt: 0, completion: 0 } };
  }

  const toneInstruction =
    promptConfig.toneInstructions[tone] ||
    promptConfig.toneInstructions.commercial_clear;

  const jurisdiccionTexto = formatJurisdictionText(String(data.jurisdiccion || ""));
  const structuredContext = buildStructuredContextForAI(data, documentType);

  const hasAdditionalClauses =
    data.additionalClauses && String(data.additionalClauses).trim().length > 0;

  // Sección de documento de referencia (si existe)
  const referenceSection = referenceText
    ? `\nDOCUMENTO DE REFERENCIA (el usuario subió este documento como modelo de formato y estilo — usarlo como guía de estructura y redacción, pero completar con los DATOS REALES del formulario):
<reference_document>
${referenceText.substring(0, 3000)}
</reference_document>
`
    : "";

  const userPrompt = `Generá el documento legal final completo del siguiente tipo: ${documentType}

TONO: ${toneInstruction}
JURISDICCIÓN: ${jurisdiccionTexto}
${referenceSection}
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
- Si un dato del formulario ya está en el borrador, no lo repitas — solo mejorá la redacción${hasAdditionalClauses ? "\n- El borrador incluye una sección CLÁUSULAS ADICIONALES con contenido solicitado por el usuario — es OBLIGATORIA, incorporarla y numerarla correctamente como cláusula dentro del documento" : ""}${referenceText ? "\n- Seguí el formato, estructura y estilo de redacción del documento de referencia, adaptándolo a los datos del formulario" : ""}
- NO dejés placeholders como [indicar], [COMPLETAR], [___], {{VARIABLE}} — si falta un dato usá lo que ya está en el borrador
- NO inventés información que no esté en los datos estructurados ni en el borrador
- NO incluyas explicaciones, comentarios ni meta-texto
- Responde ÚNICAMENTE con el texto final del documento, listo para usar`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: promptConfig.systemMessage,
      messages: [
        { role: "user", content: userPrompt },
      ],
    });

    const rawText =
      (message.content[0] as any)?.text?.trim() || baseDraft;
    const tokens = {
      prompt: message.usage?.input_tokens || 0,
      completion: message.usage?.output_tokens || 0,
    };

    // Post-processing: clean and validate AI output
    const text = sanitizeAiOutput(rawText, baseDraft);

    return { text, tokens };
  } catch (error) {
    logger.error(`[generation-service] Claude API error: ${error}`);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// AI output sanitization
// Removes residual placeholders and markdown artifacts from AI-generated text.
// ---------------------------------------------------------------------------

/**
 * Patterns that indicate the AI left a field unfilled.
 * If any are found, we fall back to the baseDraft for that line.
 */
const PLACEHOLDER_PATTERNS = [
  /\[COMPLETAR\]/gi,
  /\[INDICAR\]/gi,
  /\[INSERTAR\]/gi,
  /\[NOMBRE\]/gi,
  /\[FECHA\]/gi,
  /\[MONTO\]/gi,
  /\[DOMICILIO\]/gi,
  /\{\{[^}]+\}\}/g,   // {{VARIABLE}}
  /\[___+\]/g,        // [___]
  /\[…\]/g,
  /\[\.\.\.\]/g,
];

function sanitizeAiOutput(text: string, fallback: string): string {
  let result = text;

  // 1. Strip any markdown the AI might have added despite instructions
  result = result
    .replace(/\*\*(.*?)\*\*/gs, "$1")
    .replace(/__(.*?)__/gs, "$1")
    .replace(/\*(.*?)\*/gs, "$1")
    .replace(/_(.*?)_/gs, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")   // bullet lists
    .replace(/^\d+\.\s+(?=[A-Z])/gm, ""); // numbered lists that aren't clause numbers

  // 2. Detect unfilled placeholders — log warning but don't reject the whole doc
  const foundPlaceholders: string[] = [];
  for (const pattern of PLACEHOLDER_PATTERNS) {
    const matches = result.match(pattern);
    if (matches) {
      foundPlaceholders.push(...matches);
      // Remove the placeholder rather than leaving it in the doc
      result = result.replace(pattern, "");
    }
  }

  if (foundPlaceholders.length > 0) {
    logger.warn(
      `[generation-service] AI left ${foundPlaceholders.length} unfilled placeholder(s): ${[...new Set(foundPlaceholders)].join(", ")}`
    );
  }

  // 3. Normalize whitespace: collapse 3+ consecutive blank lines to 2
  result = result.replace(/\n{3,}/g, "\n\n");

  // 4. Sanity check: if the result is suspiciously short, fall back to baseDraft
  if (result.trim().length < 200) {
    logger.warn(
      `[generation-service] AI output too short (${result.trim().length} chars), using baseDraft`
    );
    return fallback;
  }

  return result.trim();
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
      "Formal y técnico legal. Terminología jurídica precisa del derecho argentino. Cláusulas técnicas sin ambigüedad. Voz activa e imperativa.",
    commercial_clear:
      "Comercial y claro. Lenguaje accesible para empresas y PyMEs sin sacrificar validez legal. Evitar latinismos innecesarios.",
    balanced_professional:
      "Equilibrado: profesional y riguroso, pero comprensible. Terminología jurídica correcta con definiciones cuando sea necesario.",
  };

  // Instrucciones comunes a todos los tipos — enfocadas en calidad de redacción
  const commonInstructions = [
    "El documento debe ser legalmente válido y ejecutable en la República Argentina conforme al CCCN (Ley 26.994) y normativa complementaria vigente",
    "Usar TODOS los datos concretos proporcionados: nombres completos, CUITs/DNIs, domicilios, montos, fechas — sin omitir ninguno",
    "Encabezado: ciudad y fecha completa, seguido de identificación de las partes con todos sus datos",
    "Cuerpo: cláusulas numeradas en palabras en MAYÚSCULAS (PRIMERA, SEGUNDA, TERCERA, etc.)",
    "Redactar cada cláusula con al menos dos oraciones — no usar frases telegráficas",
    "Los montos deben expresarse en números Y en letras entre paréntesis: $10.000 (pesos diez mil)",
    "Los plazos deben expresarse en forma clara: '30 (treinta) días corridos a partir de…'",
    "Usar 'las partes acuerdan', 'el contratante se obliga a', 'queda expresamente establecido que' — lenguaje declarativo",
    "Cierre: sección de FIRMAS con línea de firma (___________), nombre completo, y campos Firma / Aclaración / DNI para cada parte",
    "Formato de salida: texto plano con saltos de línea, sin markdown, sin bullets con guión ni asteriscos",
  ];

  if (documentType === "service_contract") {
    return {
      systemMessage: `Sos un abogado senior argentino con 25 años de experiencia en derecho comercial y contratos de prestación de servicios. \
Redactás contratos impecables, completos y ejecutables conforme al Código Civil y Comercial de la Nación (arts. 1251 a 1279 sobre locación de obra y servicios), \
la Ley de Defensa del Consumidor (Ley 24.240) cuando corresponda, y los usos y prácticas comerciales argentinos. \
Tu redacción es precisa, sin ambigüedades y prevé expresamente los escenarios de incumplimiento. \
Nunca dejás cláusulas abiertas ni con datos faltantes.`,
      baseInstructions: [
        ...commonInstructions,
        "Cláusulas obligatorias: OBJETO (descripción detallada del servicio), PLAZO Y VIGENCIA, PRECIO Y FORMA DE PAGO, OBLIGACIONES DE LAS PARTES, RESCISIÓN (con preaviso y penalidades), CONFIDENCIALIDAD si corresponde, PROPIEDAD INTELECTUAL si corresponde, RESPONSABILIDAD, FUERZA MAYOR, FORO Y JURISDICCIÓN",
        "En la cláusula de PRECIO: indicar monto, moneda, periodicidad, forma de pago, plazo para el pago y consecuencias de la mora",
        "En RESCISIÓN: indicar si hay penalidad por rescisión anticipada y su monto; siempre incluir preaviso mínimo",
        "FORO: 'Para todos los efectos legales emergentes del presente, las partes se someten a la jurisdicción de los Tribunales Ordinarios de [JURISDICCIÓN], renunciando a cualquier otro fuero o jurisdicción que pudiera corresponderles'",
      ],
      toneInstructions,
    };
  }

  if (documentType === "nda") {
    return {
      systemMessage: `Sos un abogado senior argentino especializado en propiedad intelectual, acuerdos de confidencialidad y derecho tecnológico. \
Redactás NDAs sólidos y ejecutables conforme al CCCN (arts. 1063, 1067 sobre interpretación contractual) y la Ley de Confidencialidad (Ley 24.766). \
Tus acuerdos definen con precisión qué es información confidencial, qué no lo es, y prevén mecanismos de reparación ante incumplimiento. \
Nunca dejás definiciones abiertas que puedan ser interpretadas en contra de la parte reveladora.`,
      baseInstructions: [
        ...commonInstructions,
        "Cláusulas obligatorias: DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL (amplia y ejemplificativa), EXCLUSIONES (información pública, conocida previamente, etc.), FINALIDAD PERMITIDA, OBLIGACIONES DEL RECEPTOR, PLAZO DE VIGENCIA, DEVOLUCIÓN O DESTRUCCIÓN si corresponde, INCUMPLIMIENTO Y PENALIDADES, FORO Y JURISDICCIÓN",
        "Definición de confidencial: incluir explícitamente datos técnicos, comerciales, financieros, clientes, procesos, software, know-how",
        "Exclusiones clásicas: información de dominio público, información conocida antes del acuerdo, información obtenida de terceros lícitamente",
        "Penalidad: 'El incumplimiento de las obligaciones de confidencialidad dará derecho a [REVELADOR] a reclamar los daños y perjuicios sufridos, sin perjuicio de las acciones penales que pudieran corresponder'",
      ],
      toneInstructions,
    };
  }

  if (documentType === "legal_notice") {
    return {
      systemMessage: `Sos un abogado senior argentino especializado en cartas documento, telegramas colacionados y notificaciones fehacientes. \
Redactás cartas documento CERRADAS, DEFINITIVAS y LISTAS PARA ENVIAR — con absolutamente todos los datos completos, \
sin espacios en blanco, sin placeholders, sin campos por completar. \
Conocés el art. 1078 del CCCN sobre notificaciones, el CPCyC y la doctrina sobre efectos de la mora. \
Tu redacción es directa, cronológica y contundente. Cada carta documento que redactás puede enviarse inmediatamente sin modificación alguna.`,
      baseInstructions: [
        "El documento debe ser legalmente válido y ejecutable en la República Argentina",
        "Usar TODOS los datos concretos: nombres, CUITs, domicilios, montos exactos, fechas precisas",
        "Estructura: ciudad y fecha / identificación de remitente / identificación de destinatario / título CARTA DOCUMENTO / cuerpo numerado / cierre y firma",
        "Cuerpo: sección I — Antecedentes (relación previa entre las partes), II — Hechos (descripción cronológica y objetiva), III — Incumplimiento (descripción precisa del incumplimiento), IV — Intimación (qué debe hacer, plazo exacto, domicilio donde cumplir), V — Apercibimiento (consecuencias concretas: acciones judiciales, daños y perjuicios, intereses)",
        "El plazo de intimación debe expresarse en días hábiles o corridos según corresponda, con fecha exacta de vencimiento si es posible",
        "Apercibimiento concreto: 'en caso de no cumplimiento, iniciaremos las acciones judiciales que correspondan, reclamando daños y perjuicios, intereses y costas'",
        "NO incluir cláusulas contractuales, foro de competencia ni elementos ajenos al formato de carta documento",
        "Cierre: 'Sin otro particular, saludo a Ud. atentamente.' + espacio para firma + nombre del remitente",
        "El documento es definitivo — absolutamente todos los campos completos con datos reales",
      ],
      toneInstructions,
    };
  }

  if (documentType === "lease") {
    return {
      systemMessage: `Sos un abogado senior argentino especializado en locaciones urbanas y la normativa de alquileres vigente. \
Conocés en profundidad el CCCN (arts. 1187 a 1226 sobre locación), la Ley de Alquileres (Ley 27.551 y sus modificatorias), \
el Decreto 320/2020 y la jurisprudencia relevante. \
Redactás contratos de locación que protegen adecuadamente a ambas partes, con cláusulas claras sobre el canon, \
ajustes, depósito, obligaciones de mantenimiento y condiciones de rescisión. \
Nunca omitís el plazo mínimo legal ni las obligaciones de restitución del inmueble.`,
      baseInstructions: [
        ...commonInstructions,
        "Cláusulas obligatorias: OBJETO (descripción detallada del inmueble con dirección completa), DESTINO (uso exclusivo habitacional/comercial), PLAZO (con fecha de inicio y vencimiento, respetando mínimo legal de 3 años para habitacional), CANON (monto, moneda, periodicidad, día de pago, lugar de pago), AJUSTE DEL CANON (índice aplicable conforme normativa vigente), DEPÓSITO DE GARANTÍA si corresponde, OBLIGACIONES DEL LOCADOR, OBLIGACIONES DEL LOCATARIO, ESTADO DEL INMUEBLE, SERVICIOS Y EXPENSAS, MEJORAS, RESCISIÓN ANTICIPADA, FORO Y JURISDICCIÓN",
        "Plazo: para uso habitacional mínimo 3 (tres) años conforme Ley 27.551; indicar fecha exacta de inicio y vencimiento",
        "Ajuste: aplicar el Índice para Contratos de Locación (ICL) del BCRA conforme Ley 27.551 para contratos habitacionales",
        "Depósito: 'equivalente a un (1) mes de alquiler al valor del último mes, el que será devuelto al locatario dentro de los 30 días de restituido el inmueble'",
        "Restitución: 'El locatario deberá restituir el inmueble en el mismo estado en que lo recibió, salvo el deterioro proveniente del uso normal y del tiempo transcurrido'",
      ],
      toneInstructions,
    };
  }

  if (documentType === "debt_recognition") {
    return {
      systemMessage: `Sos un abogado senior argentino especializado en derecho de las obligaciones, títulos valores y reconocimiento de deuda. \
Conocés el CCCN (arts. 723 a 726 sobre reconocimiento de obligación, arts. 730 a 760 sobre efectos), \
la doctrina sobre la inversión de la carga de la prueba que genera el reconocimiento, \
y los efectos interruptivos de la prescripción (art. 2545 CCCN). \
Redactás instrumentos de reconocimiento de deuda precisos, con monto en letras y números, \
plan de pago detallado con fechas exactas, y cláusula de aceleración cuando corresponde.`,
      baseInstructions: [
        ...commonInstructions,
        "Cláusulas obligatorias: RECONOCIMIENTO (declaración expresa de reconocer la deuda con su causa y origen), MONTO (en números Y en letras, con moneda), FORMA DE PAGO (cuotas con fechas exactas de vencimiento O pago único con fecha), INTERESES (tasa aplicable si corresponde, desde cuándo corren), MORA (automática por el solo vencimiento del plazo, sin necesidad de interpelación), ACELERACIÓN (si se incumple una cuota se hacen exigibles todas las restantes), GASTOS Y COSTAS, FORO Y JURISDICCIÓN",
        "Monto siempre en letras: '$15.000 (pesos quince mil)'",
        "Mora automática: 'La mora se producirá en forma automática por el solo vencimiento del plazo, sin necesidad de interpelación judicial ni extrajudicial previa (art. 886 CCCN)'",
        "Intereses moratorios: especificar tasa (ej: 'tasa activa del Banco de la Nación Argentina') desde la fecha de mora",
        "Aceleración: 'El incumplimiento de dos (2) cuotas consecutivas o alternadas hará exigible la totalidad del saldo adeudado en forma inmediata'",
        "Cerrar con FIRMA del deudor únicamente (es quien reconoce la deuda); el acreedor puede firmar como receptor",
      ],
      toneInstructions,
    };
  }

  if (documentType === "simple_authorization") {
    return {
      systemMessage: `Sos un abogado senior argentino especializado en actos jurídicos de representación, mandato y autorización. \
Conocés el CCCN (arts. 358 a 381 sobre representación, arts. 1319 a 1334 sobre mandato) \
y la importancia de delimitar con precisión el alcance del acto autorizado para evitar interpretaciones amplias no deseadas. \
Redactás autorizaciones específicas, concretas y acotadas al acto indicado. \
Nunca dejás el alcance abierto ni usás términos ambiguos que puedan dar poderes no queridos por el autorizante.`,
      baseInstructions: [
        ...commonInstructions,
        "Cláusulas obligatorias: IDENTIFICACIÓN DEL AUTORIZANTE (datos completos), IDENTIFICACIÓN DEL AUTORIZADO (datos completos), OBJETO DE LA AUTORIZACIÓN (descripción precisa y acotada del acto o trámite), ALCANCE Y LIMITACIONES (qué puede y qué no puede hacer el autorizado), VIGENCIA (fecha de inicio y fin, o 'por acto único'), REVOCACIÓN (el autorizante puede revocar en cualquier momento)",
        "Objeto: describir el trámite con precisión — 'queda autorizado exclusivamente para [ACTO CONCRETO], sin facultad para realizar actos distintos al indicado'",
        "Vigencia: si es por acto único, indicar 'La presente autorización se extingue automáticamente una vez realizado el acto para el que fue otorgada'",
        "Limitación expresa: 'El autorizado no podrá delegar ni transferir las facultades aquí otorgadas a terceros'",
        "Revocación: 'La presente autorización podrá ser revocada por el autorizante en cualquier momento mediante notificación fehaciente al autorizado'",
        "Cerrar solo con FIRMA del autorizante (quien otorga el poder)",
      ],
      toneInstructions,
    };
  }

  // Fallback genérico
  return {
    systemMessage: `Sos un abogado senior argentino con 25 años de experiencia en derecho civil y comercial. \
Redactás documentos legales válidos, completos y ejecutables conforme al Código Civil y Comercial de la Nación \
y la normativa argentina vigente. Tu redacción es precisa, sin ambigüedades y sin campos incompletos.`,
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
