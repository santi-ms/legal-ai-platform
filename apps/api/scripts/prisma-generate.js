#!/usr/bin/env node
import { existsSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

function p(...parts) {
  return path.resolve(...parts.filter(Boolean));
}

const cwd = process.cwd();
const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

// 1) Env override explícito
const envSchema = process.env.PRISMA_SCHEMA_PATH;

// 2) Candidatos habituales (local primero, luego monorepo como fallback)
const candidates = [
  envSchema,
  // Schema local (service-only deploy - Railway)
  p(here, "..", "prisma/schema.prisma"),
  p(cwd, "prisma/schema.prisma"),
  // Schema central (monorepo - desarrollo local)
  p(here, "../..", "packages/db/prisma/schema.prisma"),
  p(here, "../../..", "packages/db/prisma/schema.prisma"),
  process.env.INIT_CWD && p(process.env.INIT_CWD, "packages/db/prisma/schema.prisma"),
].filter(Boolean);

const found = candidates.find((f) => existsSync(f));

// ¿Ya existe @prisma/client generado?
const clientExists = existsSync(p(cwd, "node_modules/@prisma/client/index.js"));

if (!found) {
  console.warn("[prisma-generate] ⚠️ No se encontró schema.prisma en el entorno de build.");
  console.warn("[prisma-generate] CWD:", cwd);
  console.warn("[prisma-generate] __dirname:", here);
  console.warn("[prisma-generate] Rutas probadas:");
  for (const c of candidates) console.warn("  -", c);

  if (clientExists) {
    console.warn("[prisma-generate] ℹ️ @prisma/client ya existe; omito generate para no romper el build.");
    process.exit(0);
  } else {
    console.warn("[prisma-generate] ℹ️ Omitiendo generate. Generá el cliente cuando el schema esté disponible (p.ej., en migrate:deploy).");
    process.exit(0); // <- no romper el build
  }
}

console.log("[prisma-generate] ✅ Usando schema:", found);
const res = spawnSync("npx", ["prisma", "generate", "--schema", found], {
  stdio: "inherit",
  shell: true,
});
process.exit(res.status ?? 0);
