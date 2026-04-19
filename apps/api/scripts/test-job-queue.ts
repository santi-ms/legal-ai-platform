/**
 * Integration test: Async generation job queue
 *
 * Verifies the full flow introduced when the in-memory Map was replaced
 * with a DB-backed GenerationJob table:
 *   1. POST /documents/generate → 202 + { jobId }
 *   2. GET  /documents/jobs/:jobId → eventually { status: "done", documentId, contrato, ... }
 *   3. Document + DocumentVersion persisted in DB
 *   4. Job row present in GenerationJob table
 *   5. Non-existent job returns 404
 */

import { PrismaClient } from "@prisma/client";

const API_URL = process.env.API_URL || "http://localhost:4001";
const prisma = new PrismaClient();

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

/** Poll /documents/jobs/:jobId until done/error or timeout (ms). */
async function pollJob(
  jobId: string,
  timeoutMs = 120_000,
  intervalMs = 2_000
): Promise<{ ok: boolean; status: string; [k: string]: unknown }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const res = await fetch(`${API_URL}/documents/jobs/${jobId}`);
    const data: any = await res.json();

    if (data.status === "done" || data.status === "error") {
      return data;
    }

    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Job ${jobId} timed out after ${timeoutMs / 1000}s`);
}

/** Wait until the API is reachable. */
async function waitForBackend(maxAttempts = 30): Promise<boolean> {
  process.stdout.write("⏳ Waiting for backend");
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${API_URL}/healthz`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (res.ok) {
        process.stdout.write(" ✅\n");
        return true;
      }
    } catch {
      /* keep waiting */
    }
    process.stdout.write(".");
    await new Promise((r) => setTimeout(r, 1_000));
  }
  process.stdout.write(" ❌\n");
  return false;
}

// --------------------------------------------------------------------------
// Test cases
// --------------------------------------------------------------------------

async function testAsyncJobFlow(): Promise<boolean> {
  console.log("\n🧪 Test 1: Async generation job flow (202 → polling → done)");
  console.log("─".repeat(60));

  // Step 1 — initiate generation
  const res = await fetch(`${API_URL}/documents/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentType: "service_contract",
      jurisdiction: "caba",
      tone: "commercial_clear",
      proveedor_nombre: "Test Provider SRL",
      proveedor_doc: "20-12345678-9",
      proveedor_domicilio: "Av. Corrientes 1000, CABA",
      cliente_nombre: "Test Client SA",
      cliente_doc: "30-98765432-1",
      cliente_domicilio: "Av. Santa Fe 2000, CABA",
      descripcion_servicio: "Servicios de consultoría técnica mensual",
      monto: "100000",
      moneda: "ARS",
      periodicidad: "mensual",
      forma_pago: "transferencia_bancaria",
      plazo_pago: "30_dias",
      preferencias_fiscales: "responsable_inscripto",
      inicio_vigencia: "2025-05-01",
      plazo_minimo_meses: 12,
    }),
  });

  const init = await res.json() as any;

  if (res.status !== 202) {
    console.error(`  ❌ Expected 202, got ${res.status}`);
    console.error("  Response:", JSON.stringify(init, null, 2));
    return false;
  }
  if (!init.jobId || typeof init.jobId !== "string") {
    console.error("  ❌ Missing or invalid jobId in 202 response");
    return false;
  }
  console.log(`  ✓ Got 202 with jobId: ${init.jobId}`);

  // Step 2 — verify DB row created with status "pending"
  const pendingJob = await prisma.generationJob.findUnique({
    where: { id: init.jobId },
  });
  if (!pendingJob) {
    console.error("  ❌ GenerationJob row not found in DB immediately after 202");
    return false;
  }
  if (pendingJob.status !== "pending" && pendingJob.status !== "done") {
    // might have finished synchronously in a fast test env
    console.error(`  ❌ Unexpected initial status: ${pendingJob.status}`);
    return false;
  }
  console.log(`  ✓ GenerationJob in DB with status: ${pendingJob.status}`);

  // Step 3 — poll until done
  console.log("  ⏳ Polling for completion");
  process.stdout.write("  ");
  const result = await pollJob(init.jobId);
  process.stdout.write("\n");

  if (result.status !== "done") {
    console.error(`  ❌ Job ended with status: ${result.status} — ${result.message}`);
    return false;
  }
  console.log(`  ✓ Job completed with status: ${result.status}`);

  if (!result.documentId || typeof result.documentId !== "string") {
    console.error("  ❌ Missing documentId in done result");
    return false;
  }
  console.log(`  ✓ documentId: ${result.documentId}`);

  if (!result.contrato || (result.contrato as string).length < 100) {
    console.error("  ❌ contrato missing or too short");
    return false;
  }
  console.log(`  ✓ contrato length: ${(result.contrato as string).length}`);

  // Step 4 — verify final DB state of GenerationJob
  const doneJob = await prisma.generationJob.findUnique({
    where: { id: init.jobId },
  });
  if (!doneJob) {
    console.error("  ❌ GenerationJob row missing from DB after completion");
    return false;
  }
  if (doneJob.status !== "done") {
    console.error(`  ❌ GenerationJob.status in DB is "${doneJob.status}", expected "done"`);
    return false;
  }
  console.log(`  ✓ GenerationJob persisted with status: ${doneJob.status}`);

  // Step 5 — verify Document + DocumentVersion persisted
  const doc = await prisma.document.findUnique({
    where: { id: result.documentId as string },
    include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
  });
  if (!doc) {
    console.error("  ❌ Document not found in DB");
    return false;
  }
  if (!doc.versions[0]) {
    console.error("  ❌ DocumentVersion not found in DB");
    return false;
  }
  console.log(`  ✓ Document in DB: type=${doc.type} estado=${doc.estado}`);
  console.log(`  ✓ DocumentVersion: versionNumber=${doc.versions[0].versionNumber}`);

  console.log("  ✅ Test 1 passed");
  return true;
}

// --------------------------------------------------------------------------

async function testJobNotFound(): Promise<boolean> {
  console.log("\n🧪 Test 2: Poll a non-existent job returns 404");
  console.log("─".repeat(60));

  const res = await fetch(
    `${API_URL}/documents/jobs/job_nonexistent_0000000`
  );
  const data = await res.json() as any;

  if (res.status !== 404) {
    console.error(`  ❌ Expected 404, got ${res.status}`);
    return false;
  }
  if (data.error !== "JOB_NOT_FOUND") {
    console.error(`  ❌ Expected error "JOB_NOT_FOUND", got "${data.error}"`);
    return false;
  }
  console.log(`  ✓ 404 JOB_NOT_FOUND as expected`);
  console.log("  ✅ Test 2 passed");
  return true;
}

// --------------------------------------------------------------------------

async function testGenerateValidation(): Promise<boolean> {
  console.log("\n🧪 Test 3: Validation errors return 400 (synchronous, before job creation)");
  console.log("─".repeat(60));

  const res = await fetch(`${API_URL}/documents/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      documentType: "service_contract",
      jurisdiction: "caba",
      tone: "commercial_clear",
      // Missing required fields — should fail validation synchronously
    }),
  });

  const data = await res.json() as any;

  if (res.status !== 400) {
    console.error(`  ❌ Expected 400, got ${res.status}`);
    console.error("  Response:", JSON.stringify(data, null, 2));
    return false;
  }
  if (data.ok !== false) {
    console.error("  ❌ Expected ok: false");
    return false;
  }
  console.log(`  ✓ 400 validation error: ${data.message?.slice(0, 80)}`);
  console.log("  ✅ Test 3 passed");
  return true;
}

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main() {
  console.log("🚀 Job Queue Integration Tests");
  console.log("=".repeat(60));
  console.log(`API: ${API_URL}`);
  console.log("=".repeat(60));

  const ready = await waitForBackend();
  if (!ready) {
    console.error("❌ Backend unavailable — start the server with: npm run dev");
    process.exit(1);
  }

  const results: boolean[] = [];

  results.push(await testJobNotFound());           // fast, no AI call
  results.push(await testGenerateValidation());    // fast, no AI call
  results.push(await testAsyncJobFlow());          // slow — involves Claude

  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length}`);
  if (failed > 0) {
    console.log("❌ Some tests failed");
    process.exit(1);
  }
  console.log("✅ All job queue tests passed");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
