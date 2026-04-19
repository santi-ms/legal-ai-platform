import { PrismaClient } from "@prisma/client";

// Evitamos múltiples instancias en dev (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Limit connections to avoid exhausting Supabase's session pool
function buildUrl(raw?: string): string | undefined {
  if (!raw) return raw;
  if (raw.includes("connection_limit=")) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}connection_limit=3`;
}

const prismaInstance =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn", "query"] : ["error", "warn"],
    errorFormat: "pretty",
    datasources: {
      db: { url: buildUrl(process.env.DATABASE_URL) },
    },
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
