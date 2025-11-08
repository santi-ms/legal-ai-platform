// apps/web/app/api/_proxy/[...path]/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL!;
// Prefijo vacío por defecto (tu backend expone /documents en la raíz)
const BACKEND_PREFIX = (process.env.BACKEND_PREFIX ?? "").replace(/^\/|\/$/g, "");
const withPrefix = (p: string) =>
  BACKEND_PREFIX ? `/${BACKEND_PREFIX}${p.startsWith("/") ? p : `/${p}`}` : p;

function json(status: number, payload: any) {
  return NextResponse.json(payload, { status });
}

async function buildAuthHeader() {
  const session = await getServerSession(authOptions).catch(() => null);
  if (!session?.user) return {};
  const secret = process.env.NEXTAUTH_SECRET!;
  const token = jwt.sign(
    { sub: session.user.id ?? session.user.email ?? "user" },
    secret,
    { expiresIn: "10m" }
  );
  return { Authorization: `Bearer ${token}` };
}

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  if (!API_URL) return json(500, { ok: false, message: "API_URL not set" });

  const method = req.method;
  const search = req.nextUrl.search || "";
  const rawPath = `/${(params.path ?? []).join("/")}`;
  const targetPath = withPrefix(rawPath);
  const targetUrl = `${API_URL}${targetPath}${search}`;

  const incomingHeaders = new Headers(req.headers);
  // Nunca forwardear cookies del frontend → backend
  incomingHeaders.delete("cookie");

  const authHeader = await buildAuthHeader();
  Object.entries(authHeader).forEach(([k, v]) => incomingHeaders.set(k, v as string));

  let body: BodyInit | null | undefined;
  if (!["GET", "HEAD"].includes(method)) {
    const ct = incomingHeaders.get("content-type") || "";
    if (ct.includes("application/json")) {
      const jsonBody = await req.json().catch(() => null);
      body = jsonBody ? JSON.stringify(jsonBody) : null;
    } else if (ct.includes("form")) {
      const form = await req.formData();
      body = form as any;
    } else {
      const buf = await req.arrayBuffer();
      body = buf;
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers: incomingHeaders,
      body,
      redirect: "manual",
    });
  } catch (err: any) {
    console.error("[_proxy] fetch error", { err: String(err), targetUrl });
    return json(502, { ok: false, message: "Upstream fetch error", error: String(err) });
  }

  const ct = upstream.headers.get("content-type") || "";
  if (ct.includes("text/html")) {
    const text = await upstream.text();
    const snippet = text.slice(0, 500);
    console.warn("[_proxy] upstream returned HTML", { status: upstream.status, targetUrl, snippet });
    return json(502, { ok: false, message: "Upstream non-JSON", status: upstream.status, snippet });
  }

  const headers = new Headers(upstream.headers);
  headers.delete("set-cookie");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers,
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE, proxy as HEAD, proxy as OPTIONS };


