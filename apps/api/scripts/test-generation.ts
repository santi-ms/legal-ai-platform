/**
 * Test Script for Document Generation
 * 
 * Tests the POST /documents/generate endpoint with various scenarios
 * to validate the new architecture end-to-end.
 */

import { PrismaClient } from "@prisma/client";

const API_URL = process.env.API_URL || "http://localhost:4001";
const prisma = new PrismaClient();

interface TestCase {
  name: string;
  payload: unknown;
  expectedStatus: number;
  validateResponse?: (response: any) => void;
  validatePersistence?: (documentId: string) => Promise<void>;
}

/**
 * Test Case 1: Mínimo válido
 */
const testCase1_Minimal: TestCase = {
  name: "Caso mínimo válido - Service Contract",
  payload: {
    documentType: "service_contract",
    jurisdiction: "caba",
    tone: "commercial_clear",
    proveedor_nombre: "Servicios ABC SRL",
    proveedor_doc: "20-12345678-9",
    proveedor_domicilio: "Av. Corrientes 1234, CABA",
    cliente_nombre: "Cliente XYZ SA",
    cliente_doc: "30-98765432-1",
    cliente_domicilio: "Av. Santa Fe 5678, CABA",
    descripcion_servicio: "Servicios de consultoría contable mensual",
    monto: "150000",
    moneda: "ARS",
    periodicidad: "mensual",
    forma_pago: "transferencia_bancaria",
    plazo_pago: "30_dias",
    preferencias_fiscales: "responsable_inscripto",
    inicio_vigencia: "2025-02-01",
    plazo_minimo_meses: 12,
  },
  expectedStatus: 200,
  validateResponse: (response) => {
    console.log("  ✓ Response OK:", response.ok);
    console.log("  ✓ Document ID:", response.documentId);
    console.log("  ✓ Contrato length:", response.contrato?.length || 0);
    console.log("  ✓ Warnings count:", response.warnings?.length || 0);
    console.log("  ✓ Metadata:", response.metadata);
    
    if (!response.ok) throw new Error("Expected ok: true");
    if (!response.documentId) throw new Error("Missing documentId");
    if (!response.contrato || response.contrato.length < 100) {
      throw new Error("Contrato too short or missing");
    }
    if (!response.metadata) throw new Error("Missing metadata");
    if (response.metadata.documentType !== "service_contract") {
      throw new Error("Wrong documentType in metadata");
    }
  },
  validatePersistence: async (documentId: string) => {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });
    
    if (!doc) throw new Error("Document not found in DB");
    
    const version = doc.versions[0];
    if (!version) throw new Error("Version not found");
    
    console.log("  ✓ StructuredData persisted:", !!version.structuredData);
    console.log("  ✓ ClausePlan persisted:", !!version.clausePlan);
    console.log("  ✓ Warnings persisted:", !!version.generationWarnings);
    console.log("  ✓ TemplateVersion persisted:", version.templateVersion);
    console.log("  ✓ Status persisted:", version.status);
    
    if (!version.structuredData) throw new Error("structuredData not persisted");
    if (!version.clausePlan) throw new Error("clausePlan not persisted");
    if (version.templateVersion !== "1.0.0") {
      throw new Error(`Wrong templateVersion: ${version.templateVersion}`);
    }
    if (version.status !== "generated") {
      throw new Error(`Wrong status: ${version.status}`);
    }
    
    // Validate structuredData content
    const structuredData = version.structuredData as any;
    if (structuredData.proveedor_nombre !== "Servicios ABC SRL") {
      throw new Error("structuredData.proveedor_nombre mismatch");
    }
    
    // Validate clausePlan structure
    const clausePlan = version.clausePlan as any;
    if (!Array.isArray(clausePlan.required)) {
      throw new Error("clausePlan.required should be array");
    }
    if (!Array.isArray(clausePlan.optional)) {
      throw new Error("clausePlan.optional should be array");
    }
    if (!Array.isArray(clausePlan.order)) {
      throw new Error("clausePlan.order should be array");
    }
    
    console.log("  ✓ ClausePlan structure valid");
    console.log("    - Required clauses:", clausePlan.required.length);
    console.log("    - Optional clauses:", clausePlan.optional.length);
    console.log("    - Total order:", clausePlan.order.length);
  },
};

/**
 * Test Case 2: Completo con todas las opciones
 */
const testCase2_Complete: TestCase = {
  name: "Caso completo - Con rescisión, penalidad, confidencialidad e IP",
  payload: {
    documentType: "service_contract",
    jurisdiction: "cordoba",
    tone: "formal_technical",
    proveedor_nombre: "Estudio Legal Avanzado SRL",
    proveedor_doc: "20-11111111-1",
    proveedor_domicilio: "San Martín 500, Córdoba Capital",
    cliente_nombre: "Empresa Innovadora SA",
    cliente_doc: "30-22222222-2",
    cliente_domicilio: "Av. Colón 1000, Córdoba Capital",
    descripcion_servicio: "Servicios legales integrales incluyendo asesoramiento corporativo, redacción de contratos, y representación legal en juicios comerciales",
    alcance: "Incluye hasta 10 horas mensuales de consultoría, revisión de hasta 5 contratos por mes, y representación en hasta 2 causas judiciales simultáneas",
    entregables: "Informes legales mensuales, contratos revisados, y documentación de causas",
    monto: "500000",
    moneda: "ARS",
    periodicidad: "mensual",
    forma_pago: "transferencia_bancaria",
    plazo_pago: "15_dias",
    precio_incluye_impuestos: false,
    ajuste_precio: "inflacion",
    preferencias_fiscales: "responsable_inscripto",
    inicio_vigencia: "2025-03-01",
    plazo_minimo_meses: 24,
    renovacion_automatica: true,
    preaviso_renovacion: 60,
    penalizacion_rescision: true,
    penalizacion_monto: "ARS 1000000 o 2 meses de servicio",
    preaviso_rescision: 30,
    propiedad_intelectual: true,
    tipo_propiedad_intelectual: "cesion_total",
    confidencialidad: true,
    plazo_confidencialidad: 5,
    domicilio_notificaciones: "domicilio_contratante",
  },
  expectedStatus: 200,
  validateResponse: (response) => {
    console.log("  ✓ Response OK:", response.ok);
    console.log("  ✓ Contrato length:", response.contrato?.length || 0);
    console.log("  ✓ Warnings count:", response.warnings?.length || 0);
    
    // Should have warnings (some optional fields might trigger warnings)
    if (response.warnings && response.warnings.length > 0) {
      console.log("  ✓ Warnings present (expected):");
      response.warnings.forEach((w: any, i: number) => {
        console.log(`    ${i + 1}. ${w.message}`);
      });
    }
    
    // Verify contract contains key clauses
    const contrato = response.contrato || "";
    if (!contrato.includes("PRIMERA")) {
      throw new Error("Contract missing PRIMERA clause");
    }
    if (!contrato.includes("confidencialidad") && !contrato.includes("CONFIDENCIALIDAD")) {
      throw new Error("Contract missing confidentiality clause");
    }
    if (!contrato.includes("propiedad intelectual") && !contrato.includes("PROPIEDAD INTELECTUAL")) {
      throw new Error("Contract missing intellectual property clause");
    }
    if (!contrato.includes("rescisión") && !contrato.includes("RESCISIÓN")) {
      throw new Error("Contract missing termination clause");
    }
    
    console.log("  ✓ All expected clauses present in contract");
  },
  validatePersistence: async (documentId: string) => {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });
    
    const version = doc?.versions[0];
    if (!version) throw new Error("Version not found");
    
    const clausePlan = version.clausePlan as any;
    // Should have optional clauses
    if (clausePlan.optional.length === 0) {
      throw new Error("Expected optional clauses in clausePlan");
    }
    
    console.log("  ✓ Optional clauses in clausePlan:", clausePlan.optional.length);
    
    // Verify structuredData has all fields
    const structuredData = version.structuredData as any;
    if (!structuredData.confidencialidad) {
      throw new Error("confidencialidad not in structuredData");
    }
    if (!structuredData.propiedad_intelectual) {
      throw new Error("propiedad_intelectual not in structuredData");
    }
    if (!structuredData.penalizacion_rescision) {
      throw new Error("penalizacion_rescision not in structuredData");
    }
    
    console.log("  ✓ All optional fields persisted in structuredData");
  },
};

/**
 * Test Case 3: Caso inválido por validación semántica
 */
const testCase3_Invalid: TestCase = {
  name: "Caso inválido - Penalización sin activar rescisión",
  payload: {
    documentType: "service_contract",
    jurisdiction: "caba",
    tone: "commercial_clear",
    proveedor_nombre: "Test Provider",
    proveedor_doc: "20-12345678-9",
    proveedor_domicilio: "Test Address 123",
    cliente_nombre: "Test Client",
    cliente_doc: "30-98765432-1",
    cliente_domicilio: "Test Address 456",
    descripcion_servicio: "Test service",
    monto: "100000",
    moneda: "ARS",
    periodicidad: "mensual",
    forma_pago: "transferencia_bancaria",
    plazo_pago: "30_dias",
    preferencias_fiscales: "monotributo",
    inicio_vigencia: "2025-02-01",
    plazo_minimo_meses: 6,
    // ERROR: penalizacion_monto sin penalizacion_rescision
    penalizacion_rescision: false,
    penalizacion_monto: "ARS 50000",
  },
  expectedStatus: 400,
  validateResponse: (response) => {
    console.log("  ✓ Error response (expected):", response.error || response.message);
    if (response.ok !== false) {
      throw new Error("Expected ok: false for invalid case");
    }
  },
};

/**
 * Test Case 4: Caso con warnings no bloqueantes
 */
const testCase4_Warnings: TestCase = {
  name: "Caso con warnings - Sin confidencialidad ni IP en contrato largo",
  payload: {
    documentType: "service_contract",
    jurisdiction: "buenos_aires",
    tone: "balanced_professional",
    proveedor_nombre: "Consultoría General SRL",
    proveedor_doc: "20-33333333-3",
    proveedor_domicilio: "Av. 9 de Julio 1500, CABA",
    cliente_nombre: "Empresa Grande SA",
    cliente_doc: "30-44444444-4",
    cliente_domicilio: "Av. Libertador 2000, CABA",
    descripcion_servicio: "Servicios de consultoría estratégica",
    monto: "300000",
    moneda: "ARS",
    periodicidad: "mensual",
    forma_pago: "transferencia_bancaria",
    plazo_pago: "30_dias",
    preferencias_fiscales: "responsable_inscripto",
    inicio_vigencia: "2025-02-01",
    plazo_minimo_meses: 18, // Largo plazo sin ajuste de precio
    // Sin confidencialidad
    // Sin propiedad intelectual
    // Sin aclaración de impuestos
  },
  expectedStatus: 200,
  validateResponse: (response) => {
    console.log("  ✓ Response OK:", response.ok);
    console.log("  ✓ Warnings count:", response.warnings?.length || 0);
    
    if (!response.warnings || response.warnings.length === 0) {
      throw new Error("Expected warnings for this case");
    }
    
    console.log("  ✓ Warnings present (expected):");
    response.warnings.forEach((w: any, i: number) => {
      console.log(`    ${i + 1}. [${w.severity}] ${w.message}`);
      if (w.suggestion) {
        console.log(`       Suggestion: ${w.suggestion}`);
      }
    });
    
    // Verify warnings are non-blocking (response is still OK)
    if (!response.ok) {
      throw new Error("Warnings should not block generation");
    }
  },
};

/**
 * Test Case 5: Backward compatible - Formato viejo
 */
const testCase5_BackwardCompatible: TestCase = {
  name: "Backward compatible - Formato viejo (GenerateDocumentSchema)",
  payload: {
    type: "contrato_servicios", // Formato viejo
    jurisdiccion: "caba",
    tono: "formal", // Formato viejo
    proveedor_nombre: "Legacy Provider SRL",
    proveedor_doc: "20-55555555-5",
    proveedor_domicilio: "Legacy Address 123",
    cliente_nombre: "Legacy Client SA",
    cliente_doc: "30-66666666-6",
    cliente_domicilio: "Legacy Address 456",
    descripcion_servicio: "Legacy service description",
    monto_mensual: "200000", // Formato viejo
    forma_pago: "transferencia_bancaria",
    inicio_vigencia: "2025-02-01",
    plazo_minimo_meses: 12,
    penalizacion_rescision: false,
    preferencias_fiscales: "monotributo",
  },
  expectedStatus: 200,
  validateResponse: (response) => {
    console.log("  ✓ Response OK (backward compatible):", response.ok);
    console.log("  ✓ Document ID:", response.documentId);
    console.log("  ✓ Contrato generated:", !!response.contrato);
    
    if (!response.ok) {
      throw new Error("Backward compatible format should work");
    }
    if (!response.documentId) {
      throw new Error("Missing documentId in backward compatible response");
    }
  },
  validatePersistence: async (documentId: string) => {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
    });
    
    // Verify old format was mapped correctly
    if (doc?.type !== "contrato_servicios") {
      throw new Error("Old type format should be preserved in DB");
    }
    
    const version = doc?.versions[0];
    if (!version) throw new Error("Version not found");
    
    // Verify new structured data was created from old format
    const structuredData = version.structuredData as any;
    if (!structuredData) {
      throw new Error("structuredData should exist even from old format");
    }
    
    // Verify mapping worked
    if (structuredData.proveedor_nombre !== "Legacy Provider SRL") {
      throw new Error("Old format mapping failed");
    }
    
    console.log("  ✓ Old format mapped correctly to structuredData");
    console.log("  ✓ Old type preserved in DB:", doc.type);
  },
};

/**
 * Run a single test case
 */
async function runTestCase(testCase: TestCase): Promise<boolean> {
  console.log(`\n🧪 Running: ${testCase.name}`);
  console.log("─".repeat(60));
  
  try {
    const response = await fetch(`${API_URL}/documents/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testCase.payload),
    });
    
    const data = await response.json();
    
    console.log(`  Status: ${response.status} (expected: ${testCase.expectedStatus})`);
    
    if (response.status !== testCase.expectedStatus) {
      console.error(`  ❌ Status mismatch! Got ${response.status}, expected ${testCase.expectedStatus}`);
      console.error("  Response:", JSON.stringify(data, null, 2));
      return false;
    }
    
    if (testCase.validateResponse) {
      testCase.validateResponse(data);
    }
    
    if (testCase.validatePersistence && data.documentId) {
      await testCase.validatePersistence(data.documentId);
    }
    
    console.log(`  ✅ Test passed: ${testCase.name}`);
    return true;
  } catch (error: any) {
    console.error(`  ❌ Test failed: ${testCase.name}`);
    console.error("  Error:", error.message);
    if (error.stack) {
      console.error("  Stack:", error.stack);
    }
    return false;
  }
}

/**
 * Wait for backend to be ready
 */
async function waitForBackend(maxAttempts = 30): Promise<boolean> {
  console.log("⏳ Waiting for backend to be ready...");
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`${API_URL}/healthz`, {
        method: "GET",
        signal: AbortSignal.timeout(2000),
      });
      
      if (response.ok) {
        console.log("✅ Backend is ready!");
        return true;
      }
    } catch (error) {
      // Backend not ready yet
    }
    
    if (i < maxAttempts - 1) {
      process.stdout.write(".");
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  console.log("\n❌ Backend did not become ready in time");
  return false;
}

/**
 * Main test runner
 */
async function main() {
  console.log("🚀 Starting Document Generation Tests");
  console.log("=".repeat(60));
  console.log(`API URL: ${API_URL}`);
  console.log("=".repeat(60));
  
  // Check if DATABASE_URL is configured (backend needs it)
  if (!process.env.DATABASE_URL) {
    console.warn("\n⚠️  WARNING: DATABASE_URL is not set");
    console.warn("   The backend requires DATABASE_URL to be configured.");
    console.warn("   For testing, you can use SQLite: DATABASE_URL=file:./test.db");
    console.warn("   Or configure your PostgreSQL connection string.");
    console.warn("");
    console.warn("   Continuing anyway, but backend may fail if DATABASE_URL is missing...");
    console.warn("");
  }
  
  // Wait for backend to be ready
  const backendReady = await waitForBackend();
  if (!backendReady) {
    console.error("\n❌ Cannot proceed: Backend is not available");
    console.error("   Please start the backend with: npm run dev");
    console.error("   Make sure DATABASE_URL is configured in your .env file");
    process.exit(1);
  }
  
  console.log("");
  
  /**
   * Test Case 6: NDA Mínimo válido
   */
  const testCase6_NDA_Minimal: TestCase = {
    name: "NDA - Caso mínimo válido",
    payload: {
      documentType: "nda",
      jurisdiction: "caba",
      tone: "commercial_clear",
      revelador_nombre: "Empresa Reveladora SA",
      revelador_doc: "30-11111111-1",
      revelador_domicilio: "Av. Corrientes 1000, CABA",
      receptor_nombre: "Consultoría Externa SRL",
      receptor_doc: "20-22222222-2",
      receptor_domicilio: "Av. Santa Fe 2000, CABA",
      definicion_informacion: "Información técnica, comercial y estratégica relacionada con el desarrollo de productos, incluyendo especificaciones técnicas, planes de negocio, y datos de clientes",
      finalidad_permitida: "Evaluación de propuesta comercial y análisis de viabilidad técnica del proyecto",
      plazo_confidencialidad: 3,
      inicio_vigencia: "2025-02-01",
    },
    expectedStatus: 200,
    validateResponse: (response) => {
      console.log("  ✓ Response OK:", response.ok);
      console.log("  ✓ Document ID:", response.documentId);
      console.log("  ✓ Contrato length:", response.contrato?.length || 0);
      console.log("  ✓ Warnings count:", response.warnings?.length || 0);
      
      if (!response.ok) throw new Error("Expected ok: true");
      if (!response.documentId) throw new Error("Missing documentId");
      if (!response.contrato || response.contrato.length < 100) {
        throw new Error("Contrato too short or missing");
      }
      
      // Verify NDA-specific content
      const contrato = response.contrato || "";
      if (!contrato.includes("CONFIDENCIALIDAD") && !contrato.includes("confidencialidad")) {
        throw new Error("NDA missing confidentiality reference");
      }
      if (!contrato.includes("REVELADOR") || !contrato.includes("RECEPTOR")) {
        throw new Error("NDA missing party references");
      }
    },
    validatePersistence: async (documentId: string) => {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      });
      
      if (!doc) throw new Error("Document not found in DB");
      
      const version = doc.versions[0];
      if (!version) throw new Error("Version not found");
      
      console.log("  ✓ StructuredData persisted:", !!version.structuredData);
      console.log("  ✓ ClausePlan persisted:", !!version.clausePlan);
      console.log("  ✓ TemplateVersion persisted:", version.templateVersion);
      console.log("  ✓ Status persisted:", version.status);
      
      const structuredData = version.structuredData as any;
      if (structuredData.revelador_nombre !== "Empresa Reveladora SA") {
        throw new Error("structuredData.revelador_nombre mismatch");
      }
      if (!structuredData.definicion_informacion) {
        throw new Error("definicion_informacion not in structuredData");
      }
      
      const clausePlan = version.clausePlan as any;
      if (!clausePlan.required.includes("definicion_informacion")) {
        throw new Error("definicion_informacion should be in required clauses");
      }
    },
  };

  /**
   * Test Case 7: NDA Completo
   */
  const testCase7_NDA_Complete: TestCase = {
    name: "NDA - Caso completo con devolución y penalidad",
    payload: {
      documentType: "nda",
      jurisdiction: "cordoba",
      tone: "formal_technical",
      revelador_nombre: "Tech Startup SA",
      revelador_doc: "30-33333333-3",
      revelador_domicilio: "San Martín 500, Córdoba",
      receptor_nombre: "Consultor Legal SRL",
      receptor_doc: "20-44444444-4",
      receptor_domicilio: "Av. Colón 1000, Córdoba",
      definicion_informacion: "Información confidencial incluyendo código fuente, algoritmos propietarios, estrategias de marketing, listas de clientes, información financiera, y cualquier dato que pueda considerarse sensible o competitivo",
      finalidad_permitida: "Análisis técnico y legal para evaluación de inversión y due diligence",
      exclusiones: "Información de dominio público, información previamente conocida por el receptor, información desarrollada independientemente sin acceso a la información confidencial",
      plazo_confidencialidad: 5,
      inicio_vigencia: "2025-03-01",
      devolucion_destruccion: true,
      plazo_devolucion: 30,
      penalidad_incumplimiento: "ARS 5.000.000 o el equivalente a 10 veces el valor del daño causado, el que sea mayor",
    },
    expectedStatus: 200,
    validateResponse: (response) => {
      console.log("  ✓ Response OK:", response.ok);
      console.log("  ✓ Contrato length:", response.contrato?.length || 0);
      
      const contrato = response.contrato || "";
      if (!contrato.includes("devolución") && !contrato.includes("DEVOLUCIÓN")) {
        throw new Error("NDA missing return/destruction clause");
      }
      if (!contrato.includes("penalidad") && !contrato.includes("PENALIDAD")) {
        throw new Error("NDA missing breach penalty clause");
      }
    },
    validatePersistence: async (documentId: string) => {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      });
      
      const version = doc?.versions[0];
      if (!version) throw new Error("Version not found");
      
      const clausePlan = version.clausePlan as any;
      if (!clausePlan.optional.includes("devolucion_destruccion")) {
        throw new Error("devolucion_destruccion should be in optional clauses");
      }
      if (!clausePlan.optional.includes("penalidad_incumplimiento")) {
        throw new Error("penalidad_incumplimiento should be in optional clauses");
      }
      
      const structuredData = version.structuredData as any;
      if (!structuredData.devolucion_destruccion) {
        throw new Error("devolucion_destruccion not in structuredData");
      }
      if (!structuredData.penalidad_incumplimiento) {
        throw new Error("penalidad_incumplimiento not in structuredData");
      }
    },
  };

  /**
   * Test Case 8: NDA Inválido
   */
  const testCase8_NDA_Invalid: TestCase = {
    name: "NDA - Caso inválido - Devolución sin plazo",
    payload: {
      documentType: "nda",
      jurisdiction: "caba",
      tone: "commercial_clear",
      revelador_nombre: "Test Revelador",
      revelador_doc: "30-55555555-5",
      revelador_domicilio: "Test Address",
      receptor_nombre: "Test Receptor",
      receptor_doc: "20-66666666-6",
      receptor_domicilio: "Test Address",
      definicion_informacion: "Información confidencial",
      finalidad_permitida: "Evaluación",
      plazo_confidencialidad: 2,
      inicio_vigencia: "2025-02-01",
      // ERROR: devolucion_destruccion activado sin plazo_devolucion
      devolucion_destruccion: true,
      // plazo_devolucion: missing
    },
    expectedStatus: 400,
    validateResponse: (response) => {
      console.log("  ✓ Error response (expected):", response.error || response.message);
      if (response.ok !== false) {
        throw new Error("Expected ok: false for invalid case");
      }
    },
  };

  /**
   * Test Case 9: NDA con Warnings
   */
  const testCase9_NDA_Warnings: TestCase = {
    name: "NDA - Caso con warnings - Plazo corto y sin devolución",
    payload: {
      documentType: "nda",
      jurisdiction: "buenos_aires",
      tone: "balanced_professional",
      revelador_nombre: "Empresa Test SA",
      revelador_doc: "30-77777777-7",
      revelador_domicilio: "Test Address",
      receptor_nombre: "Consultor Test SRL",
      receptor_doc: "20-88888888-8",
      receptor_domicilio: "Test Address",
      definicion_informacion: "Información técnica y comercial relacionada con productos y servicios",
      finalidad_permitida: "Análisis de propuesta comercial",
      exclusiones: "Info pública",
      plazo_confidencialidad: 1, // Muy corto (< 2 años)
      inicio_vigencia: "2025-02-01",
      // Sin devolucion_destruccion
    },
    expectedStatus: 200,
    validateResponse: (response) => {
      console.log("  ✓ Response OK:", response.ok);
      console.log("  ✓ Warnings count:", response.warnings?.length || 0);
      
      if (!response.warnings || response.warnings.length === 0) {
        throw new Error("Expected warnings for this case");
      }
      
      const warningIds = response.warnings.map((w: any) => w.ruleId);
      if (!warningIds.includes("plazo_muy_corto")) {
        throw new Error("Expected plazo_muy_corto warning");
      }
      if (!warningIds.includes("sin_devolucion")) {
        throw new Error("Expected sin_devolucion warning");
      }
    },
  };

  /**
   * Test Case 10: Legal Notice Mínimo válido
   */
  const testCase10_LegalNotice_Minimal: TestCase = {
    name: "Legal Notice - Caso mínimo válido",
    payload: {
      documentType: "legal_notice",
      jurisdiction: "caba",
      tone: "formal_technical",
      remitente_nombre: "Empresa Reclamante SA",
      remitente_doc: "30-11111111-1",
      remitente_domicilio: "Av. Corrientes 1000, CABA",
      destinatario_nombre: "Deudor Moroso SRL",
      destinatario_doc: "20-22222222-2",
      destinatario_domicilio: "Av. Santa Fe 2000, CABA",
      relacion_previa: "Contrato de servicios celebrado el 15 de enero de 2024",
      hechos: "El 15 de enero de 2024 se celebró un contrato de servicios. Se facturaron servicios por un total de ARS 500.000 correspondientes a los meses de enero, febrero y marzo de 2024. Las facturas fueron emitidas y entregadas en tiempo y forma",
      incumplimiento: "El destinatario no ha realizado el pago de las facturas mencionadas, a pesar de haber transcurrido más de 90 días desde su vencimiento",
      intimacion: "Se intima al destinatario a pagar la suma de ARS 500.000 más intereses y costas dentro del plazo establecido",
      plazo_cumplimiento: "10_dias",
    },
    expectedStatus: 200,
    validateResponse: (response) => {
      console.log("  ✓ Response OK:", response.ok);
      console.log("  ✓ Document ID:", response.documentId);
      console.log("  ✓ Contrato length:", response.contrato?.length || 0);
      
      if (!response.ok) throw new Error("Expected ok: true");
      if (!response.documentId) throw new Error("Missing documentId");
      
      const contrato = response.contrato || "";
      if (!contrato.includes("CARTA DOCUMENTO") && !contrato.includes("Carta Documento")) {
        throw new Error("Legal Notice missing title");
      }
      if (!contrato.includes("INTIMACIÓN") && !contrato.includes("Intimación")) {
        throw new Error("Legal Notice missing intimation clause");
      }
    },
    validatePersistence: async (documentId: string) => {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      });
      
      if (!doc) throw new Error("Document not found in DB");
      
      const version = doc.versions[0];
      if (!version) throw new Error("Version not found");
      
      const structuredData = version.structuredData as any;
      if (structuredData.remitente_nombre !== "Empresa Reclamante SA") {
        throw new Error("structuredData.remitente_nombre mismatch");
      }
      if (!structuredData.intimacion) {
        throw new Error("intimacion not in structuredData");
      }
      
      const clausePlan = version.clausePlan as any;
      if (!clausePlan.required.includes("intimacion")) {
        throw new Error("intimacion should be in required clauses");
      }
    },
  };

  /**
   * Test Case 11: Legal Notice Completo
   */
  const testCase11_LegalNotice_Complete: TestCase = {
    name: "Legal Notice - Caso completo con apercibimiento",
    payload: {
      documentType: "legal_notice",
      jurisdiction: "cordoba",
      tone: "formal_technical",
      remitente_nombre: "Estudio Legal Avanzado SA",
      remitente_doc: "30-33333333-3",
      remitente_domicilio: "San Martín 500, Córdoba",
      destinatario_nombre: "Empresa Incumplidora SRL",
      destinatario_doc: "20-44444444-4",
      destinatario_domicilio: "Av. Colón 1000, Córdoba",
      relacion_previa: "Contrato de locación comercial celebrado el 1 de enero de 2023, con vigencia hasta el 31 de diciembre de 2024",
      hechos: "El 1 de enero de 2023 se celebró un contrato de locación comercial. El inquilino se comprometió a pagar un alquiler mensual de ARS 200.000. Desde el mes de octubre de 2024, el inquilino ha dejado de pagar el alquiler correspondiente",
      incumplimiento: "El destinatario ha incumplido con el pago de los alquileres correspondientes a los meses de octubre, noviembre y diciembre de 2024, totalizando ARS 600.000",
      intimacion: "Se intima al destinatario a pagar la suma de ARS 600.000 más intereses moratorios calculados al 3% mensual desde la fecha de vencimiento de cada cuota, más costas y honorarios, dentro del plazo establecido",
      plazo_cumplimiento: "15_dias",
      apercibimiento: "En caso de incumplimiento, se iniciará acción ejecutiva por el total adeudado más intereses, costas y honorarios, y se solicitará el desalojo del inmueble",
    },
    expectedStatus: 200,
    validateResponse: (response) => {
      console.log("  ✓ Response OK:", response.ok);
      
      const contrato = response.contrato || "";
      if (!contrato.includes("apercibimiento") && !contrato.includes("APERCIBIMIENTO")) {
        throw new Error("Legal Notice missing warning clause");
      }
    },
    validatePersistence: async (documentId: string) => {
      const doc = await prisma.document.findUnique({
        where: { id: documentId },
        include: {
          versions: {
            orderBy: { versionNumber: "desc" },
            take: 1,
          },
        },
      });
      
      const version = doc?.versions[0];
      if (!version) throw new Error("Version not found");
      
      const clausePlan = version.clausePlan as any;
      if (!clausePlan.optional.includes("apercibimiento")) {
        throw new Error("apercibimiento should be in optional clauses");
      }
      
      const structuredData = version.structuredData as any;
      if (!structuredData.apercibimiento) {
        throw new Error("apercibimiento not in structuredData");
      }
    },
  };

  /**
   * Test Case 12: Legal Notice Inválido
   */
  const testCase12_LegalNotice_Invalid: TestCase = {
    name: "Legal Notice - Caso inválido - Intimación muy corta",
    payload: {
      documentType: "legal_notice",
      jurisdiction: "caba",
      tone: "commercial_clear",
      remitente_nombre: "Test Remitente",
      remitente_doc: "30-55555555-5",
      remitente_domicilio: "Test Address",
      destinatario_nombre: "Test Destinatario",
      destinatario_doc: "20-66666666-6",
      destinatario_domicilio: "Test Address",
      relacion_previa: "Contrato previo",
      hechos: "Hechos relevantes que dan origen a la presente comunicación",
      incumplimiento: "Incumplimiento de obligaciones contractuales",
      intimacion: "Pagar", // Muy corta (< 30 caracteres)
      plazo_cumplimiento: "5_dias",
    },
    expectedStatus: 400,
    validateResponse: (response) => {
      console.log("  ✓ Error response (expected):", response.error || response.message);
      if (response.ok !== false) {
        throw new Error("Expected ok: false for invalid case");
      }
    },
  };

  /**
   * Test Case 13: Legal Notice con Warnings
   */
  const testCase13_LegalNotice_Warnings: TestCase = {
    name: "Legal Notice - Caso con warnings - Intimación ambigua",
    payload: {
      documentType: "legal_notice",
      jurisdiction: "buenos_aires",
      tone: "balanced_professional",
      remitente_nombre: "Empresa Test SA",
      remitente_doc: "30-77777777-7",
      remitente_domicilio: "Test Address",
      destinatario_nombre: "Deudor Test SRL",
      destinatario_doc: "20-88888888-8",
      destinatario_domicilio: "Test Address",
      relacion_previa: "Contrato", // Muy corto (< 30 caracteres)
      hechos: "El destinatario debe cumplir con sus obligaciones contractuales y resolver la situación pendiente",
      incumplimiento: "Incumplimiento de pago",
      intimacion: "Cumplir con las obligaciones pendientes y resolver la situación", // Ambigua
      plazo_cumplimiento: "10_dias",
      apercibimiento: "Acciones legales", // Muy corto (< 40 caracteres)
    },
    expectedStatus: 200,
    validateResponse: (response) => {
      console.log("  ✓ Response OK:", response.ok);
      console.log("  ✓ Warnings count:", response.warnings?.length || 0);
      
      if (!response.warnings || response.warnings.length === 0) {
        throw new Error("Expected warnings for this case");
      }
      
      const warningIds = response.warnings.map((w: any) => w.ruleId);
      if (!warningIds.includes("intimacion_ambigua")) {
        throw new Error("Expected intimacion_ambigua warning");
      }
      if (!warningIds.includes("sin_relacion_previa")) {
        throw new Error("Expected sin_relacion_previa warning");
      }
    },
  };

  const testCases: TestCase[] = [
    testCase1_Minimal,
    testCase2_Complete,
    testCase3_Invalid,
    testCase4_Warnings,
    testCase5_BackwardCompatible,
    testCase6_NDA_Minimal,
    testCase7_NDA_Complete,
    testCase8_NDA_Invalid,
    testCase9_NDA_Warnings,
    testCase10_LegalNotice_Minimal,
    testCase11_LegalNotice_Complete,
    testCase12_LegalNotice_Invalid,
    testCase13_LegalNotice_Warnings,
  ];
  
  const results: boolean[] = [];
  
  for (const testCase of testCases) {
    const passed = await runTestCase(testCase);
    results.push(passed);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 Test Results Summary");
  console.log("=".repeat(60));
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  testCases.forEach((testCase, i) => {
    const status = results[i] ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${testCase.name}`);
  });
  
  console.log("\n" + "─".repeat(60));
  console.log(`Total: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log("🎉 All tests passed!");
    process.exit(0);
  } else {
    console.log("⚠️  Some tests failed");
    process.exit(1);
  }
}

// Run tests
main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

