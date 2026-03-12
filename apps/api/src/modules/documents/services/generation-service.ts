/**
 * Document Generation Service
 * 
 * High-level service that orchestrates the complete document generation process:
 * - Validation
 * - Warning generation
 * - Clause planning
 * - Template assembly
 * - AI enhancement
 */

import OpenAI from "openai";
import type {
  DocumentTypeId,
  StructuredDocumentData,
  DocumentGenerationResult,
  GenerationWarning,
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

/**
 * Generate document using new architecture
 * 
 * @param documentType - Document type ID
 * @param data - Structured document data
 * @param tone - Document tone
 * @returns Complete generation result
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
  const baseDraft = assembleBaseDraft(template, clauses, clausePlan, data);
  
  logger.info(`[generation-service] Base draft generated (${baseDraft.length} chars)`);
  
  // 6. Enhance with AI
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

/**
 * Enhance draft with AI (wrapper with actual OpenAI call)
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
  const toneInstruction = promptConfig.toneInstructions[tone] || promptConfig.toneInstructions.commercial_clear;
  
  const systemMessage = promptConfig.systemMessage;
  const userPrompt = `Mejora y completa el siguiente borrador de ${documentType}:

${baseDraft}

INSTRUCCIONES:
${promptConfig.baseInstructions.map(i => `- ${i}`).join("\n")}

TONO: ${toneInstruction}

IMPORTANTE:
- Mantén la estructura y cláusulas del borrador
- Mejora la coherencia y fluidez del texto
- Asegura que el tono sea ${toneInstruction}
- Revisa la consistencia legal
- NO cambies los datos concretos (montos, fechas, nombres)
- Responde SOLO con el texto mejorado del documento`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1,
    });

    const text = completion.choices?.[0]?.message?.content?.trim() || baseDraft;
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

/**
 * Get prompt config for document type
 */
function getPromptConfigForType(
  documentType: DocumentTypeId,
  tone: string
): {
  systemMessage: string;
  baseInstructions: string[];
  toneInstructions: Record<string, string>;
} {
  const baseConfig = {
    systemMessage: "Eres un abogado senior argentino especializado en derecho comercial con 20 años de experiencia. Generas documentos legales válidos, profesionales y completos según la normativa argentina vigente.",
    baseInstructions: [
      "El documento debe ser legalmente válido y ejecutable en Argentina",
      "Usar los datos concretos proporcionados",
      "Incluir cláusulas obligatorias según tipo de contrato",
      "Estructura: Encabezado con datos completos, luego cláusulas numeradas",
    ],
    toneInstructions: {
      formal_technical: "Formal y técnico legal. Terminología jurídica precisa.",
      commercial_clear: "Comercial y claro. Lenguaje entendible para PyMEs sin sacrificar validez legal.",
      balanced_professional: "Balanceado: profesional pero accesible.",
    },
  };

  // Type-specific customizations
  if (documentType === "service_contract") {
    baseConfig.baseInstructions.push(
      "Incluir: identificación de partes, objeto del contrato, monto y forma de pago, vigencia, foro de competencia"
    );
  } else if (documentType === "nda") {
    baseConfig.baseInstructions.push(
      "Incluir: definición clara de información confidencial, finalidad permitida específica, obligaciones detalladas del receptor, plazo de confidencialidad, medidas de protección"
    );
  } else if (documentType === "legal_notice") {
    baseConfig.baseInstructions.push(
      "Incluir: relación previa o contexto, narración cronológica de hechos, descripción clara del incumplimiento, intimación concreta y específica, plazo para cumplir, apercibimiento con consecuencias legales"
    );
  }

  return baseConfig;
}

