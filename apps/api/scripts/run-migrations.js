#!/usr/bin/env node
/**
 * Script para ejecutar migraciones manualmente
 * Uso: node scripts/run-migrations.js
 */

import { execSync } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.resolve(__dirname, "../prisma/schema.prisma");

if (!existsSync(schemaPath)) {
  console.error("❌ No se encontró schema.prisma en:", schemaPath);
  process.exit(1);
}

console.log("🔄 Ejecutando migraciones de Prisma...");
console.log("📋 Schema:", schemaPath);

try {
  execSync(`npx prisma migrate deploy --schema "${schemaPath}"`, {
    stdio: "inherit",
    env: process.env,
  });
  console.log("✅ Migraciones aplicadas correctamente");
} catch (error) {
  console.error("❌ Error ejecutando migraciones:", error.message);
  process.exit(1);
}

