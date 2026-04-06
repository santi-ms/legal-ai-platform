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
import { isTemplatedDocumentType } from "../domain/document-types.js";
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
import { prisma } from "../../../db.js";

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

  // Route free-form types (anything without a template) to the generic AI path
  if (!isTemplatedDocumentType(documentType) || documentType === "supply_contract") {
    logger.info(`[generation-service] Free-form generation for type: ${documentType}`);
    return generateFreeFormDocument(documentType, data, tone, referenceText);
  }

  // 1. Get template
  const template = getTemplate(documentType);
  if (!template) {
    // Fallback to free-form if template is somehow missing
    logger.warn(`[generation-service] Template not found for ${documentType}, falling back to free-form`);
    return generateFreeFormDocument(documentType, data, tone, referenceText);
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
  const promptConfig = await getPromptConfigForType(documentType, tone);
  let aiEnhancedDraft: string;
  let aiTokens: { prompt: number; completion: number } | undefined;

  let aiUsed = false;

  try {
    const enhancedResult = await enhanceDraftWithAIWrapper(
      baseDraft,
      documentType,
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
// Free-form document generation (any document type without a template)
// ---------------------------------------------------------------------------

/**
 * Generates any legal document type using pure AI — no template or clause system.
 * Used for document types outside the 6 hardcoded ones (e.g. comodato, poder especial,
 * contrato de franquicia, acta de directorio, convenio de honorarios, etc.)
 */
async function generateFreeFormDocument(
  documentType: string,
  data: StructuredDocumentData,
  tone: string,
  referenceText?: string | null
): Promise<DocumentGenerationResult> {
  const jurisdiccionTexto = formatJurisdictionText(String(data.jurisdiccion || ""));
  const context = buildGenericContextForAI(data, documentType);

  const referenceSection = referenceText
    ? `\nDOCUMENTO DE REFERENCIA (usarlo como modelo de formato y estilo, completar con los datos reales):
<reference_document>
${referenceText.substring(0, 3000)}
</reference_document>\n`
    : "";

  const systemMessage = `Sos un abogado senior argentino con más de 25 años de experiencia en todas las ramas del derecho civil, comercial, laboral y administrativo. \
Conocés en profundidad el Código Civil y Comercial de la Nación (Ley 26.994 y modificatorias), \
la Ley de Sociedades Comerciales (Ley 19.550), el Código de Comercio, la Ley de Contrato de Trabajo (Ley 20.744), \
y toda la normativa argentina vigente. \
Redactás cualquier tipo de documento legal — contratos, poderes, actas, convenios, autorizaciones, \
instrumentos privados y públicos — con precisión, completitud y ejecutabilidad. \
Tu redacción nunca deja campos vacíos, nunca usa placeholders y siempre prevé los escenarios de incumplimiento. \
Usás el estilo jurídico argentino clásico: texto corrido con conceptos en MAYÚSCULAS al inicio de cada párrafo.`;

  const userPrompt = `Generá el siguiente documento legal completo y ejecutable:

TIPO DE DOCUMENTO: ${documentType}
JURISDICCIÓN: ${jurisdiccionTexto}
${referenceSection}
DATOS PROPORCIONADOS:
---
${context}
---

INSTRUCCIONES DE REDACCIÓN:
- Documento legalmente válido y ejecutable conforme al CCCN (Ley 26.994) y normativa argentina vigente
- Usar TODOS los datos proporcionados: nombres, DNIs/CUITs, domicilios, montos, fechas — sin omitir ninguno
- ESTILO: texto corrido al estilo jurídico argentino clásico. Sin cláusulas numeradas ni encabezados separados. \
El documento fluye en párrafos continuos. Cada párrafo comienza con el concepto en MAYÚSCULAS seguido de dos puntos: \
'OBJETO: Por el presente instrumento...' / 'PLAZO: El presente contrato tendrá...'
- Encabezado: ciudad y fecha completa en la primera línea, luego título del documento en MAYÚSCULAS, luego identificación de las partes
- Incluir TODAS las cláusulas necesarias para que el documento sea completo: objeto, plazo, precio/contraprestación si aplica, \
obligaciones de las partes, rescisión/resolución, mora, jurisdicción y foro
- Los montos en números Y letras: '$50.000 (pesos cincuenta mil)'
- Los plazos en forma clara: '30 (treinta) días corridos a partir de...'
- Cierre: 'En prueba de conformidad, las partes firman...' + líneas de firma para cada parte
- Formato: texto plano. Separar cada párrafo/sección con una línea de guiones '----------' (diez guiones). NO usar líneas en blanco — solo el separador de guiones. Sin markdown, sin bullets
- El documento es definitivo — absolutamente todos los campos completos, listo para firmar
- NO dejés placeholders como [COMPLETAR], [INDICAR], {{VARIABLE}}
- NO incluyas explicaciones ni meta-texto — solo el documento`;

  let generatedText = "";
  let aiTokens: { prompt: number; completion: number } | undefined;
  let aiUsed = false;
  const warnings: DocumentGenerationResult["warnings"] = [];

  if (process.env.SKIP_AI_ENHANCEMENT !== "true") {
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: systemMessage,
        messages: [{ role: "user", content: userPrompt }],
      });
      const rawText = (message.content[0] as any)?.text?.trim() ?? "";
      aiTokens = {
        prompt: message.usage?.input_tokens ?? 0,
        completion: message.usage?.output_tokens ?? 0,
      };
      generatedText = sanitizeAiOutput(rawText, context);
      aiUsed = true;
    } catch (error) {
      logger.error(`[generation-service] Free-form AI error: ${error}`);
      warnings.push({
        id: "ai_generation_failed",
        ruleId: "ai_generation_failed",
        message: "La generación automática con IA no pudo completarse. Intentá de nuevo.",
        severity: "error",
      });
      generatedText = context; // Fallback to raw context
    }
  } else {
    generatedText = context;
  }

  const metadata: GenerationMetadata = {
    documentType,
    templateVersion: "freeform-1.0",
    generationTimestamp: new Date().toISOString(),
    aiModel: aiUsed ? "claude-sonnet-4-6" : "fallback",
    aiTokens,
  };

  // Return in the same shape as the templated path
  return {
    structuredData: data,
    clausePlan: { required: [], optional: [], order: [], metadata: {} },
    baseDraft: context,
    aiEnhancedDraft: generatedText,
    warnings,
    metadata,
  };
}

/**
 * Builds a generic context string from any data object.
 * Used for free-form document generation when no type-specific mapping exists.
 */
function buildGenericContextForAI(data: StructuredDocumentData, documentType: string): string {
  const lines: string[] = [];
  lines.push(`Tipo de documento: ${documentType}`);
  if (data.jurisdiccion) lines.push(`Jurisdicción: ${formatJurisdictionText(String(data.jurisdiccion))}`);
  if (data.tono) lines.push(`Tono: ${data.tono}`);
  lines.push("");

  // Known field labels for readability
  const fieldLabels: Record<string, string> = {
    parte_a_nombre: "Parte A (nombre)",
    parte_a_doc: "Parte A (DNI/CUIT)",
    parte_a_domicilio: "Parte A (domicilio)",
    parte_b_nombre: "Parte B (nombre)",
    parte_b_doc: "Parte B (DNI/CUIT)",
    parte_b_domicilio: "Parte B (domicilio)",
    descripcion_documento: "Descripción / objeto del documento",
    descripcion_adicional: "Descripción adicional",
    monto: "Monto",
    moneda: "Moneda",
    fecha_inicio: "Fecha de inicio",
    fecha_fin: "Fecha de fin / vencimiento",
    duracion_meses: "Duración (meses)",
    plazo: "Plazo",
    observaciones: "Observaciones / cláusulas adicionales",
    additionalClauses: "Cláusulas adicionales solicitadas",
  };

  const skipKeys = new Set(["documentType", "jurisdiccion", "tono", "jurisdiction"]);

  for (const [key, value] of Object.entries(data)) {
    if (skipKeys.has(key)) continue;
    if (value === null || value === undefined || String(value).trim() === "") continue;
    const label = fieldLabels[key] ?? key.replace(/_/g, " ");
    lines.push(`${label}: ${value}`);
  }

  return lines.join("\n");
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
    add("CBU / Alias para pago (si aplica)", data.cbu_remitente);
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
    add("Meses de depósito de garantía", data.deposito_meses ?? 1);
    add("Servicios a cargo del locatario", data.servicios_cargo_locatario);
    add("Preaviso para rescisión (días)", data.preaviso_rescision);
    add("Usuarios adicionales del inmueble", data.usuarios_inmueble);

    if (data.fiador_nombre) {
      section("Fiador / Garante");
      add("Nombre del fiador", data.fiador_nombre);
      add("DNI/CUIT del fiador", data.fiador_doc);
      add("Domicilio del fiador", data.fiador_domicilio);
    }

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
  promptConfig: {
    systemMessage: string;
    baseInstructions: string[];
  },
  data: StructuredDocumentData,
  referenceText?: string | null
): Promise<{ text: string; tokens: { prompt: number; completion: number } }> {
  // Allow tests to skip the AI call and receive the assembled baseDraft directly.
  // Set SKIP_AI_ENHANCEMENT=true when starting the server in test/CI mode.
  if (process.env.SKIP_AI_ENHANCEMENT === "true") {
    return { text: baseDraft, tokens: { prompt: 0, completion: 0 } };
  }

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
 * Queries the DocumentPrompt table first; falls back to hardcoded config if not found.
 */
async function getPromptConfigForType(
  documentType: DocumentTypeId,
  _tone: string
): Promise<{
  systemMessage: string;
  baseInstructions: string[];
}> {
  // Try to load from DB first
  try {
    const dbPrompt = await prisma.documentPrompt.findUnique({
      where: { documentType: documentType as string },
    });
    if (dbPrompt && dbPrompt.isActive) {
      logger.info(`[generation-service] Using DB prompt for: ${documentType}`);
      return {
        systemMessage: dbPrompt.systemMessage,
        baseInstructions: dbPrompt.baseInstructions as string[],
      };
    }
  } catch (err) {
    logger.warn(`[generation-service] Could not load DB prompt for ${documentType}, using hardcoded: ${err}`);
  }

  return getHardcodedPromptConfig(documentType);
}

/**
 * Hardcoded fallback prompt configuration per document type.
 */
function getHardcodedPromptConfig(
  documentType: DocumentTypeId
): {
  systemMessage: string;
  baseInstructions: string[];
} {

  // Instrucciones comunes a todos los tipos — enfocadas en calidad de redacción
  const commonInstructions = [
    "El documento debe ser legalmente válido y ejecutable en la República Argentina conforme al CCCN (Ley 26.994) y normativa complementaria vigente",
    "Usar TODOS los datos concretos proporcionados: nombres completos, CUITs/DNIs, domicilios, montos, fechas — sin omitir ninguno",
    "ESTILO DE REDACCIÓN: texto corrido al estilo jurídico argentino clásico, como redactan los estudios de abogados y escribanos. Sin cláusulas numeradas ni encabezados de sección separados. El documento fluye en párrafos continuos separados por saltos de línea. Cada párrafo desarrolla un tema (objeto, plazo, precio, obligaciones, etc.) comenzando con el concepto en MAYÚSCULAS seguido de dos puntos, integrado naturalmente en el texto: por ejemplo 'OBJETO: Por el presente instrumento las partes acuerdan...' o 'PLAZO: El presente contrato tendrá una duración de...'",
    "Encabezado: ciudad y fecha completa en la primera línea, luego título del documento centrado en MAYÚSCULAS, luego identificación completa de las partes con todos sus datos",
    "Los montos deben expresarse en números Y en letras entre paréntesis: $590.000 (pesos quinientos noventa mil)",
    "Los plazos deben expresarse en forma clara: '30 (treinta) días corridos a partir de…'",
    "Usar lenguaje declarativo y fluido: 'las partes acuerdan', 'el locatario se obliga a', 'queda expresamente establecido que', 'en prueba de conformidad'",
    "Cierre: párrafo de conformidad ('En prueba de conformidad, las partes firman...'), luego espacio para firmas con línea (___________), nombre completo y aclaración para cada parte",
    "Formato de salida: texto plano. Separar cada párrafo/sección con una línea de guiones '----------' (diez guiones exactos). NO usar líneas en blanco entre párrafos — solo el separador de guiones. Sin markdown, sin bullets, sin numeración de cláusulas separadas",
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
        "Párrafos obligatorios: OBJETO (descripción detallada del servicio), PLAZO Y VIGENCIA, PRECIO Y FORMA DE PAGO, OBLIGACIONES DE LAS PARTES, RESCISIÓN (con preaviso y penalidades), CONFIDENCIALIDAD si corresponde, PROPIEDAD INTELECTUAL si corresponde, RESPONSABILIDAD, FUERZA MAYOR, FORO Y JURISDICCIÓN",
        "En el párrafo de PRECIO: indicar monto, moneda, periodicidad, forma de pago, plazo para el pago y consecuencias de la mora",
        "En RESCISIÓN: indicar si hay penalidad por rescisión anticipada y su monto; siempre incluir preaviso mínimo",
        "FORO: 'Para todos los efectos legales emergentes del presente instrumento, las partes se someten a la jurisdicción de los Tribunales Ordinarios de [JURISDICCIÓN], renunciando expresamente a cualquier otro fuero o jurisdicción que pudiera corresponderles'",
      ],
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
        "Párrafos obligatorios: DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL (amplia y ejemplificativa), EXCLUSIONES (información pública, conocida previamente, etc.), FINALIDAD PERMITIDA, OBLIGACIONES DEL RECEPTOR, PLAZO DE VIGENCIA, DEVOLUCIÓN O DESTRUCCIÓN si corresponde, INCUMPLIMIENTO Y PENALIDADES, FORO Y JURISDICCIÓN",
        "Definición de confidencial: incluir explícitamente datos técnicos, comerciales, financieros, clientes, procesos, software, know-how",
        "Exclusiones clásicas: información de dominio público, información conocida antes del acuerdo, información obtenida de terceros lícitamente",
        "Penalidad: 'El incumplimiento de las obligaciones de confidencialidad dará derecho a [REVELADOR] a reclamar los daños y perjuicios sufridos, sin perjuicio de las acciones penales que pudieran corresponder'",
      ],
    };
  }

  if (documentType === "legal_notice") {
    return {
      systemMessage: `Sos un abogado argentino que redacta cartas documento breves, directas y fehacientes, listas para envío postal inmediato. \
Tu objetivo es máxima claridad y mínima extensión. No escribís mini-escritos judiciales: escribís notificaciones operativas. \
El texto debe ser CERRADO, DEFINITIVO, sin placeholders ni campos vacíos. \
Priorizás concisión, claridad y aptitud postal sobre el lucimiento jurídico.`,
      baseInstructions: [
        "ESTRUCTURA OBLIGATORIA — en este orden exacto, sin títulos de sección ni numeración romana:",
        "  1. Línea de ciudad y fecha (ej: 'Buenos Aires, 6 de abril de 2026')",
        "  2. Bloque REMITENTE: nombre completo, DNI/CUIT, domicilio — en una sola línea compacta",
        "  3. Bloque DESTINATARIO: nombre completo, DNI/CUIT, domicilio — en una sola línea compacta",
        "  4. Título centrado: CARTA DOCUMENTO",
        "  5. Cuerpo en texto corrido, SIN secciones ni encabezados romanos — máximo 3 párrafos:",
        "     Párrafo 1 — Contexto mínimo: una oración que identifique la relación y el origen de la deuda u obligación. Sin relato de hechos extenso.",
        "     Párrafo 2 — El reclamo central: qué se debe / qué debe cumplir, monto exacto (números y letras), concepto, fecha de vencimiento, medio de pago si aplica. Directo al punto.",
        "     Párrafo 3 — Intimación y consecuencia: intimar en el plazo indicado (usar el plazo provisto; si no se proveyó, usar 5 días hábiles). Apercibimiento de acciones judiciales, intereses y costas. SIN amenaza penal salvo que los datos del caso lo justifiquen explícitamente.",
        "  6. Cierre: 'Sin otro particular, saludo a Ud. atentamente.' + nombre del remitente",
        "NO citar artículos del CCCN ni otros cuerpos normativos salvo que el caso lo requiera expresamente",
        "NO repetir nombres, CUITs ni domicilios más de una vez en el cuerpo",
        "NO usar frases grandilocuentes: evitar 'grave e injustificado', 'causa fuente de la presente intimación', 'con todos los efectos jurídicos que ello acarrea', 'de inmediato'",
        "Intereses: si se reclama deuda dineraria, usar 'más los intereses que correspondan desde la fecha de vencimiento' — no especificar tasa salvo que el usuario la haya indicado",
        "El documento es definitivo — todos los campos completos con datos reales, sin placeholders",
      ],
    };
  }

  if (documentType === "lease") {
    return {
      systemMessage: `Sos un abogado senior argentino especializado en locaciones urbanas con dominio absoluto de la normativa vigente. \
Conocés en profundidad el CCCN (arts. 1187 a 1226 sobre locación), la Ley de Alquileres N° 27.551 y sus modificatorias, \
y el Decreto de Necesidad y Urgencia N° 70/2023 que modificó los arts. 1196, 1199, 1209 y 1219 del CCCN — \
estableciendo el plazo mínimo en DOS (2) años para locaciones con destino habitacional, \
permitiendo ajustes semestrales por índice ICL u otros pactados, \
y habilitando la resolución del contrato ante UN (1) mes de impago. \
Redactás contratos de locación exhaustivos, equilibrados y ejecutables, con cláusulas claras sobre el canon, \
ajustes, mora, depósito, obligaciones de las partes, restricciones de uso, fiador, \
penalidades por no restitución y condiciones de rescisión anticipada. \
Nunca omitís datos provistos, nunca dejás campos vacíos, nunca contradecís el DNU 70/2023.`,
      baseInstructions: [
        ...commonInstructions,
        "Párrafos obligatorios: OBJETO (descripción del inmueble con dirección exacta y destino de uso), PLAZO (fecha de inicio y vencimiento, mínimo 2 años para habitacional per DNU 70/2023), CANON (monto en números y letras, día de pago, forma de pago), AJUSTE DEL CANON (ICL semestral conforme DNU 70/2023 o índice pactado), MORA (interés punitorio del 2% diario por el solo vencimiento — sin interpelación), DEPÓSITO DE GARANTÍA (monto exacto, condiciones de devolución en 30 días hábiles), OBLIGACIONES DEL LOCATARIO (mantenimiento, uso, prohibición de mascotas, inspecciones con 48hs de anticipación, sin lavarropas en habitaciones ni aires de pared sin permiso escrito), RESCISIÓN ANTICIPADA (10% del saldo restante o sin indemnización con 3+ meses de preaviso en el último año, art. 1221 CCCN), CAUSALES DE RESOLUCIÓN (1 mes de impago per DNU 70/2023, previa intimación de 15 días), PENALIDAD POR NO RESTITUCIÓN (10% del canon diario hasta entrega efectiva), FIADOR si corresponde (principal pagador con renuncia a excusión y división), JURISDICCIÓN Y FORO",
        "Plazo: mínimo DOS (2) años para uso habitacional conforme DNU 70/2023 (no 3 años — ese plazo quedó derogado); indicar fecha exacta de inicio y vencimiento",
        "Canon: expresar siempre en números Y en letras entre paréntesis: '$590.000 (pesos quinientos noventa mil)'",
        "Ajuste del canon: 'El canon locativo se ajustará cada SEIS (6) meses de acuerdo con la variación del Índice para Contratos de Locación (ICL) elaborado por el Banco Central de la República Argentina (BCRA), conforme lo establecido por el DNU N° 70/2023'",
        "Mora: 'La mora en el pago del canon se producirá automáticamente por el solo vencimiento del plazo pactado, sin necesidad de interpelación judicial ni extrajudicial alguna (art. 886 CCCN), devengando un interés punitorio del DOS POR CIENTO (2%) diario sobre el monto adeudado'",
        "Depósito: especificar monto exacto en pesos y condiciones: 'será devuelto dentro de los 30 días hábiles de restituido el inmueble en las condiciones pactadas, pudiendo el LOCADOR retener el importe correspondiente a los daños constatados'",
        "Fiador: si se proveen datos de fiador, incluir cláusula completa de fianza — 'fiador, liso, llano y principal pagador, con renuncia expresa a los beneficios de excusión y división' — con datos completos del fiador y línea de firma al pie",
        "No restituir al vencimiento: 'el LOCATARIO abonará en concepto de daños preestablecidos el DIEZ POR CIENTO (10%) del canon mensual vigente por cada día de demora en la restitución, sin perjuicio de las demás acciones legales que asisten al LOCADOR'",
        "Restitución: 'El LOCATARIO deberá restituir el inmueble en el mismo estado en que lo recibió, salvo el deterioro proveniente del uso normal y del tiempo transcurrido, con todos los servicios al día'",
        "Cierre: líneas de firma para LOCADOR y LOCATARIO; si hay FIADOR, agregar su línea de firma separada con aclaración 'Fiador — Firma y aclaración'",
      ],
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
        "Párrafos obligatorios: RECONOCIMIENTO (declaración expresa de reconocer la deuda con su causa y origen), MONTO (en números Y en letras, con moneda), FORMA DE PAGO (cuotas con fechas exactas de vencimiento O pago único con fecha), INTERESES (tasa aplicable si corresponde, desde cuándo corren), MORA (automática por el solo vencimiento del plazo, sin necesidad de interpelación), ACELERACIÓN (si se incumple una cuota se hacen exigibles todas las restantes), GASTOS Y COSTAS, FORO Y JURISDICCIÓN",
        "Monto siempre en letras: '$15.000 (pesos quince mil)'",
        "Mora automática: 'La mora se producirá en forma automática por el solo vencimiento del plazo, sin necesidad de interpelación judicial ni extrajudicial previa (art. 886 CCCN)'",
        "Intereses moratorios: especificar tasa (ej: 'tasa activa del Banco de la Nación Argentina') desde la fecha de mora",
        "Aceleración: 'El incumplimiento de dos (2) cuotas consecutivas o alternadas hará exigible la totalidad del saldo adeudado en forma inmediata'",
        "Cerrar con FIRMA del deudor únicamente (es quien reconoce la deuda); el acreedor puede firmar como receptor",
      ],
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
        "Párrafos obligatorios: IDENTIFICACIÓN DEL AUTORIZANTE (datos completos), IDENTIFICACIÓN DEL AUTORIZADO (datos completos), OBJETO DE LA AUTORIZACIÓN (descripción precisa y acotada del acto o trámite), ALCANCE Y LIMITACIONES (qué puede y qué no puede hacer el autorizado), VIGENCIA (fecha de inicio y fin, o 'por acto único'), REVOCACIÓN (el autorizante puede revocar en cualquier momento)",
        "Objeto: describir el trámite con precisión — 'queda autorizado exclusivamente para [ACTO CONCRETO], sin facultad para realizar actos distintos al indicado'",
        "Vigencia: si es por acto único, indicar 'La presente autorización se extingue automáticamente una vez realizado el acto para el que fue otorgada'",
        "Limitación expresa: 'El autorizado no podrá delegar ni transferir las facultades aquí otorgadas a terceros'",
        "Revocación: 'La presente autorización podrá ser revocada por el autorizante en cualquier momento mediante notificación fehaciente al autorizado'",
        "Cerrar solo con FIRMA del autorizante (quien otorga el poder)",
      ],
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
