"use server";
import "server-only";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

type JwtPayload = {
  sub?: string | null;
  tenantId?: string | null;
  role?: string | null;
};

async function getBackendJWT(): Promise<string> {
  let sub: string | null = null;
  let tenantId: string | null = null;
  let role: string | null = null;

  try {
    const session = await getServerSession(authOptions as any);
    sub = (session?.user as any)?.id ?? null;
    tenantId = (session?.user as any)?.tenantId ?? null;
    role = (session?.user as any)?.role ?? null;
  } catch {
    // sesión no disponible, continuamos con payload mínimo
  }

  const payload: JwtPayload = { sub, tenantId, role };
  const secret = process.env.NEXTAUTH_SECRET!;
  return jwt.sign(payload, secret, { expiresIn: "5m" });
}

export async function backendFetchJSON<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const base = process.env.API_URL!;
  if (!base) throw new Error("Falta API_URL en Vercel");

  const url = new URL(path.startsWith("/") ? path : `/${path}`, base).toString();
  const token = await getBackendJWT();

  const headers = new Headers(init.headers as any);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Accept", "application/json");

  const res = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    throw new Error(
      `Upstream non-JSON (status ${res.status}): ${text.slice(0, 400)}`
    );
  }

  const json = (await res.json()) as T;
  return json;
}

