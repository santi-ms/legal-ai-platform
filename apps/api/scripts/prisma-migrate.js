#!/usr/bin/env node
import { existsSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

function p(...parts) { return path.resolve(...parts.filter(Boolean)); }

const cwd = process.cwd();
const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
const mode = process.argv[2] || "deploy"; // "dev" o "deploy"
const args = mode === "dev" ? ["migrate", "dev"] : ["migrate", "deploy"];

const candidates = [
  process.env.PRISMA_SCHEMA_PATH,
  p(here, "../..", "packages/db/prisma/schema.prisma"),
  p(here, "../../..", "packages/db/prisma/schema.prisma"),
  process.env.INIT_CWD && p(process.env.INIT_CWD, "packages/db/prisma/schema.prisma"),
  p("/app", "packages/db/prisma/schema.prisma"),
  p(cwd, "packages/db/prisma/schema.prisma"),
  p(here, "..", "prisma/schema.prisma"),
  p(cwd, "prisma/schema.prisma"),
].filter(Boolean);

const found = candidates.find((f) => existsSync(f));
if (!found) {
  console.warn(`[prisma-migrate] ⚠️ Schema no encontrado. Modo ${mode}. Omito migración sin romper el build.`);
  console.warn("[prisma-migrate] CWD:", cwd);
  console.warn("[prisma-migrate] __dirname:", here);
  console.warn("[prisma-migrate] Rutas probadas:");
  for (const c of candidates) console.warn("  -", c);
  process.exit(0);
}

console.log(`[prisma-migrate] ✅ Usando schema: ${found} | modo: ${mode}`);
const res = spawnSync("npx", ["prisma", ...args, "--schema", found], {
  stdio: "inherit",
  shell: true,
});
process.exit(res.status ?? 0);
