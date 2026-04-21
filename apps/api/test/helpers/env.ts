/**
 * Setea variables de entorno determinísticas ANTES de importar el módulo
 * de la app. Este archivo debe importarse al principio del test runner.
 *
 * Estrategia "Opción A": usamos Supabase Postgres pero con un schema
 * dedicado (`test_e2e`). Todas las migraciones corren ahí y `TRUNCATE` sólo
 * toca ese schema — no se ensucian los datos de producción en `public`.
 */

import { config as loadDotenv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

// Cargar .env desde apps/api Y la raíz del monorepo (donde vive DIRECT_URL).
const here = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(here, "..", "..", ".env") });
loadDotenv({ path: resolve(here, "..", "..", "..", "..", ".env"), override: false });
loadDotenv({ path: resolve(here, "..", "..", "prisma", ".env"), override: false });

process.env.NODE_ENV = "test";
process.env.NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || ("test-secret-" + "x".repeat(32));
process.env.JWT_SECRET = process.env.NEXTAUTH_SECRET;
process.env.ANTHROPIC_API_KEY = "sk-ant-test-fake-key";
process.env.EMAIL_FROM = "test@doculex.local";
process.env.SUPER_ADMIN_EMAIL = "admin@doculex.test";

// Desactivar Sentry en tests
delete process.env.SENTRY_DSN;

// Nombre del schema aislado para tests.
const TEST_SCHEMA = process.env.TEST_SCHEMA || "test_e2e";
process.env.TEST_SCHEMA = TEST_SCHEMA;

function withSchema(url: string, schema: string): string {
  // Reemplaza o agrega ?schema=... en la URL de Postgres.
  const [base, query = ""] = url.split("?");
  const params = new URLSearchParams(query);
  params.set("schema", schema);
  return `${base}?${params.toString()}`;
}

// Preferimos el pooler de Supabase (IPv4) porque el endpoint directo
// (db.*.supabase.co) no responde desde Windows sin IPv6.
const poolerUrl = process.env.DATABASE_URL;
const directUrl = process.env.DIRECT_URL;
const baseUrl = poolerUrl || directUrl;
if (!baseUrl) {
  throw new Error("DATABASE_URL / DIRECT_URL no está definido en .env — los tests no pueden correr");
}

// Tanto el runtime de la app como las migraciones usan el schema de test
// vía el pooler; Prisma migrate funciona contra pgbouncer con pgbouncer=true.
const testUrl = withSchema(baseUrl, TEST_SCHEMA);
process.env.DATABASE_URL = testUrl;
process.env.DIRECT_URL = testUrl;

// Desactivar rate limit global para que no interfiera con las suites
// (los tests que prueban rate-limit lo configuran explícitamente).
process.env.DISABLE_GLOBAL_RATE_LIMIT = "1";
