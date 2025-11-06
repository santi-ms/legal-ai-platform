import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

type JwtAlgo = "HS256" | "RS256";

function getApiBase() {
  const base = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!base) throw new Error("API base URL no configurada (API_URL/NEXT_PUBLIC_API_URL).");
  return base.replace(/\/+$/, "");
}

export async function getSessionSafe() {
  try {
    const session = await getServerSession(authOptions);
    return session;
  } catch {
    return null;
  }
}

export async function generateJWT() {
  const session = await getSessionSafe();
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
