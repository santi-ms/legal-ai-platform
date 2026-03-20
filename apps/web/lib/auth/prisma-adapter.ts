import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import { prisma } from "@/lib/prisma";
import { buildSecureOAuthPasswordHash } from "@/lib/auth/google-auth";

export function createPrismaAuthAdapter(): Adapter {
  const adapter = PrismaAdapter(prisma);

  return {
    ...adapter,
    async createUser(data: Omit<AdapterUser, "id">) {
      const createdUser = await prisma.user.create({
        data: {
          email: data.email.trim().toLowerCase(),
          name: data.name ?? null,
          emailVerified: data.emailVerified ?? null,
          role: "user",
          tenantId: null,
          passwordHash: await buildSecureOAuthPasswordHash(),
        },
      });

      return {
        ...createdUser,
        image: null,
      };
    },
  };
}