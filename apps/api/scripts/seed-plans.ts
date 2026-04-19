/**
 * seed-plans.ts — Crea o actualiza los planes de suscripción en la BD.
 * Ejecutar con: npx tsx scripts/seed-plans.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error", "warn"],
  errorFormat: "pretty",
});

const PLANS = [
  {
    code: "free",
    name: "Free",
    description: "Para empezar a explorar DocuLex",
    priceArs: null,
    trialDays: 0,
    limits: {
      docsPerMonth: 5,
      maxUsers: 1,
      maxClients: 3,
      maxExpedientes: 2,
      maxReferenceFiles: 0,
      analysesPerMonth: 2,
    },
    features: {
      chatIA: false,
      edicion: false,
      anotaciones: false,
      analytics: false,
      exportarReportes: false,
      referenciaDocs: false,
      logoEstudio: false,
      soporte: "email",
    },
  },
  {
    code: "pro",
    name: "Pro",
    description: "Para abogados independientes",
    priceArs: 24999,
    trialDays: 7,
    limits: {
      docsPerMonth: 50,
      maxUsers: 1,
      maxClients: -1,
      maxExpedientes: -1,
      maxReferenceFiles: 10,
      analysesPerMonth: 15,
    },
    features: {
      chatIA: true,
      edicion: true,
      anotaciones: true,
      analytics: true,
      exportarReportes: false,
      referenciaDocs: true,
      logoEstudio: false,
      soporte: "email_prioritario",
    },
  },
  {
    code: "proplus",
    name: "Pro+",
    description: "Para abogados con mayor volumen",
    priceArs: 35000,
    trialDays: 0,
    limits: {
      docsPerMonth: 100,
      maxUsers: 1,
      maxClients: -1,
      maxExpedientes: -1,
      maxReferenceFiles: 20,
      analysesPerMonth: 30,
    },
    features: {
      chatIA: true,
      edicion: true,
      anotaciones: true,
      analytics: true,
      exportarReportes: true,
      referenciaDocs: true,
      logoEstudio: false,
      soporte: "email_prioritario",
    },
  },
  {
    code: "estudio",
    name: "Estudio",
    description: "Para estudios jurídicos — precio por usuario",
    priceArs: 45000,
    trialDays: 0,
    limits: {
      docsPerMonth: -1,
      maxUsers: -1,
      maxClients: -1,
      maxExpedientes: -1,
      maxReferenceFiles: -1,
      analysesPerMonth: -1,
    },
    features: {
      chatIA: true,
      edicion: true,
      anotaciones: true,
      analytics: true,
      exportarReportes: true,
      referenciaDocs: true,
      logoEstudio: true,
      soporte: "prioritario_onboarding",
    },
  },
];

async function main() {
  console.log("🌱 Seedeando planes de suscripción...\n");

  for (const plan of PLANS) {
    const existing = await prisma.plan.findUnique({ where: { code: plan.code } });

    if (existing) {
      await prisma.plan.update({
        where: { code: plan.code },
        data: {
          name: plan.name,
          description: plan.description,
          priceArs: plan.priceArs,
          trialDays: plan.trialDays,
          limits: plan.limits,
          features: plan.features,
        },
      });
      console.log(`✅ Plan actualizado: ${plan.name} (${plan.code})`);
    } else {
      await prisma.plan.create({ data: plan });
      console.log(`✅ Plan creado: ${plan.name} (${plan.code})`);
    }
  }

  console.log("\n✅ Planes seeded correctamente!");
  console.log("   Free: $0/mes · 5 docs/mes · 1 usuario");
  console.log("   Pro: $24.999/mes · 50 docs/mes · 1 usuario · 7 días gratis");
  console.log("   Pro+: $35.000/mes · 100 docs/mes · 1 usuario");
  console.log("   Estudio: $45.000/usuario/mes · ilimitado · mín. 3 usuarios");
}

main()
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
