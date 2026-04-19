/**
 * seed-promo-codes.ts — Crea códigos promocionales en la BD.
 * Ejecutar con: npx tsx scripts/seed-promo-codes.ts
 *
 * Configurá los valores de CODES antes de ejecutar.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error", "warn"], errorFormat: "pretty" });

// ─── Códigos a crear / actualizar ────────────────────────────────────────────
const CODES = [
  {
    code: "ABOGACIA2026",          // El código que les das a los estudiantes (siempre MAYÚSCULAS)
    planCode: "pro",               // Plan que activa ("pro" | "proplus" | "estudio")
    trialDays: 14,                 // Días de prueba gratuita
    maxUses: 100,                  // Máximo de estudiantes que pueden usarlo (-1 = ilimitado)
    isActive: true,
    expiresAt: new Date("2026-06-30T23:59:59Z"), // Válido hasta el 30/06/2026
    note: "Charla abogacía - mayo 2026",
  },
  // Podés agregar más códigos acá:
  // {
  //   code: "EVENTO2026",
  //   planCode: "pro",
  //   trialDays: 7,
  //   maxUses: 50,
  //   isActive: true,
  //   expiresAt: new Date("2026-12-31"),
  //   note: "Otro evento",
  // },
];

async function main() {
  console.log("🎟️  Seedeando códigos promocionales...\n");

  for (const c of CODES) {
    const existing = await (prisma as any).promoCode.findUnique({ where: { code: c.code } });

    if (existing) {
      await (prisma as any).promoCode.update({
        where: { code: c.code },
        data: {
          planCode:  c.planCode,
          trialDays: c.trialDays,
          maxUses:   c.maxUses,
          isActive:  c.isActive,
          expiresAt: c.expiresAt,
          note:      c.note,
        },
      });
      console.log(`✏️  Actualizado: ${c.code}`);
    } else {
      await (prisma as any).promoCode.create({ data: c });
      console.log(`✅ Creado:      ${c.code}`);
    }

    console.log(`   Plan: ${c.planCode} · ${c.trialDays} días · máx. ${c.maxUses === -1 ? "ilimitados" : c.maxUses} usos · vence ${c.expiresAt.toLocaleDateString("es-AR")}`);
  }

  console.log("\n🎉 Listo! Compartí el código con los estudiantes.");
  console.log("   Pueden ingresarlo en el formulario de registro (onboarding).\n");

  // Mostrar resumen de uso actual
  const stats = await (prisma as any).promoCode.findMany({
    select: { code: true, usedCount: true, maxUses: true, isActive: true },
  });
  console.log("📊 Estado actual de todos los códigos:");
  for (const s of stats) {
    const limit = s.maxUses === -1 ? "∞" : s.maxUses;
    const status = s.isActive ? "activo" : "inactivo";
    console.log(`   ${s.code}: ${s.usedCount}/${limit} usos · ${status}`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
