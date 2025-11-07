import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Helper para obtener baseURL robusto
function getBaseUrl() {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL; // prod/vercel
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export const authOptions: NextAuthOptions = {
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

          // 1) Intento via proxy local (POST)
          let res = await fetch(`${base}/api/_auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
            cache: "no-store",
          });

          // 2) Fallback directo al backend si 405/404
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
            data = await res.json();
          } catch {}

          console.log("[authorize] login resp", { status: res.status, ok: data?.ok });

          if (!res.ok || !data?.ok || !data?.user) {
            return null;
          }

          return data.user;
        } catch (err) {
          console.error("[authorize] exception", err);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 2, // 2 horas
    updateAge: 10 * 60,  // Refresca cada 10 min de actividad (opcional)
  },
  jwt: {
    maxAge: 60 * 60 * 2, // 2 horas - debe coincidir con session.maxAge
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id as string,
          email: user.email as string,
          name: (user as any).name || "",
          role: (user as any).role || "viewer",
          tenantId: (user as any).tenantId as string,
        };
      }
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
      // Si la URL es relativa, usar baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Si la URL es de nuestro dominio, permitir
      if (new URL(url).origin === baseUrl) return url;
      // Por defecto, redirigir a documentos
      return `${baseUrl}/documents`;
    },
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // ⬇️ sin maxAge => cookie de sesión (se elimina al cerrar navegador)
        // maxAge: undefined, // Ya es undefined por defecto
      },
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
