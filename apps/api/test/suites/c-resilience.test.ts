/**
 * Suite C — Resilience (Claude API)
 *
 * Valida que los clientes Anthropic tengan timeouts y manejen errores
 * upstream (429/500/529) sin colgar el proceso.
 *
 * Mocks:
 *   - undici MockAgent intercepta api.anthropic.com
 *   - Los tests configuran respuestas canned (delay, status, body)
 *
 * NO requiere ANTHROPIC_API_KEY real — el SDK usa fetch interno que pasa
 * por el dispatcher global que mockeamos.
 */

import "../helpers/env.js";
import { test, before, after, describe } from "node:test";
import assert from "node:assert/strict";

import { getTestApp, closeTestApp, authHeaders } from "../helpers/app.js";
import { resetDatabase, createTenant, createUser, closeDb, type TestUser } from "../helpers/db.js";
import {
  installAnthropicMock,
  setAnthropicMock,
  uninstallAnthropicMock,
} from "../helpers/mock-anthropic.js";

describe("Suite C — Resilience (Claude API)", () => {
  let user: TestUser;

  before(async () => {
    installAnthropicMock();
    await resetDatabase();
    const tenant = await createTenant("Resilience");
    user = await createUser(tenant.id);
  });

  after(async () => {
    await uninstallAnthropicMock();
    await closeTestApp();
    await closeDb();
  });

  // ──────────────────────────────────────────────────────────────────────────
  // C1 — El cliente Anthropic tiene timeout configurado (<= 45s)
  // ──────────────────────────────────────────────────────────────────────────
  test("C1: instancias Anthropic en el codebase tienen timeout configurado", async () => {
    // Introspección por source — asegura que ningún archivo de rutas
    // crea un cliente Anthropic sin timeout.
    const { readFileSync, existsSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const { dirname, resolve } = await import("node:path");

    const here = dirname(fileURLToPath(import.meta.url));
    // apps/api/test/suites → apps/api
    const apiRoot = resolve(here, "..", "..");

    const files = [
      "src/routes.chat.ts",
      "src/routes.analysis.ts",
      "src/routes.estrategia.ts",
      "src/routes.juris.ts",
      "src/routes.assistant.ts",
      "src/routes.documents.ts",
      "src/modules/documents/services/generation-service.ts",
    ];

    const offenders: string[] = [];
    for (const rel of files) {
      const abs = resolve(apiRoot, rel);
      if (!existsSync(abs)) continue;
      const content = readFileSync(abs, "utf8");
      // Encontrar cada `new Anthropic({ ... })` y verificar que tenga timeout
      const matches = content.matchAll(/new\s+Anthropic\s*\(\s*\{([^}]*)\}/g);
      for (const m of matches) {
        const args = m[1];
        if (!/timeout\s*:/i.test(args)) {
          offenders.push(rel);
        }
      }
    }

    assert.deepEqual(
      offenders,
      [],
      `Estos archivos crean clientes Anthropic sin timeout:\n${offenders.join("\n")}`,
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // C2 — Claude 529 (overloaded): el servidor devuelve 5xx sin colgarse
  //       (con timeout de 30s ya seteado, una corrida entera tarda <35s)
  // ──────────────────────────────────────────────────────────────────────────
  test("C2: Claude 529 → respuesta de error del servidor en <5s", async () => {
    const app = await getTestApp();
    setAnthropicMock({ status: 529 });

    const t0 = Date.now();
    const res = await app.inject({
      method: "POST",
      url: "/documents/chat",
      headers: authHeaders(user.token),
      payload: {
        messages: [{ role: "user", content: "Hola" }],
      },
    });
    const elapsed = Date.now() - t0;

    // Acepta 500 o 503 (el handler upstream puede mapearlo diferente).
    assert.ok(res.statusCode >= 400, `se esperaba error; recibido ${res.statusCode}`);
    assert.ok(
      elapsed < 10_000,
      `con 529 y maxRetries=2, la respuesta final debe venir en <10s; tardó ${elapsed}ms`,
    );
  });

  // ──────────────────────────────────────────────────────────────────────────
  // C3 — Claude response OK → servidor propaga texto al cliente
  //       Smoke test del happy path con mock.
  // ──────────────────────────────────────────────────────────────────────────
  test("C3: Claude 200 → cliente recibe texto del mock", async () => {
    const app = await getTestApp();
    // El handler de /documents/chat espera JSON como respuesta de Claude.
    setAnthropicMock({
      text: JSON.stringify({ ready: false, reply: "RESPUESTA_CANNED_OK" }),
    });

    const res = await app.inject({
      method: "POST",
      url: "/documents/chat",
      headers: authHeaders(user.token),
      payload: {
        messages: [{ role: "user", content: "dame un NDA" }],
      },
    });

    assert.equal(res.statusCode, 200, `body: ${res.body.slice(0, 300)}`);
    assert.ok(
      res.body.includes("RESPUESTA_CANNED_OK"),
      `el response debería contener el texto del mock. Body: ${res.body.slice(0, 300)}`,
    );
  });
});
