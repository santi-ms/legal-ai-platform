/**
 * Sincroniza el schema aislado de tests con `schema.prisma`.
 *
 * Usa `prisma db push` (no `migrate deploy`) porque:
 *   - Hay una cadena histórica de migraciones con un gap (emailVerified
 *     nunca se agrega explícitamente en un migration.sql; producción se
 *     había inicializado con `db push`).
 *   - Para una DB de test efímera, push es idempotente y simple.
 */
import "./env.js";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const apiRoot = resolve(here, "..", "..");

// eslint-disable-next-line no-console
console.log(`[migrate] db push → schema="${process.env.TEST_SCHEMA}" via pooler`);

const result = spawnSync(
  "npx.cmd",
  ["prisma", "db", "push", "--schema", "prisma/schema.prisma", "--skip-generate", "--accept-data-loss"],
  {
    cwd: apiRoot,
    stdio: "inherit",
    env: process.env,
    shell: true,
  },
);

process.exit(result.status ?? 1);
