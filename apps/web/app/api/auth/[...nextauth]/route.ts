import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "db";
import bcrypt from "bcryptjs";

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

          const user = await prisma.user.findUnique({
            where: { email: credentials.email as string }
          });

          if (!user) {
            console.log("❌ Usuario no encontrado");
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) {
            console.log("❌ Contraseña incorrecta");
            return null;
          }

          console.log("✅ User authorized:", {
            id: user.id,
            email: user.email
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name || "",
            role: user.role,
          };
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
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Si la URL es relativa, usar baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Si la URL es de nuestro dominio, permitir
      if (new URL(url).origin === baseUrl) return url;
      // Por defecto, redirigir a dashboard
      return `${baseUrl}/documents`;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

