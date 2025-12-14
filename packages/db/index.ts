import { PrismaClient } from "@prisma/client";

// Evitamos múltiples instancias en dev (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn", "query"] : ["error", "warn"],
    errorFormat: "pretty",
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}

// Función para verificar la conexión a la base de datos
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error);
    return false;
  }
}
