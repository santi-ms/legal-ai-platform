#!/usr/bin/env node
// apps/api/scripts/prisma-migrate.js
import { existsSync } from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const here = path.resolve(__dirname);
const candidates = [
  // relativo al paquete api (desde apps/api/scripts/)
  path.resolve(here, "../..", "packages/db/prisma/schema.prisma"),
  path.resolve(here, "../../..", "packages/db/prisma/schema.prisma"),
  // relativo al repo root si INIT_CWD apunta allí
  process.env.INIT_CWD
    ? path.resolve(process.env.INIT_CWD, "packages/db/prisma/schema.prisma")
    : null,
  // fallback por si el build corre desde /app (Railway, Docker, etc.)
  path.resolve("/", "app", "packages/db/prisma/schema.prisma"),
  // variantes locales desde process.cwd()
  path.resolve(process.cwd(), "packages/db/prisma/schema.prisma"),
  path.resolve(process.cwd(), "..", "packages/db/prisma/schema.prisma"),
].filter(Boolean);

const schema = candidates.find(p => existsSync(p));

if (!schema) {
  console.error("[prisma-migrate] ❌ No se encontró schema.prisma. Probé:");
  candidates.forEach(c => console.error("  -", c));
  console.error("[prisma-migrate] CWD actual:", process.cwd());
  console.error("[prisma-migrate] __dirname:", __dirname);
  process.exit(1);
}

const mode = process.argv[2] || "deploy"; // "dev" o "deploy"
const args = mode === "dev" 
  ? ["migrate", "dev"] 
  : ["migrate", "deploy"];

// Si es migrate:dev, permitir pasar argumentos adicionales (ej: --name)
if (mode === "dev" && process.argv.length > 3) {
  args.push(...process.argv.slice(3));
}

console.log(`[prisma-migrate] ✅ Usando schema: ${schema}`);
console.log(`[prisma-migrate] Modo: ${mode}`);
console.log(`[prisma-migrate] CWD: ${process.cwd()}`);

const res = spawnSync("npx", ["prisma", ...args, "--schema", schema], {
  stdio: "inherit",
  shell: true,
});

if (res.status !== 0) {
  console.error(`[prisma-migrate] ❌ Error ejecutando prisma migrate ${mode}`);
  process.exit(res.status ?? 1);
}

console.log(`[prisma-migrate] ✅ Migración ${mode} completada exitosamente`);
