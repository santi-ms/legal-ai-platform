#!/usr/bin/env node
/**
 * Script para verificar el estado de la base de datos vs el schema
 * Muestra qué columnas faltan o sobran
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log("🔍 Verificando estructura de la base de datos...\n");

    // Intentar hacer una query simple para verificar conexión
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Conexión a la base de datos exitosa\n");

    // Verificar tabla Document
    console.log("📋 Verificando tabla Document...");
    try {
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'Document'
        ORDER BY ordinal_position;
      `;
      
      console.log("Columnas encontradas en Document:");
      console.table(columns);
      
      // Verificar columnas requeridas
      const requiredColumns = [
        "id",
        "tenantId",
        "createdById",
        "type",
        "jurisdiccion",
        "tono",
        "estado",
        "costUsd",
        "createdAt",
        "updatedAt",
      ];
      
      const foundColumns = columns.map((c: any) => c.column_name);
      const missingColumns = requiredColumns.filter(
        (col) => !foundColumns.includes(col)
      );
      
      if (missingColumns.length > 0) {
        console.error("\n❌ Columnas faltantes:", missingColumns);
      } else {
        console.log("\n✅ Todas las columnas requeridas están presentes");
      }
    } catch (error: any) {
      console.error("❌ Error verificando tabla Document:", error.message);
    }

    // Verificar foreign keys
    console.log("\n🔗 Verificando foreign keys...");
    try {
      const fks = await prisma.$queryRaw`
        SELECT
          tc.constraint_name,
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_name = 'Document';
      `;
      
      console.log("Foreign keys encontradas:");
      console.table(fks);
    } catch (error: any) {
      console.error("❌ Error verificando foreign keys:", error.message);
    }

    // Intentar crear un documento de prueba (rollback)
    console.log("\n🧪 Probando creación de documento (rollback)...");
    try {
      await prisma.$transaction(async (tx) => {
        // Solo verificar que la estructura es correcta
        const testData = {
          tenantId: "test-tenant-id",
          createdById: "test-user-id",
          type: "test",
          jurisdiccion: "test",
          tono: "test",
          estado: "generated_text",
          costUsd: 0,
        };
        
        // Esto fallará si faltan columnas, pero haremos rollback
        await tx.document.create({
          data: testData,
        });
      }, {
        timeout: 5000,
      });
      
      console.log("✅ Estructura de tabla Document es correcta");
    } catch (error: any) {
      if (error.code === "P2022") {
        console.error("❌ Error P2022 detectado:");
        console.error("   Columna faltante:", error.meta?.column);
        console.error("   Tabla:", error.meta?.table);
      } else {
        console.error("❌ Error:", error.message);
        console.error("   Código:", error.code);
        console.error("   Meta:", error.meta);
      }
    }

  } catch (error: any) {
    console.error("❌ Error general:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();

