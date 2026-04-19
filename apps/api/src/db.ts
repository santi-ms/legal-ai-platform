import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Limit connections to avoid exhausting Supabase's session pool
function buildUrl(raw?: string): string | undefined {
  if (!raw) return raw;
  if (raw.includes("connection_limit=")) return raw;
  const sep = raw.includes("?") ? "&" : "?";
  return `${raw}${sep}connection_limit=15`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn", "query"]
        : ["error", "warn"],
    errorFormat: "pretty",
    datasources: {
      db: { url: buildUrl(process.env.DATABASE_URL) },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
