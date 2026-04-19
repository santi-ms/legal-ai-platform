/**
 * Integration test: Mercado Pago webhook resilience
 *
 * The webhook endpoint MUST always respond 200 so that Mercado Pago
 * doesn't retry indefinitely — even when the payload is invalid,
 * the signature is missing/wrong, or the event type is unknown.
 *
 * These tests do NOT test real MP payment processing (that would
 * require a live MP account and real subscription IDs).  Instead they
 * verify:
 *
 *   1. Empty body             → 200 { ok: true }
 *   2. Missing data.id        → 200 { ok: true }
 *   3. Unknown event type     → 200 { ok: true }
 *   4. Invalid/missing signature → 200 { ok: true }  (silently discards)
 *   5. Malformed JSON         → non-crash (400 from Fastify body parser is OK)
 *
 * Run with: npx tsx scripts/test-webhook-mp.ts
 */

const API_URL = process.env.API_URL || "http://localhost:4001";

// --------------------------------------------------------------------------
// Helpers
// --------------------------------------------------------------------------

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

interface TestCase {
  name: string;
  body: unknown;
  headers?: Record<string, string>;
  /** If true, we accept 400 (from Fastify JSON parser) in addition to 200 */
  allowBadRequest?: boolean;
  expectedStatus?: number;
}

async function runWebhookTest(tc: TestCase): Promise<boolean> {
  console.log(`\n🧪 ${tc.name}`);
  console.log("─".repeat(60));
  try {
    const res = await fetch(`${API_URL}/api/webhooks/mercado-pago`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(tc.headers ?? {}) },
      body: typeof tc.body === "string" ? tc.body : JSON.stringify(tc.body),
    });

    const expected = tc.expectedStatus ?? 200;
    const acceptable = tc.allowBadRequest
      ? [200, 400]
      : [expected];

    if (!acceptable.includes(res.status)) {
      let text: string;
      try { text = await res.text(); } catch { text = "<unreadable>"; }
      console.error(`  ❌ Got HTTP ${res.status}, expected ${acceptable.join(" or ")}`);
      console.error(`  Body: ${text.slice(0, 200)}`);
      return false;
    }

    // For 200 responses, ensure we get JSON { ok: true }
    if (res.status === 200) {
      let data: any;
      try { data = await res.json(); } catch { data = null; }
      if (!data?.ok) {
        console.error("  ❌ Expected { ok: true } in 200 response body");
        return false;
      }
      console.log("  ✓ 200 { ok: true }");
    } else {
      console.log(`  ✓ ${res.status} (parser-level rejection — acceptable)`);
    }

    console.log(`  ✅ Passed`);
    return true;
  } catch (err: any) {
    console.error(`  ❌ Fetch threw: ${err.message}`);
    return false;
  }
}

// --------------------------------------------------------------------------
// Test definitions
// --------------------------------------------------------------------------

const testCases: TestCase[] = [
  {
    name: "Test 1: Empty body ({})",
    body: {},
  },
  {
    name: "Test 2: Missing data.id — should not crash",
    body: { type: "subscription_preapproval", data: {} },
  },
  {
    name: "Test 3: Unknown event type",
    body: { type: "unknown_future_event", data: { id: "12345" } },
  },
  {
    name: "Test 4: Invalid HMAC signature header — silently discarded",
    body: { type: "subscription_preapproval", data: { id: "fake-id-99999" } },
    headers: {
      "x-signature": "ts=0000000000,v1=invalidsignature",
      "x-request-id": "test-request-id-001",
    },
  },
  {
    name: "Test 5: No signature headers — falls through (MP_WEBHOOK_SECRET may be unset in test env)",
    body: {
      type: "payment",
      data: { id: "fake-payment-id-00001" },
    },
  },
  {
    name: "Test 6: Malformed JSON string",
    body: "{ this is not valid json !!!",
    allowBadRequest: true,
  },
  {
    name: "Test 7: Subscription type with valid JSON structure but nonexistent tenant",
    body: {
      type: "subscription_preapproval",
      data: { id: "nonexistent-preapproval-abc123" },
      // No x-signature → signature check skipped (only if MP_WEBHOOK_SECRET unset)
    },
  },
];

// --------------------------------------------------------------------------
// Main
// --------------------------------------------------------------------------

async function main() {
  console.log("🚀 Mercado Pago Webhook Resilience Tests");
  console.log("=".repeat(60));
  console.log(`API: ${API_URL}`);
  console.log(
    "\nNote: These tests verify the webhook never crashes the server."
  );
  console.log(
    "      Real subscription/payment effects are NOT verified here."
  );
  console.log("=".repeat(60));

  const ready = await waitForBackend();
  if (!ready) {
    console.error("❌ Backend unavailable — start the server with: npm run dev");
    process.exit(1);
  }

  const results: boolean[] = [];
  for (const tc of testCases) {
    results.push(await runWebhookTest(tc));
  }

  const passed = results.filter(Boolean).length;
  const failed = results.length - passed;

  console.log("\n" + "=".repeat(60));
  console.log(`Results: ${passed} passed, ${failed} failed out of ${results.length}`);
  if (failed > 0) {
    console.log("❌ Some webhook tests failed");
    process.exit(1);
  }
  console.log("✅ All webhook resilience tests passed");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
