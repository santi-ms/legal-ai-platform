import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export function getApiBase() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "";
  if (!raw) {
    throw new Error("API_URL not set");
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
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

const BACKEND_PREFIX = (process.env.BACKEND_PREFIX || "").replace(/^\/+|\/+$/g, "");

export function backendPath(path: string) {
  const clean = path.replace(/^\/+/, "");
  const prefixed = BACKEND_PREFIX ? `${BACKEND_PREFIX}/${clean}` : clean;
  return joinUrl(getApiBase(), prefixed);
}

export function badGatewayFromHtml(status: number, html: string) {
  return NextResponse.json(
    { ok: false, message: "Upstream non-JSON", status, snippet: html.slice(0, 800) },
    { status: 502 }
  );
}

export function apiJsonOrHtml(res: Response) {
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json");
}

export function bearer(headers: Headers) {
  return headers.get("authorization") || "";
}

export function serverBearer() {
  return "";
}

export async function getSessionSafe() {
  return null;
}

const SECRET =
  process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET || "dev-secret-please-change";

export async function generateJWT(payload: Record<string, any> = {}) {
  const claims = {
    sub: "web-proxy",
    iat: Math.floor(Date.now() / 1000),
    ...payload,
  };

  return jwt.sign(claims, SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
  });
}

export function apiUrl(path: string) {
  const base = getApiBase();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${base}${clean}`;
}
