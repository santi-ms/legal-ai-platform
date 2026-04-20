#!/usr/bin/env tsx
/**
 * Seed script: popula la tabla LegalCodeChunk con artículos de los códigos argentinos.
 *
 * Uso:
 *   cd apps/api
 *   npx tsx scripts/seed-legal-codes.ts
 *
 * Opciones:
 *   --reset     Borra todos los registros existentes antes de insertar (default: false)
 *   --dry-run   Muestra qué insertaría sin ejecutar nada
 *
 * Para agregar más artículos, editá apps/api/src/data/legal-codes-seed.ts
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";
import { LEGAL_CODE_SEED } from "../src/data/legal-codes-seed.js";

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const RESET   = args.includes("--reset");
const DRY_RUN = args.includes("--dry-run");

async function main() {
  console.log("╔══════════════════════════════════════════════════════╗");
  console.log("║  DocuLex — Seeding códigos legales argentinos         ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  if (DRY_RUN) {
    console.log("⚠️  DRY RUN — no se ejecutará ningún cambio en BD\n");
  }

  if (RESET && !DRY_RUN) {
    const deleted = await prisma.legalCodeChunk.deleteMany();
    console.log(`🗑  Reset: eliminados ${deleted.count} registros previos\n`);
  }

  // Count by code
  const byCodes = new Map<string, number>();
  for (const item of LEGAL_CODE_SEED) {
    byCodes.set(item.code, (byCodes.get(item.code) ?? 0) + 1);
  }

  console.log(`📋 Total artículos a insertar: ${LEGAL_CODE_SEED.length}`);
  for (const [code, count] of byCodes.entries()) {
    console.log(`   ${code.padEnd(20)} → ${count} artículos`);
  }
  console.log();

  if (DRY_RUN) {
    console.log("✅ Dry run completado — datos válidos, sin cambios en BD");
    return;
  }

  let inserted = 0;
  let skipped  = 0;
  let errors   = 0;

  for (const item of LEGAL_CODE_SEED) {
    try {
      // Use raw SQL to avoid Prisma trying to deserialize the tsvector column
      await prisma.$executeRaw`
        INSERT INTO "LegalCodeChunk"
          (id, code, jurisdiction, article, "sectionTitle", text, "updatedAt")
        VALUES
          (${randomUUID()}, ${item.code}, ${item.jurisdiction}, ${item.article},
           ${item.sectionTitle ?? null}, ${item.text}, now())
        ON CONFLICT (code, article) DO UPDATE
          SET jurisdiction  = EXCLUDED.jurisdiction,
              "sectionTitle" = EXCLUDED."sectionTitle",
              text          = EXCLUDED.text,
              "updatedAt"   = now()
      `;
      inserted++;
      process.stdout.write(`   ✓ ${item.code} Art. ${item.article.padEnd(15)}\r`);
    } catch (err: any) {
      errors++;
      console.error(`\n   ✗ Error en ${item.code} Art. ${item.article}: ${err.message}`);
    }
  }

  console.log(`\n\n╔══════════════════════════════════════════════════════╗`);
  console.log(`║  Seed completado                                       ║`);
  console.log(`║  Insertados/actualizados: ${String(inserted).padEnd(5)}                       ║`);
  if (skipped > 0) console.log(`║  Omitidos:               ${String(skipped).padEnd(5)}                       ║`);
  if (errors  > 0) console.log(`║  Errores:                ${String(errors).padEnd(5)}                       ║`);
  console.log(`╚══════════════════════════════════════════════════════╝`);

  // Verify FTS is working
  try {
    const test = await prisma.$queryRaw<any[]>`
      SELECT count(*) FROM "LegalCodeChunk" WHERE tsv IS NOT NULL
    `;
    const ftsCount = Number(test[0]?.count ?? 0);
    console.log(`\n📊 Artículos con índice FTS activo: ${ftsCount}`);
  } catch {
    console.log("\n⚠️  No se pudo verificar el índice FTS");
  }
}

main()
  .catch((err) => {
    console.error("Error fatal:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
