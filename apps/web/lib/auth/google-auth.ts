import { randomBytes } from "crypto";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type CanonicalUser = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  tenantId: string | null;
};

type AccountLike = {
  provider: string;
  providerAccountId: string;
  type: string;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: number | null;
  token_type?: string | null;
  scope?: string | null;
  id_token?: string | null;
  session_state?: string | null;
};

type GoogleProfile = {
  email?: unknown;
  email_verified?: unknown;
  name?: unknown;
};

const canonicalUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  tenantId: true,
} as const;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function getLinkedUserByAccount(account: AccountLike): Promise<CanonicalUser | null> {
  const linkedAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: account.provider,
        providerAccountId: account.providerAccountId,
      },
    },
    include: {
      user: {
        select: canonicalUserSelect,
      },
    },
  });

  return linkedAccount?.user ?? null;
}

export async function buildSecureOAuthPasswordHash() {
  const randomSecret = randomBytes(32).toString("hex");
  return hash(randomSecret, 12);
}

export async function loadCanonicalUser(params: {
  id?: string;
  email?: string;
}): Promise<CanonicalUser | null> {
  if (params.id) {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: canonicalUserSelect,
    });

    if (user) {
      return user;
    }
  }

  if (params.email) {
    return prisma.user.findUnique({
      where: { email: normalizeEmail(params.email) },
      select: canonicalUserSelect,
    });
  }

  return null;
}

export async function reconcileGoogleAccount(params: {
  account: AccountLike;
  profile?: GoogleProfile | null;
}): Promise<CanonicalUser> {
  const { account, profile } = params;
  const email = typeof profile?.email === "string" ? normalizeEmail(profile.email) : "";
  const emailVerified = profile?.email_verified === true;

  if (!email) {
    throw new Error("GOOGLE_EMAIL_MISSING");
  }

  if (!emailVerified) {
    throw new Error("GOOGLE_EMAIL_NOT_VERIFIED");
  }

  const linkedUser = await getLinkedUserByAccount(account);
  if (linkedUser) {
    return linkedUser;
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existingAccount = await tx.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider: account.provider,
            providerAccountId: account.providerAccountId,
          },
        },
        include: {
          user: {
            select: canonicalUserSelect,
          },
        },
      });

      if (existingAccount?.user) {
        return existingAccount.user;
      }

      const existingUser = await tx.user.findUnique({
        where: { email },
        select: canonicalUserSelect,
      });

      if (existingUser) {
        await tx.account.create({
          data: {
            userId: existingUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            access_token: account.access_token ?? null,
            refresh_token: account.refresh_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
            session_state: typeof account.session_state === "string" ? account.session_state : null,
          },
        });

        return existingUser;
      }

      const createdUser = await tx.user.create({
        data: {
          email,
          name: typeof profile?.name === "string" ? profile.name : null,
          emailVerified: new Date(),
          role: "user",
          tenantId: null,
          passwordHash: await buildSecureOAuthPasswordHash(),
        },
        select: canonicalUserSelect,
      });

      await tx.account.create({
        data: {
          userId: createdUser.id,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          access_token: account.access_token ?? null,
          refresh_token: account.refresh_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state: typeof account.session_state === "string" ? account.session_state : null,
        },
      });

      return createdUser;
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const retriedUser = await getLinkedUserByAccount(account);
      if (retriedUser) {
        return retriedUser;
      }
    }

    throw error;
  }
}