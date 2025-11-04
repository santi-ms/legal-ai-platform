import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api-production-8cad.up.railway.app";

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("❌ Email o contraseña faltante");
            return null;
          }

          console.log("🔐 NextAuth authorize called with:", { email: credentials.email });

          // Llamar al backend en Railway
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.log("❌ Login failed:", res.status, errorData);
            // Devolver null para que NextAuth responda 401
            return null;
          }

          // El backend debe devolver { ok: true, data: { id, email, name, role, tenantId } }
          const response = await res.json();
          const user = response.data || response;

          console.log("✅ User authorized:", {
            id: user.id,
            email: user.email,
            tenantId: user.tenantId
          });

          return user;
        } catch (error) {
          console.error("❌ Error en authorize:", error);
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
        session.user = token.user as any;
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
