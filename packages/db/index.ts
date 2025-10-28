import { PrismaClient } from "@prisma/client";

// Evitamos múltiples instancias en dev (hot reload)
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"] // si querés "query" para debug, lo podés sumar
  });

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
