import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createPrismaAuthAdapter } from "@/lib/auth/prisma-adapter";
import { loadCanonicalUser, reconcileGoogleAccount } from "@/lib/auth/google-auth";

function getBaseUrl() {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const authOptions: NextAuthOptions = {
  adapter: createPrismaAuthAdapter(),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const base = getBaseUrl();

          let res = await fetch(`${base}/api/_auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            cache: "no-store",
          });

          if (res.status === 405 || res.status === 404) {
            console.warn("[authorize] proxy 405/404, fallback to API");
            const api = process.env.NEXT_PUBLIC_API_URL;
            if (!api) return null;
            res = await fetch(`${api}/api/auth/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
              cache: "no-store",
            });
          }

          let data: any = {};
          try {
            const text = await res.text();
            if (text) {
              data = JSON.parse(text);
            }
          } catch (e) {
            console.error("[authorize] Error parsing response:", e);
            return null;
          }

          console.log("[authorize] login resp", { status: res.status, ok: data?.ok, hasUser: !!data?.user });

          if (!res.ok || !data?.ok) {
            console.warn("[authorize] Login failed:", { status: res.status, message: data?.message });
            return null;
          }

          if (!data?.user) {
            console.error("[authorize] Response missing user field:", data);
            return null;
          }

          return data.user;
        } catch (err) {
          console.error("[authorize] exception", err);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 2, // 2 horas
    updateAge: 10 * 60, // 10 minutos
  },
  jwt: {
    maxAge: 60 * 60 * 2, // 2 horas
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") {
        return true;
      }

      try {
        const canonicalUser = await reconcileGoogleAccount({
          account,
          profile,
        });

        user.id = canonicalUser.id;
        user.email = canonicalUser.email;
        user.name = canonicalUser.name;
        (user as any).role = canonicalUser.role;
        (user as any).tenantId = canonicalUser.tenantId;

        return true;
      } catch (error) {
        console.error("[authOptions.signIn] Google reconcile failed", error);
        return "/auth/login?error=google_signin_failed";
      }
    },
    async jwt({ token, user, trigger }) {
      const fallbackId = typeof token.sub === "string" && token.sub ? token.sub : undefined;
      const fallbackEmail = typeof token.user?.email === "string" && token.user.email ? token.user.email : undefined;
      const lookup = await loadCanonicalUser({
        id: typeof (user as any)?.id === "string" && (user as any).id ? (user as any).id : fallbackId,
        email: typeof user?.email === "string" && user.email ? user.email : fallbackEmail,
      });

      if (!lookup) {
        if (trigger === "update") {
          console.warn("[authOptions.jwt] Canonical user not found during update", {
            sub: token.sub,
            email: token.user?.email,
          });
        }
        return token;
      }

      token.sub = lookup.id;
      token.email = lookup.email;
      token.name = lookup.name ?? undefined;
      token.user = {
        id: lookup.id,
        email: lookup.email,
        name: lookup.name,
        role: lookup.role,
        tenantId: lookup.tenantId,
      };

      return token;
    },
    async session({ session, token }) {
      if (token.user) {
        session.user = {
          id: token.user.id,
          email: token.user.email,
          name: token.user.name,
          role: token.user.role,
          tenantId: token.user.tenantId,
        } as any;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        return `${baseUrl}/documents`;
      }

      return `${baseUrl}/documents`;
    },
  },
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax", // Compatible con navegación cross-site
        path: "/",
        secure: process.env.NODE_ENV === "production", // HTTPS en producción
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Host-next-auth.csrf-token"
          : "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
};
