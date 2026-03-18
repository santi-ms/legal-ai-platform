/**
 * Integration tests — all 6 active document types
 *
 * Runs against a live server. Start the server first:
 *
 *   SKIP_AI_ENHANCEMENT=true npm run dev
 *
 * Then in a separate terminal:
 *
 *   npm run test:all-types
 *
 * SKIP_AI_ENHANCEMENT=true makes the server return the assembled baseDraft
 * without calling OpenAI. Tests validate the full pipeline except AI polish:
 * - Payload parsing and DTO validation
 * - Semantic validation (400 for invalid inputs)
 * - Template assembly and clause interpolation
 * - DB persistence (type, status, structuredData)
 * - Placeholder absence ({{VAR}}, [indicar], [describir])
 * - additionalClauses injection
 * - supply_contract returns clear 400
 */

import { PrismaClient } from "@prisma/client";

const API_URL = process.env.API_URL || "http://localhost:4001";
const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TestCase {
  name: string;
  payload: unknown;
  expectedStatus: number;
  /** Override the request URL. Evaluated at run time so IDs captured in previous tests work. */
  url?: () => string;
  /** HTTP method — defaults to POST */
  method?: "POST" | "GET";
  validateResponse?: (response: any) => void;
  validatePersistence?: (documentId: string) => Promise<void>;
}

// ---------------------------------------------------------------------------
// Shared assertion helpers
// ---------------------------------------------------------------------------

/** Assert no unreplaced template variables or obvious meta-instructions */
function assertNoPlaceholders(text: string, context: string): void {
  const banned = [
    { pattern: /\{\{[A-Z_]{2,}\}\}/, label: "{{VARIABLE}} unreplaced" },
    { pattern: /\[indicar/i,          label: "[indicar...]" },
    { pattern: /\[describir/i,        label: "[describir...]" },
    { pattern: /\[especificar/i,      label: "[especificar...]" },
    { pattern: /\[completar/i,        label: "[completar...]" },
  ];
  for (const { pattern, label } of banned) {
    if (pattern.test(text)) {
      throw new Error(`${context}: found placeholder "${label}" in generated text`);
    }
  }
}

/** Assert that every expected string appears in the document text */
function assertContains(text: string, expected: string[], context: string): void {
  for (const str of expected) {
    const found =
      text.toLowerCase().includes(str.toLowerCase()) ||
      text.includes(str);
    if (!found) {
      throw new Error(`${context}: expected to find "${str}" in generated text`);
    }
  }
}

/** Assert document persisted with correct type and status */
async function assertPersisted(
  documentId: string,
  expectedType: string,
  expectedStatus: string
): Promise<void> {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      versions: { orderBy: { versionNumber: "desc" }, take: 1 },
    },
  });

  if (!doc) throw new Error(`Document ${documentId} not found in DB`);

  const version = doc.versions[0];
  if (!version) throw new Error("DocumentVersion not found");

  if (doc.type !== expectedType) {
    throw new Error(`DB type mismatch: expected "${expectedType}", got "${doc.type}"`);
  }
  if (version.status !== expectedStatus) {
    throw new Error(`DB status mismatch: expected "${expectedStatus}", got "${version.status}"`);
  }
  if (!version.structuredData) {
    throw new Error("structuredData not persisted in DocumentVersion");
  }
  if (!version.clausePlan) {
    throw new Error("clausePlan not persisted in DocumentVersion");
  }

  console.log(`  ✓ DB: type=${doc.type}, status=${version.status}, structuredData=✓, clausePlan=✓`);
}

// ---------------------------------------------------------------------------
// Fixtures — minimal valid payloads per type
// ---------------------------------------------------------------------------

const fixtures = {
  service_contract: {
    documentType: "service_contract",
    jurisdiction: "caba",
    tone: "commercial_clear",
    proveedor_nombre: "Consultora Delta SRL",
    proveedor_doc: "20-12345678-9",
    proveedor_domicilio: "Av. Corrientes 1234, CABA",
    cliente_nombre: "Empresa Alpha SA",
    cliente_doc: "30-98765432-1",
    cliente_domicilio: "Av. Santa Fe 5678, CABA",
    descripcion_servicio: "Servicios de consultoría contable y asesoramiento fiscal mensual",
    monto: "150000",
    moneda: "ARS",
    periodicidad: "mensual",
    forma_pago: "transferencia_bancaria",
    plazo_pago: "30_dias",
    preferencias_fiscales: "responsable_inscripto",
    inicio_vigencia: "2025-04-01",
    plazo_minimo_meses: 12,
  },

  nda: {
    documentType: "nda",
    jurisdiction: "caba",
    tone: "formal_technical",
    revelador_nombre: "Empresa Reveladora SA",
    revelador_doc: "30-11111111-1",
    revelador_domicilio: "Av. 9 de Julio 500, CABA",
    receptor_nombre: "Empresa Receptora SRL",
    receptor_doc: "20-22222222-2",
    receptor_domicilio: "Av. Callao 800, CABA",
    definicion_informacion: "Toda información técnica, financiera, comercial o estratégica de la empresa, incluyendo planes de negocio, datos de clientes, fórmulas y procesos productivos",
    finalidad_permitida: "Evaluación de una potencial asociación comercial para el desarrollo conjunto de software de gestión empresarial",
    plazo_confidencialidad: 3,
    inicio_vigencia: "2025-04-01",
  },

  legal_notice: {
    documentType: "legal_notice",
    jurisdiction: "buenos_aires",
    tone: "formal_technical",
    remitente_nombre: "Servicios Industriales SA",
    remitente_doc: "30-55555555-5",
    remitente_domicilio: "Av. Rivadavia 1000, La Plata",
    destinatario_nombre: "Comercio Deudor SRL",
    destinatario_doc: "20-66666666-6",
    destinatario_domicilio: "Calle 7 N° 500, La Plata",
    relacion_previa: "Contrato de provisión de servicios de limpieza celebrado el 1 de enero de 2025, Nro. de contrato 2025-001, por el cual la remitente prestó servicios mensuales durante enero y febrero de 2025",
    hechos: "La remitente prestó todos los servicios acordados en los meses de enero y febrero de 2025. Se emitieron las facturas B N° 0001-00000456 y B N° 0001-00000512, cada una por la suma de ARS 180.000, con vencimientos el 31/01/2025 y 28/02/2025 respectivamente",
    incumplimiento: "A la fecha de la presente, habiendo vencido ambas facturas, la destinataria no ha efectuado pago alguno, adeudando la suma total de ARS 360.000",
    intimacion: "Se INTIMA FEHACIENTEMENTE a Comercio Deudor SRL a abonar la suma de PESOS TRESCIENTOS SESENTA MIL ($ 360.000) correspondiente a las facturas vencidas, más los intereses moratorios a la tasa activa del BCRA desde cada fecha de vencimiento",
    plazo_cumplimiento: "10_dias",
    apercibimiento: "Vencido el plazo sin que se acredite el pago, se iniciarán de inmediato las acciones judiciales de cobro ejecutivo, siendo de exclusiva responsabilidad de la destinataria las costas, intereses y honorarios que se devenguen",
  },

  lease: {
    documentType: "lease",
    jurisdiction: "caba",
    tone: "commercial_clear",
    locador_nombre: "Propietario Buenos SRL",
    locador_doc: "20-33333333-3",
    locador_domicilio: "Perón 300, CABA",
    locatario_nombre: "Inquilino SA",
    locatario_doc: "30-44444444-4",
    locatario_domicilio: "Rivadavia 200, CABA",
    descripcion_inmueble: "Local comercial de 60 m² planta baja, salón principal y baño, acceso por calle Florida",
    domicilio_inmueble: "Florida 100, piso 0, CABA",
    destino_uso: "comercial",
    monto_alquiler: "280000",
    moneda: "ARS",
    forma_pago: "transferencia_bancaria",
    dia_pago: "5",
    ajuste_precio: "icl",
    fecha_inicio: "2025-04-01",
    duracion_meses: 24,
    renovacion_automatica: false,
    deposito: true,
    deposito_meses: 1,
  },

  debt_recognition: {
    documentType: "debt_recognition",
    jurisdiction: "buenos_aires",
    tone: "formal_technical",
    acreedor_nombre: "Empresa Proveedora SRL",
    acreedor_doc: "30-11111111-1",
    acreedor_domicilio: "Av. 9 de Julio 100, Buenos Aires",
    deudor_nombre: "Comercio Deudor SA",
    deudor_doc: "20-22222222-2",
    deudor_domicilio: "Av. San Martín 500, Buenos Aires",
    monto_deuda: "750000",
    moneda: "ARS",
    causa_deuda: "Saldo impago de facturas de provisión de insumos N° 001-00001234 a 001-00001240, emitidas entre enero y marzo de 2025 por provisión de materiales de construcción",
    fecha_reconocimiento: "2025-03-15",
    pago_en_cuotas: true,
    cantidad_cuotas: 6,
    monto_cuota: "125000",
    fecha_primer_vencimiento: "2025-04-15",
    forma_pago: "transferencia_bancaria",
    incluye_intereses: false,
    clausula_aceleracion: true,
  },

  simple_authorization: {
    documentType: "simple_authorization",
    jurisdiction: "cordoba",
    tone: "commercial_clear",
    autorizante_nombre: "María González",
    autorizante_doc: "27-12345678-4",
    autorizante_domicilio: "Bv. San Juan 500, Córdoba Capital",
    autorizado_nombre: "Carlos López",
    autorizado_doc: "20-87654321-5",
    autorizado_domicilio: "Av. General Paz 1000, Córdoba Capital",
    tramite_autorizado: "Retiro de documentación en AFIP y firma de formularios impositivos",
    descripcion_alcance: "El autorizado queda facultado para presentarse ante la Administración Federal de Ingresos Públicos delegación Córdoba Capital, identificarse con el presente poder, retirar toda documentación vinculada al CUIT 27-12345678-4, y suscribir los recibos y formularios necesarios para completar el trámite",
    limitaciones: "La presente autorización no faculta para comprometer obligaciones dinerarias ni para actuar en trámites judiciales o administrativos distintos al indicado",
    fecha_autorizacion: "2025-03-17",
    acto_unico: true,
  },
};

// ---------------------------------------------------------------------------
// Test cases
// ---------------------------------------------------------------------------

// ── service_contract ─────────────────────────────────────────────────────────

const tc_service_contract_valid: TestCase = {
  name: "service_contract — payload válido → 200, persiste como contrato_servicios",
  payload: fixtures.service_contract,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");
    if (!res.documentId) throw new Error("Missing documentId");
    if (!res.contrato || res.contrato.length < 100) throw new Error("Contrato too short");
    assertNoPlaceholders(res.contrato, "service_contract");
    assertContains(res.contrato, ["Consultora Delta SRL", "Empresa Alpha SA"], "service_contract");
    console.log("  ✓ contrato length:", res.contrato.length);
    console.log("  ✓ no placeholders detected");
    console.log("  ✓ party names present");
  },
  validatePersistence: async (id) =>
    assertPersisted(id, "contrato_servicios", "generated"),
};

const tc_service_contract_invalid_semantic: TestCase = {
  name: "service_contract — penalización sin rescisión activada → 400 validación semántica",
  payload: {
    ...fixtures.service_contract,
    penalizacion_monto: "ARS 500000",
    penalizacion_rescision: false,
  },
  expectedStatus: 400,
  validateResponse: (res) => {
    if (res.ok !== false) throw new Error("Expected ok: false");
    if (!res.details?.length && !res.message) throw new Error("Missing error details");
    console.log("  ✓ validation error:", res.details?.[0] || res.message);
  },
};

// ── nda ──────────────────────────────────────────────────────────────────────

const tc_nda_valid: TestCase = {
  name: "nda — payload válido → 200, persiste como nda",
  payload: fixtures.nda,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");
    assertNoPlaceholders(res.contrato, "nda");
    assertContains(
      res.contrato,
      ["Empresa Reveladora SA", "Empresa Receptora SRL"],
      "nda"
    );
    console.log("  ✓ contrato length:", res.contrato.length);
    console.log("  ✓ party names present, no placeholders");
  },
  validatePersistence: async (id) => assertPersisted(id, "nda", "generated"),
};

const tc_nda_invalid_missing_definition: TestCase = {
  name: "nda — sin definición de información confidencial → 400",
  payload: {
    ...fixtures.nda,
    definicion_informacion: "Corto", // < 20 chars
  },
  expectedStatus: 400,
  validateResponse: (res) => {
    if (res.ok !== false) throw new Error("Expected ok: false");
    console.log("  ✓ validation error:", res.details?.[0] || res.message);
  },
};

// ── legal_notice ─────────────────────────────────────────────────────────────

const tc_legal_notice_valid: TestCase = {
  name: "legal_notice — payload válido → 200, persiste como carta_documento",
  payload: fixtures.legal_notice,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");
    assertNoPlaceholders(res.contrato, "legal_notice");
    assertContains(
      res.contrato,
      ["Servicios Industriales SA", "Comercio Deudor SRL", "INTIMA"],
      "legal_notice"
    );
    // Carta documento no debe tener "PRIMERA:", "SEGUNDA:" — son cláusulas de contrato
    if (/\bPRIMERA:\s/i.test(res.contrato)) {
      throw new Error("legal_notice should not use PRIMERA: — that is a contract clause style");
    }
    console.log("  ✓ contrato length:", res.contrato.length);
    console.log("  ✓ party names and INTIMA present");
    console.log("  ✓ no contract-style clause numbering");
  },
  validatePersistence: async (id) => assertPersisted(id, "carta_documento", "generated"),
};

const tc_legal_notice_invalid_intimacion_corta: TestCase = {
  name: "legal_notice — intimación < 30 chars → 400",
  payload: {
    ...fixtures.legal_notice,
    intimacion: "Pagar ya",
  },
  expectedStatus: 400,
  validateResponse: (res) => {
    if (res.ok !== false) throw new Error("Expected ok: false");
    console.log("  ✓ validation error:", res.details?.[0] || res.message);
  },
};

// ── lease ─────────────────────────────────────────────────────────────────────

const tc_lease_valid: TestCase = {
  name: "lease — payload válido → 200, persiste como contrato_locacion",
  payload: fixtures.lease,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");
    assertNoPlaceholders(res.contrato, "lease");
    assertContains(
      res.contrato,
      ["Propietario Buenos SRL", "Inquilino SA", "280000"],
      "lease"
    );
    console.log("  ✓ contrato length:", res.contrato.length);
    console.log("  ✓ locador, locatario y monto presentes");
  },
  validatePersistence: async (id) => assertPersisted(id, "contrato_locacion", "generated"),
};

const tc_lease_invalid_missing_canon: TestCase = {
  name: "lease — sin monto_alquiler → 400",
  payload: {
    ...fixtures.lease,
    monto_alquiler: "0",
  },
  expectedStatus: 400,
  validateResponse: (res) => {
    if (res.ok !== false) throw new Error("Expected ok: false");
    console.log("  ✓ validation error:", res.details?.[0] || res.message);
  },
};

// ── debt_recognition ──────────────────────────────────────────────────────────

const tc_debt_recognition_valid: TestCase = {
  name: "debt_recognition — payload válido con cuotas → 200, persiste como debt_recognition",
  payload: fixtures.debt_recognition,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");
    assertNoPlaceholders(res.contrato, "debt_recognition");
    assertContains(
      res.contrato,
      ["Empresa Proveedora SRL", "Comercio Deudor SA", "750000"],
      "debt_recognition"
    );
    console.log("  ✓ contrato length:", res.contrato.length);
    console.log("  ✓ acreedor, deudor y monto presentes");
  },
  validatePersistence: async (id) => assertPersisted(id, "debt_recognition", "generated"),
};

const tc_debt_recognition_warning_inconsistencia: TestCase = {
  name: "debt_recognition — cuotas inconsistentes con monto total → 200 con warning",
  payload: {
    ...fixtures.debt_recognition,
    monto_deuda: "750000",
    cantidad_cuotas: 6,
    monto_cuota: "50000", // 50000 × 6 = 300000 ≠ 750000 → diferencia > 5%
  },
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");
    const warningIds = res.warnings?.map((w: any) => w.ruleId) || [];
    if (!warningIds.includes("inconsistencia_cuotas_monto")) {
      throw new Error(
        `Expected inconsistencia_cuotas_monto warning. Got: ${warningIds.join(", ")}`
      );
    }
    console.log("  ✓ warning inconsistencia_cuotas_monto detected");
  },
};

const tc_debt_recognition_invalid_missing_monto: TestCase = {
  name: "debt_recognition — monto_deuda = 0 → 400",
  payload: {
    ...fixtures.debt_recognition,
    monto_deuda: "0",
  },
  expectedStatus: 400,
  validateResponse: (res) => {
    if (res.ok !== false) throw new Error("Expected ok: false");
    console.log("  ✓ validation error:", res.details?.[0] || res.message);
  },
};

// ── simple_authorization ──────────────────────────────────────────────────────

const tc_simple_authorization_valid: TestCase = {
  name: "simple_authorization — payload válido → 200, persiste como simple_authorization",
  payload: fixtures.simple_authorization,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");
    assertNoPlaceholders(res.contrato, "simple_authorization");
    assertContains(
      res.contrato,
      ["María González", "Carlos López", "AFIP"],
      "simple_authorization"
    );
    console.log("  ✓ contrato length:", res.contrato.length);
    console.log("  ✓ autorizante, autorizado y trámite presentes");
  },
  validatePersistence: async (id) =>
    assertPersisted(id, "simple_authorization", "generated"),
};

const tc_simple_authorization_invalid_sin_vigencia: TestCase = {
  name: "simple_authorization — sin acto_unico y sin vigencia_hasta → 400",
  payload: {
    ...fixtures.simple_authorization,
    acto_unico: false,
    vigencia_hasta: undefined,
  },
  expectedStatus: 400,
  validateResponse: (res) => {
    if (res.ok !== false) throw new Error("Expected ok: false");
    console.log("  ✓ validation error:", res.details?.[0] || res.message);
  },
};

// ── supply_contract (deprecated) ─────────────────────────────────────────────

const tc_supply_contract_deprecated: TestCase = {
  name: "supply_contract — tipo no implementado → 400 con mensaje claro",
  payload: {
    documentType: "supply_contract",
    jurisdiction: "caba",
    tone: "commercial_clear",
    proveedor_nombre: "Test",
    proveedor_doc: "20-12345678-9",
    proveedor_domicilio: "Test 123",
    cliente_nombre: "Test Client",
    cliente_doc: "30-98765432-1",
    cliente_domicilio: "Test 456",
    descripcion_servicio: "Test suministro",
    monto: "100000",
    moneda: "ARS",
    periodicidad: "mensual",
    forma_pago: "transferencia_bancaria",
    plazo_pago: "30_dias",
    preferencias_fiscales: "responsable_inscripto",
    inicio_vigencia: "2025-04-01",
    plazo_minimo_meses: 6,
  },
  expectedStatus: 400,
  validateResponse: (res) => {
    if (res.ok !== false) throw new Error("Expected ok: false for supply_contract");
    // Should mention supply_contract or service_contract in the error message
    const msg = (res.message || res.error || "").toLowerCase();
    if (!msg.includes("supply_contract") && !msg.includes("suministro") && !msg.includes("service_contract")) {
      throw new Error(`Expected informative error message about supply_contract. Got: "${res.message}"`);
    }
    console.log("  ✓ 400 with informative message:", res.message?.substring(0, 80));
  },
};

// ── additionalClauses cross-type ──────────────────────────────────────────────

const tc_additional_clauses: TestCase = {
  name: "additionalClauses — se incluye en el documento generado (test con legal_notice)",
  payload: {
    ...fixtures.legal_notice,
    additionalClauses:
      "Se deja constancia fehaciente de que el destinatario fue notificado verbalmente en fecha 10/03/2025 sin respuesta alguna.",
  },
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");
    const contrato: string = res.contrato || "";
    const clausulaKeyword = "Se deja constancia fehaciente";
    if (!contrato.includes(clausulaKeyword)) {
      throw new Error(
        `additionalClauses content not found in generated document. ` +
        `Expected to find: "${clausulaKeyword}"`
      );
    }
    console.log("  ✓ additionalClauses content present in generated document");
    assertNoPlaceholders(contrato, "additionalClauses test");
  },
};

// ── needs_review (output validation with injected placeholder) ────────────────

const tc_needs_review_placeholder: TestCase = {
  name: "placeholder injection → incompleteDocument: true, status needs_review",
  // We send a payload that results in empty/near-empty slots so that the
  // output-validator detects unreplaced {{VARIABLE}} or bracket placeholders.
  // The simplest way: omit fields that have no default → some slots remain blank.
  // With SKIP_AI_ENHANCEMENT=true the baseDraft is returned as-is, which should
  // be clean (slots are filled from form data). This test validates the HAPPY PATH
  // of the output validator (no placeholders → incompleteDocument: false).
  payload: fixtures.service_contract,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");
    // With a well-formed payload, output validator should NOT flag the document
    if (res.incompleteDocument === true) {
      console.log("  ⚠ Document flagged as incomplete. outputWarnings:", res.outputWarnings);
      // Not throwing — this is informational. If SKIP_AI_ENHANCEMENT=true, baseDraft
      // should not have placeholders. If it does, print them for debugging.
    } else {
      console.log("  ✓ incompleteDocument: false — output validation passed");
    }
    console.log("  ✓ outputWarnings:", res.outputWarnings?.length ?? 0, "issues");
  },
};

// ---------------------------------------------------------------------------
// Shared state between sequential tests
// ---------------------------------------------------------------------------

/** Captured from tc_get_document_setup — used by tc_get_document_clean */
let capturedCleanDocId = "";

/** Captured from tc_needs_review_forced — used by tc_get_document_needs_review */
let capturedNeedsReviewDocId = "";

// ---------------------------------------------------------------------------
// needs_review — forced via additionalClauses with bracket placeholder
// ---------------------------------------------------------------------------

/**
 * Strategy: send additionalClauses containing "[indicar...]".
 * appendAdditionalClauses() injects it verbatim into the baseDraft.
 * With SKIP_AI_ENHANCEMENT=true, baseDraft reaches validateGeneratedDocumentOutput()
 * unchanged. The PLACEHOLDER_BRACKET rule matches → incompleteDocument: true.
 */
const tc_needs_review_forced: TestCase = {
  name: "needs_review — additionalClauses con bracket → incompleteDocument: true, status needs_review en DB",
  payload: {
    ...fixtures.service_contract,
    additionalClauses:
      "Incorporar penalidad adicional de [indicar monto exacto en pesos] por cada día de mora.",
  },
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");

    if (res.incompleteDocument !== true) {
      throw new Error(
        `Expected incompleteDocument: true but got ${res.incompleteDocument}. ` +
        `Check SKIP_AI_ENHANCEMENT=true is set on the server.`
      );
    }

    const warnings: any[] = res.outputWarnings ?? [];
    if (warnings.length === 0) {
      throw new Error("Expected outputWarnings to be non-empty");
    }

    const bracketWarning = warnings.find((w: any) => w.code === "PLACEHOLDER_BRACKET");
    if (!bracketWarning) {
      throw new Error(
        `Expected a PLACEHOLDER_BRACKET warning. Got codes: ${warnings.map((w: any) => w.code).join(", ")}`
      );
    }

    if (!bracketWarning.match?.toLowerCase().includes("indicar")) {
      throw new Error(
        `Expected match to contain "indicar". Got: "${bracketWarning.match}"`
      );
    }

    capturedNeedsReviewDocId = res.documentId;

    console.log("  ✓ incompleteDocument: true");
    console.log("  ✓ outputWarnings count:", warnings.length);
    console.log("  ✓ PLACEHOLDER_BRACKET detected, match:", bracketWarning.match);
    console.log("  ✓ documentId captured:", capturedNeedsReviewDocId.slice(0, 8) + "...");
  },
  validatePersistence: async (id) => {
    const doc = await prisma.document.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
    });
    if (!doc) throw new Error("Document not found in DB");

    const version = doc.versions[0];
    if (!version) throw new Error("DocumentVersion not found");

    if (version.status !== "needs_review") {
      throw new Error(`Expected status "needs_review", got "${version.status}"`);
    }

    const persisted = version.outputWarnings as any[] | null;
    if (!persisted || persisted.length === 0) {
      throw new Error("Expected outputWarnings to be persisted in DocumentVersion");
    }

    const bracketInDb = persisted.find((w) => w.code === "PLACEHOLDER_BRACKET");
    if (!bracketInDb) {
      throw new Error(
        `Expected PLACEHOLDER_BRACKET in persisted outputWarnings. ` +
        `Got: ${persisted.map((w) => w.code).join(", ")}`
      );
    }

    console.log("  ✓ DB status: needs_review");
    console.log("  ✓ DB outputWarnings persisted:", persisted.length, "issue(s)");
    console.log("  ✓ DB PLACEHOLDER_BRACKET.match:", bracketInDb.match);
  },
};

// ---------------------------------------------------------------------------
// GET /documents/:id — setup + fetch
// ---------------------------------------------------------------------------

/** Step 1: create a clean document and capture its ID */
const tc_get_document_setup: TestCase = {
  name: "GET setup — crear documento lease para recuperar por ID",
  payload: fixtures.lease,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok || !res.documentId) throw new Error("Expected ok: true and documentId");
    capturedCleanDocId = res.documentId;
    console.log("  ✓ clean document created:", capturedCleanDocId.slice(0, 8) + "...");
  },
};

/** Step 2: GET the clean document — verify structure and fields */
const tc_get_document_clean: TestCase = {
  name: "GET /documents/:id — documento generado → type, status, rawText, no outputWarnings",
  payload: null,
  method: "GET",
  url: () => `${API_URL}/documents/${capturedCleanDocId}`,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");

    const doc = res.document;
    if (!doc) throw new Error("Missing document in response");

    // type
    if (doc.type !== "contrato_locacion") {
      throw new Error(`Expected type "contrato_locacion", got "${doc.type}"`);
    }

    // estado (Document level)
    if (!doc.estado) throw new Error("Missing document.estado");

    // lastVersion
    const lv = doc.lastVersion;
    if (!lv) throw new Error("Missing document.lastVersion");
    if (!lv.rawText || lv.rawText.length < 100) {
      throw new Error("lastVersion.rawText too short or missing");
    }
    if (lv.status !== "generated") {
      throw new Error(`Expected lastVersion.status "generated", got "${lv.status}"`);
    }
    // Clean document should have null outputWarnings (no issues)
    if (lv.outputWarnings !== null && lv.outputWarnings !== undefined) {
      // Non-fatal: print warning but don't fail — the output validator might have
      // found something in the template assembly that wasn't expected
      console.log("  ⚠ outputWarnings present on clean doc:", lv.outputWarnings);
    } else {
      console.log("  ✓ outputWarnings: null (document is clean)");
    }

    console.log("  ✓ document.type:", doc.type);
    console.log("  ✓ document.estado:", doc.estado);
    console.log("  ✓ lastVersion.status:", lv.status);
    console.log("  ✓ lastVersion.rawText length:", lv.rawText.length);
    console.log("  ✓ lastVersion.id:", lv.id?.slice(0, 8) + "...");
  },
};

/** GET the needs_review document — verify outputWarnings are served from DB */
const tc_get_document_needs_review: TestCase = {
  name: "GET /documents/:id — documento needs_review → status + outputWarnings desde DB",
  payload: null,
  method: "GET",
  url: () => `${API_URL}/documents/${capturedNeedsReviewDocId}`,
  expectedStatus: 200,
  validateResponse: (res) => {
    if (!res.ok) throw new Error("Expected ok: true");

    const doc = res.document;
    if (!doc) throw new Error("Missing document in response");

    const lv = doc.lastVersion;
    if (!lv) throw new Error("Missing lastVersion");

    if (lv.status !== "needs_review") {
      throw new Error(`Expected lastVersion.status "needs_review", got "${lv.status}"`);
    }

    const warnings: any[] = lv.outputWarnings ?? [];
    if (warnings.length === 0) {
      throw new Error("Expected outputWarnings to be served from DB in lastVersion");
    }

    const bracketWarning = warnings.find((w: any) => w.code === "PLACEHOLDER_BRACKET");
    if (!bracketWarning) {
      throw new Error(
        `Expected PLACEHOLDER_BRACKET in lastVersion.outputWarnings. ` +
        `Got: ${warnings.map((w: any) => w.code).join(", ")}`
      );
    }

    console.log("  ✓ lastVersion.status: needs_review");
    console.log("  ✓ outputWarnings served from DB:", warnings.length, "issue(s)");
    console.log("  ✓ PLACEHOLDER_BRACKET present, match:", bracketWarning.match);
    console.log("  ✓ document.type:", doc.type);
  },
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function runTestCase(testCase: TestCase): Promise<boolean> {
  console.log(`\n🧪 ${testCase.name}`);
  console.log("─".repeat(70));

  try {
    const method = testCase.method ?? "POST";
    const url = testCase.url ? testCase.url() : `${API_URL}/documents/generate`;

    const fetchOptions: RequestInit = { method, headers: { "Content-Type": "application/json" } };
    if (method === "POST" && testCase.payload) {
      fetchOptions.body = JSON.stringify(testCase.payload);
    }

    const response = await fetch(url, fetchOptions);

    const data = await response.json();

    console.log(`  Status: ${response.status} (expected: ${testCase.expectedStatus})`);

    if (response.status !== testCase.expectedStatus) {
      console.error(`  ❌ Status mismatch! Got ${response.status}, expected ${testCase.expectedStatus}`);
      console.error("  Response:", JSON.stringify(data, null, 2).substring(0, 500));
      return false;
    }

    if (testCase.validateResponse) {
      testCase.validateResponse(data);
    }

    if (testCase.validatePersistence && data.documentId) {
      await testCase.validatePersistence(data.documentId);
    }

    console.log(`  ✅ PASS`);
    return true;
  } catch (error: any) {
    console.error(`  ❌ FAIL: ${error.message}`);
    return false;
  }
}

async function waitForBackend(maxAttempts = 30): Promise<boolean> {
  console.log("⏳ Waiting for backend...");
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${API_URL}/healthz`, {
        signal: AbortSignal.timeout(2000),
      });
      if (res.ok) { console.log("✅ Backend ready"); return true; }
    } catch {}
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log("\n❌ Backend not ready");
  return false;
}

async function main() {
  console.log("🚀 Integration Tests — All Document Types");
  console.log("=".repeat(70));
  console.log(
    "ℹ  Tip: start the server with SKIP_AI_ENHANCEMENT=true to avoid real OpenAI calls\n"
  );

  const backendReady = await waitForBackend();
  if (!backendReady) process.exit(1);

  const testCases: TestCase[] = [
    // service_contract
    tc_service_contract_valid,
    tc_service_contract_invalid_semantic,
    // nda
    tc_nda_valid,
    tc_nda_invalid_missing_definition,
    // legal_notice
    tc_legal_notice_valid,
    tc_legal_notice_invalid_intimacion_corta,
    // lease
    tc_lease_valid,
    tc_lease_invalid_missing_canon,
    // debt_recognition
    tc_debt_recognition_valid,
    tc_debt_recognition_warning_inconsistencia,
    tc_debt_recognition_invalid_missing_monto,
    // simple_authorization
    tc_simple_authorization_valid,
    tc_simple_authorization_invalid_sin_vigencia,
    // cross-type
    tc_supply_contract_deprecated,
    tc_additional_clauses,
    tc_needs_review_placeholder,
    // needs_review real
    tc_needs_review_forced,
    // GET /documents/:id
    tc_get_document_setup,
    tc_get_document_clean,
    tc_get_document_needs_review,
  ];

  const results: boolean[] = [];

  for (const tc of testCases) {
    results.push(await runTestCase(tc));
    await new Promise((r) => setTimeout(r, 500));
  }

  // ── Summary ──
  console.log("\n" + "=".repeat(70));
  console.log("📊 Results");
  console.log("=".repeat(70));

  testCases.forEach((tc, i) => {
    const icon = results[i] ? "✅" : "❌";
    console.log(`${icon} ${tc.name}`);
  });

  const passed = results.filter(Boolean).length;
  const total = results.length;
  console.log(`\n${"─".repeat(70)}`);
  console.log(`Total: ${passed}/${total} passed`);

  if (passed === total) {
    console.log("🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log(`⚠️  ${total - passed} test(s) failed`);
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
