import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "db";

async function main() {
  console.log("🌱 Iniciando seed de base de datos...");

  try {
    // 1. Crear o encontrar Tenant por defecto
    const defaultTenantName = "Default Tenant";
    let tenant = await prisma.tenant.findFirst({
      where: { name: defaultTenantName },
    });

    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: defaultTenantName,
        },
      });
      console.log(`✅ Tenant creado: ${tenant.id} - ${tenant.name}`);
    } else {
      console.log(`ℹ️  Tenant ya existe: ${tenant.id} - ${tenant.name}`);
    }

    // 2. Crear o encontrar usuario admin demo
    const adminEmail = "admin@legal-ai.local";
    const adminPassword = "KodoAdmin123";
    const adminPasswordHash = await bcrypt.hash(adminPassword, 10);

    let adminUser = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: adminEmail,
          name: "Admin Demo",
          passwordHash: adminPasswordHash,
          role: "admin",
          tenantId: tenant.id,
          emailVerified: new Date(), // Admin verificado por defecto
        },
      });
      console.log(`✅ Usuario admin creado: ${adminUser.id} - ${adminUser.email}`);
      console.log(`   Password: ${adminPassword}`);
    } else {
      console.log(`ℹ️  Usuario admin ya existe: ${adminUser.id} - ${adminUser.email}`);
      // Actualizar password en caso de que haya cambiado (útil para reset en dev)
      if (adminUser.tenantId !== tenant.id) {
        await prisma.user.update({
          where: { id: adminUser.id },
          data: { tenantId: tenant.id },
        });
        console.log(`   Tenant actualizado a: ${tenant.name}`);
      }
    }

    console.log("\n✅ Seed completado exitosamente!");
    console.log("\n📋 Resumen:");
    console.log(`   Tenant: ${tenant.name} (${tenant.id})`);
    console.log(`   Admin: ${adminEmail} (${adminUser.id})`);
  } catch (error) {
    console.error("❌ Error durante el seed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
