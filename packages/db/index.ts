import { PrismaClient } from "@prisma/client";

// Evitamos múltiples instancias en dev (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prismaInstance =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn", "query"] : ["error", "warn"],
    errorFormat: "pretty",
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prismaInstance;
}

// Función para verificar la conexión a la base de datos
async function checkDatabaseConnection() {
  try {
    await prismaInstance.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error("Error de conexión a la base de datos:", error);
    return false;
  }
}

// Exportar como named exports para ESM
export const prisma = prismaInstance;
export { checkDatabaseConnection };

// También exportar como default para compatibilidad con CommonJS
export default {
  prisma: prismaInstance,
  checkDatabaseConnection,
};
