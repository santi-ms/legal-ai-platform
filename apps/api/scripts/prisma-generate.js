#!/usr/bin/env node
// apps/api/scripts/prisma-generate.js
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
  console.error("[prisma-generate] ❌ No se encontró schema.prisma. Probé:");
  candidates.forEach(c => console.error("  -", c));
  console.error("[prisma-generate] CWD actual:", process.cwd());
  console.error("[prisma-generate] __dirname:", __dirname);
  process.exit(1);
}

console.log("[prisma-generate] ✅ Usando schema:", schema);
console.log("[prisma-generate] CWD:", process.cwd());

const res = spawnSync("npx", ["prisma", "generate", "--schema", schema], {
  stdio: "inherit",
  shell: true,
});

if (res.status !== 0) {
  console.error("[prisma-generate] ❌ Error ejecutando prisma generate");
  process.exit(res.status ?? 1);
}

console.log("[prisma-generate] ✅ Prisma Client generado exitosamente");
