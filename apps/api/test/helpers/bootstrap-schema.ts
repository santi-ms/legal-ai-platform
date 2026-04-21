/**
 * Asegura que el schema aislado de tests (`test_e2e`) exista en la DB de
 * Supabase antes de correr `prisma migrate deploy`.
 *
 * Usa el Prisma client contra el schema `public` (que siempre existe) para
 * ejecutar un CREATE SCHEMA raw, evitando depender del paquete `pg`.
 *
 * Ejecutar con:
 *   node --import tsx test/helpers/bootstrap-schema.ts
 */
import "./env.js";
import { PrismaClient } from "@prisma/client";

async function main() {
  const schema = process.env.TEST_SCHEMA || "test_e2e";
  const directUrl = (process.env.DIRECT_URL || process.env.DATABASE_URL || "")
    // Nos conectamos al schema default para el CREATE SCHEMA.
    .replace(/([?&])schema=[^&]*(&|$)/, (_m, p1, p2) => (p2 === "&" ? p1 : ""))
    .replace(/[?&]$/, "");

  if (!directUrl) throw new Error("DIRECT_URL/DATABASE_URL no está seteado");

  const prisma = new PrismaClient({ datasources: { db: { url: directUrl } } });
  try {
    // eslint-disable-next-line no-console
    console.log(`[bootstrap] creando schema "${schema}" si no existe…`);
    await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    // eslint-disable-next-line no-console
    console.log(`[bootstrap] schema "${schema}" listo`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[bootstrap] ERROR:", err);
  process.exit(1);
});
