import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest } from "next/server";

type JwtAlgo = "HS256" | "RS256";

export function getApiBase() {
  const raw = process.env.API_URL || "";
  if (!raw) {
    throw new Error("Falta API_URL (URL pública del backend en Railway)");
  }

  const base = raw.startsWith("http") ? raw : `https://${raw}`;
  return base.replace(/\/+$/, "");
}

export function getWebOrigin() {
  const base =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
  return base.replace(/\/+$/, "");
}

export function joinUrl(base: string, path: string) {
  const root = base.replace(/\/+$/, "");
  const segment = path.replace(/^\/+/, "");
  return `${root}/${segment}`;
}

const BACKEND_PREFIX = (process.env.BACKEND_PREFIX || "").replace(/^\/+|\/+$/g, "");

export function backendPath(path: string) {
  const clean = path.replace(/^\/+/, "");
  const full = BACKEND_PREFIX ? `${BACKEND_PREFIX}/${clean}` : clean;
  return joinUrl(getApiBase(), full);
}

export async function getSessionSafe(req?: NextRequest) {
  try {
    if (req) {
      // En Route Handlers, usar getToken directamente
      const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
      });
      if (!token) {
        console.warn("[getSessionSafe] No se encontró token en Route Handler");
        return null;
      }
      // Convertir token a formato de sesión
      return {
        user: {
          id: token.user?.id || token.sub,
          email: token.user?.email || token.email,
          name: token.user?.name || token.name,
          role: token.user?.role || token.role,
          tenantId: token.user?.tenantId || token.tenantId,
        },
      } as any;
    }
    // En Server Components, usar getServerSession
    const session = await getServerSession(authOptions);
    return session;
  } catch (err: any) {
    console.error("[getSessionSafe] Error:", err?.message, err?.stack);
    return null;
  }
}

export async function generateJWT(req?: NextRequest) {
  const session = await getSessionSafe(req);
  if (!session?.user?.email || !session?.user?.id) {
    // sin sesión => no generamos token
    throw new Error("No hay sesión de usuario. Iniciá sesión e intentá de nuevo.");
  }

  const userId = (session.user as any).id;
  const tenantId = (session.user as any).tenantId || undefined;
  const role = (session.user as any).role || "user";
  const email = session.user.email;

  // Config de firma
  // El backend usa NEXTAUTH_SECRET para validar, así que usamos el mismo
  const secret = process.env.BACKEND_JWT_SECRET || process.env.NEXTAUTH_SECRET;
  const pk = process.env.BACKEND_JWT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const algorithm: JwtAlgo = pk ? "RS256" : "HS256";

  if (algorithm === "HS256" && !secret) {
    throw new Error("BACKEND_JWT_SECRET o NEXTAUTH_SECRET no configurado para HS256.");
  }
  if (algorithm === "RS256" && !pk) {
    throw new Error("BACKEND_JWT_PRIVATE_KEY no configurado para RS256.");
  }

  const payload = {
    sub: userId,
    email,
    role,
    ...(tenantId ? { tenantId } : {}),
    iss: "legal-ai-web",
    aud: "legal-ai-api",
  };

  const token = jwt.sign(payload, (algorithm === "HS256" ? (secret as string) : (pk as string)), {
    algorithm,
    expiresIn: "15m",
  });

  return token;
}

export function apiUrl(path: string) {
  const base = getApiBase();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}
