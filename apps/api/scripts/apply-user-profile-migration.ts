/**
 * Script para aplicar la migración de campos de perfil de usuario
 * Ejecuta el SQL directamente si Prisma migrate no funciona
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log("🔧 Aplicando migración para agregar campos bio y notificationPreferences...");

    // Ejecutar SQL directamente
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "User" 
      ADD COLUMN IF NOT EXISTS "bio" TEXT,
      ADD COLUMN IF NOT EXISTS "notificationPreferences" JSONB;
    `);

    console.log("✅ Migración aplicada exitosamente");

    // Verificar que las columnas existan
    const result = await prisma.$queryRawUnsafe<Array<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>>(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'User' 
      AND column_name IN ('bio', 'notificationPreferences')
      ORDER BY column_name;
    `);

    console.log("\n📋 Columnas verificadas:");
    result.forEach((col) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });

    if (result.length === 2) {
      console.log("\n✅ Todas las columnas están presentes. La migración fue exitosa.");
    } else {
      console.log("\n⚠️  Algunas columnas pueden estar faltando. Verifica manualmente.");
    }
  } catch (error: any) {
    if (error.message?.includes("already exists") || error.message?.includes("duplicate")) {
      console.log("✅ Las columnas ya existen. No se requiere acción adicional.");
    } else {
      console.error("❌ Error al aplicar migración:", error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log("\n✨ Proceso completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Error fatal:", error);
    process.exit(1);
  });

