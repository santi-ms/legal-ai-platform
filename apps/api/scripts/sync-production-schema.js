#!/usr/bin/env node
/**
 * Script para sincronizar el schema de Prisma con la base de datos de producción
 * Genera una migración basada en las diferencias entre la DB y el schema
 */

import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SCHEMA_PATH = path.resolve(__dirname, "../../../packages/db/prisma/schema.prisma");

console.log("🔍 Sincronizando schema de Prisma con base de datos...");
console.log(`📋 Schema path: ${SCHEMA_PATH}`);

if (!process.env.DATABASE_URL) {
  console.error("❌ Error: DATABASE_URL no está configurado");
  console.error("   Configura DATABASE_URL antes de ejecutar este script");
  process.exit(1);
}

if (!existsSync(SCHEMA_PATH)) {
  console.error(`❌ Error: No se encontró el schema en ${SCHEMA_PATH}`);
  process.exit(1);
}

try {
  console.log("\n📊 Generando migración...");
  
  // Generar migración basada en el schema actual
  execSync(
    `npx prisma migrate dev --name sync-production-schema --create-only --schema "${SCHEMA_PATH}"`,
    {
      stdio: "inherit",
      cwd: path.resolve(__dirname, "../../../packages/db"),
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    }
  );
  
  console.log("\n✅ Migración generada exitosamente");
  console.log("📝 Revisa la migración generada antes de aplicarla");
  console.log("   Para aplicar: npx prisma migrate deploy");
  
} catch (error) {
  console.error("\n❌ Error generando migración:", error.message);
  
  // Intentar generar diff manual
  console.log("\n🔄 Intentando generar diff manual...");
  try {
    const diffOutput = execSync(
      `npx prisma migrate diff --from-url "${process.env.DATABASE_URL}" --to-schema-datamodel "${SCHEMA_PATH}" --script`,
      {
        encoding: "utf-8",
        cwd: path.resolve(__dirname, "../../../packages/db"),
      }
    );
    
    if (diffOutput.trim()) {
      console.log("\n📝 Diff generado:");
      console.log(diffOutput);
      console.log("\n💡 Puedes ejecutar este SQL manualmente en Railway");
    } else {
      console.log("✅ No hay diferencias entre la base de datos y el schema");
    }
  } catch (diffError) {
    console.error("❌ Error generando diff:", diffError.message);
  }
  
  process.exit(1);
}

