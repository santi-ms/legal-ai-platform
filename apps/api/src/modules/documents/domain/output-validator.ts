/**
 * Output Validator
 *
 * Post-generation validation of AI-generated document text.
 * Runs AFTER AI enhancement and BEFORE PDF generation / DB save.
 *
 * Responsibilities:
 * - Detect unreplaced placeholders ([indicar], {{VARIABLE}}, etc.)
 * - Detect meta-instructions that should have been removed
 * - Detect structural completeness issues
 * - Provide clear, actionable issue codes for the frontend to display
 *
 * NOT in scope here (handled by validation-engine.ts):
 * - Input/form field validation (runs before generation)
 * - Semantic business rules on form data
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OutputValidationIssue {
  /** Stable code for programmatic handling on the frontend */
  code: string;
  /** Human-readable Spanish description shown to the user */
  message: string;
  /** The actual text fragment that triggered the rule, if applicable */
  match?: string;
  severity: "error" | "warning";
}

export interface OutputValidationResult {
  /** false if ANY issue with severity "error" was found */
  valid: boolean;
  issues: OutputValidationIssue[];
}

// ---------------------------------------------------------------------------
// Pattern rules
// ---------------------------------------------------------------------------

interface PatternRule {
  code: string;
  pattern: RegExp;
  message: (match: string) => string;
  severity: "error" | "warning";
}

/**
 * Universal patterns — applied to every document type.
 *
 * Severity guide:
 *   "error"   → document is legally incomplete, PDF must not be generated
 *   "warning" → suspicious but not necessarily blocking (depends on context)
 */
const UNIVERSAL_PATTERNS: PatternRule[] = [
  // -------------------------------------------------------------------------
  // Square-bracket placeholders — the most common case
  // Examples: [indicar monto], [nombre del contratante], [fecha], [_____]
  // -------------------------------------------------------------------------
  {
    code: "PLACEHOLDER_BRACKET",
    pattern: /\[[^\]]{1,120}\]/g,
    message: (match) => `Placeholder sin completar detectado: "${match}"`,
    severity: "error",
  },

  // -------------------------------------------------------------------------
  // Unreplaced template variables ({{VAR}} not substituted by the engine)
  // These should never survive assembleBaseDraft(), but guard anyway.
  // -------------------------------------------------------------------------
  {
    code: "TEMPLATE_VARIABLE",
    pattern: /\{\{[A-Z_]{2,50}\}\}/g,
    message: (match) => `Variable de plantilla no reemplazada: "${match}"`,
    severity: "error",
  },

  // -------------------------------------------------------------------------
  // Meta-instruction verbs in Spanish — words the AI was told to act on
  // but left in the output literally.
  // Only matches when surrounded by common placeholder delimiters or
  // at the start of a parenthetical, to avoid false positives on narrative text.
  // -------------------------------------------------------------------------
  {
    code: "PLACEHOLDER_WORD_ES",
    pattern: /\b(indicar|indicá|describir|describí|especificar|especificá|completar|completá|incluir aquí|agregar aquí|insertar aquí|redactar aquí|detallar aquí)\b/gi,
    message: (match) =>
      `Instrucción meta sin resolver en el texto: "${match}". El documento contiene una instrucción que debería haberse completado.`,
    severity: "error",
  },

  // -------------------------------------------------------------------------
  // English placeholder language — guard against AI responses that slip
  // into English despite instructions
  // -------------------------------------------------------------------------
  {
    code: "PLACEHOLDER_WORD_EN",
    pattern: /\b(placeholder|insert here|add here|fill in|to be (determined|completed|defined)|n\/a|tbd)\b/gi,
    message: (match) => `Texto en inglés sin resolver: "${match}"`,
    severity: "error",
  },

  // -------------------------------------------------------------------------
  // Fill-in-blank underscores (5 or more consecutive underscores)
  // Distinguish from signature lines: signature lines typically appear on their
  // own line and are 20+ chars; short ____ runs are likely placeholders.
  // -------------------------------------------------------------------------
  {
    code: "BLANK_UNDERSCORES",
    pattern: /(?<!^_{20,})\b_{5,19}\b/gm,
    message: (_match) =>
      "Espacio en blanco para completar manualmente (____). El documento tiene campos sin rellenar.",
    severity: "warning",
  },

  // -------------------------------------------------------------------------
  // Instruction-style parentheticals
  // Examples: (indicar el monto), (describir el servicio aquí)
  // -------------------------------------------------------------------------
  {
    code: "PAREN_INSTRUCTION",
    pattern: /\((indicar|describir|especificar|completar|agregar|insertar|detallar)[^)]{0,80}\)/gi,
    message: (match) =>
      `Instrucción entre paréntesis sin completar: "${match}"`,
    severity: "error",
  },

  // -------------------------------------------------------------------------
  // Truncated content indicator (4+ dots not part of normal ellipsis)
  // Example: "El monto es de $......." or "Cláusula ....................."
  // -------------------------------------------------------------------------
  {
    code: "TRUNCATED_DOTS",
    pattern: /\.{4,}/g,
    message: (_match) =>
      "Contenido aparentemente truncado (.....). Revisar si hay secciones incompletas.",
    severity: "warning",
  },
];

// ---------------------------------------------------------------------------
// Structural checks
// ---------------------------------------------------------------------------

function runStructuralChecks(text: string): OutputValidationIssue[] {
  const issues: OutputValidationIssue[] = [];

  // Document is too short to be a real legal document
  if (text.trim().length < 150) {
    issues.push({
      code: "DOCUMENT_TOO_SHORT",
      message: `El documento generado tiene solo ${text.trim().length} caracteres — demasiado corto para ser un documento legal válido.`,
      severity: "error",
    });
  }

  // Section header immediately followed by another header (empty section body)
  // Matches patterns like "II. HECHOS\n\nIII. INCUMPLIMIENTO" with no body
  const emptySection =
    /^([IVX]+\.|[A-Z]{3,}[:\s])[^\n]*\n{1,3}(?=[IVX]+\.|[A-Z]{3,}[:\s])/m;
  if (emptySection.test(text)) {
    issues.push({
      code: "EMPTY_SECTION",
      message:
        "Se detectó una sección sin contenido entre dos encabezados consecutivos.",
      severity: "warning",
    });
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Type-specific rule hooks (reserved for future expansion)
// ---------------------------------------------------------------------------

/**
 * Extension point for document-type-specific output validation rules.
 *
 * Future examples:
 *   legal_notice  → verify intimation section exists and contains a verb in imperative mood
 *   service_contract → verify monto/moneda are present and numeric
 *   nda → verify at least one obligation clause exists
 */
function runTypeSpecificChecks(
  text: string,
  documentType: string
): OutputValidationIssue[] {
  const issues: OutputValidationIssue[] = [];

  // ── Contrato de Locación ────────────────────────────────────────────────────
  if (documentType === "lease") {
    // Debe haber un monto de alquiler
    if (!/\$|ARS|pesos|canon|alquiler/i.test(text)) {
      issues.push({
        code: "LEASE_MISSING_AMOUNT",
        message: "El contrato de locación no parece incluir el monto del canon mensual.",
        severity: "warning",
      });
    }
    // Debe haber una dirección
    if (!/calle|av\.|avenida|pasaje|ruta|n[°º]|dirección|domicilio del inmueble/i.test(text)) {
      issues.push({
        code: "LEASE_MISSING_ADDRESS",
        message: "El contrato de locación no parece incluir la dirección del inmueble.",
        severity: "warning",
      });
    }
  }

  // ── Reconocimiento de Deuda ─────────────────────────────────────────────────
  if (documentType === "debt_recognition") {
    if (!/\$|ARS|pesos|suma|monto|importe|capital/i.test(text)) {
      issues.push({
        code: "DEBT_MISSING_AMOUNT",
        message: "El reconocimiento de deuda no parece incluir el monto reconocido. Es un elemento esencial del documento.",
        severity: "error",
      });
    }
    if (!/reconoc|adeu|debe|obliga/i.test(text)) {
      issues.push({
        code: "DEBT_MISSING_ACKNOWLEDGMENT",
        message: "El documento no parece contener la cláusula de reconocimiento explícito de la deuda.",
        severity: "error",
      });
    }
  }

  // ── Carta Documento ─────────────────────────────────────────────────────────
  if (documentType === "legal_notice") {
    if (!/intim|notific|requir|exig|apercib/i.test(text)) {
      issues.push({
        code: "LEGAL_NOTICE_MISSING_INTIMATION",
        message: "La carta documento no parece contener una sección de intimación o requerimiento formal.",
        severity: "warning",
      });
    }
    // Debe tener un plazo
    if (!/plazo|días|horas|hábiles|corridos/i.test(text)) {
      issues.push({
        code: "LEGAL_NOTICE_MISSING_DEADLINE",
        message: "La carta documento no especifica un plazo para cumplir con lo intimado.",
        severity: "warning",
      });
    }
  }

  // ── Contrato de Servicios ───────────────────────────────────────────────────
  if (documentType === "service_contract") {
    if (!/\$|ARS|pesos|honorario|precio|retribución|contraprestación/i.test(text)) {
      issues.push({
        code: "SERVICE_CONTRACT_MISSING_AMOUNT",
        message: "El contrato de servicios no parece incluir el monto o precio pactado.",
        severity: "warning",
      });
    }
  }

  // ── Acuerdo de Confidencialidad ─────────────────────────────────────────────
  if (documentType === "nda") {
    if (!/confidencial|reservad|secreto/i.test(text)) {
      issues.push({
        code: "NDA_MISSING_DEFINITION",
        message: "El NDA no parece contener la definición de información confidencial.",
        severity: "error",
      });
    }
    if (!/plazo|vigencia|duración|años|meses/i.test(text)) {
      issues.push({
        code: "NDA_MISSING_TERM",
        message: "El NDA no parece especificar el plazo de vigencia de la obligación de confidencialidad.",
        severity: "warning",
      });
    }
  }

  // ── Autorización Simple ─────────────────────────────────────────────────────
  if (documentType === "simple_authorization") {
    if (!/autoriz|faculta|permis/i.test(text)) {
      issues.push({
        code: "AUTHORIZATION_MISSING_GRANT",
        message: "La autorización no parece contener el acto de autorización propiamente dicho.",
        severity: "error",
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Main exported function
// ---------------------------------------------------------------------------

/**
 * Validates the AI-generated document text for completeness and placeholder issues.
 *
 * Call this after `generateDocumentWithNewArchitecture()` returns, and before
 * saving to DB or calling the PDF service.
 *
 * @param text         - The final generated document text (aiEnhancedDraft)
 * @param documentType - The document type ID (used for type-specific rules)
 * @returns            - Result with `valid` flag and list of issues
 */
export function validateGeneratedDocumentOutput(
  text: string,
  documentType: string
): OutputValidationResult {
  const issues: OutputValidationIssue[] = [];

  // 1. Pattern-based checks
  for (const rule of UNIVERSAL_PATTERNS) {
    const matches = text.match(rule.pattern);
    if (matches) {
      const unique = [...new Set(matches)];
      unique.forEach((match) => {
        issues.push({
          code: rule.code,
          message: rule.message(match),
          match,
          severity: rule.severity,
        });
      });
    }
  }

  // 2. Structural checks
  issues.push(...runStructuralChecks(text));

  // 3. Type-specific checks (currently a no-op, ready for expansion)
  issues.push(...runTypeSpecificChecks(text, documentType));

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    valid: !hasErrors,
    issues,
  };
}
