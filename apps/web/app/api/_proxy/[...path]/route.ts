export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

function getApiBase() {
  const raw = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL;
  if (!raw) throw new Error("API_URL not set");
  return raw.replace(/\/+$/, "");
}

function joinUrl(base: string, path: string) {
  const cleanBase = base.replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/+/, "");
  return `${cleanBase}/${cleanPath}`;
}

const BACKEND_PREFIX = (process.env.BACKEND_PREFIX || "").replace(/^\/+|\/+$/g, "");

function buildTarget(req: NextRequest) {
  const segments = req.nextUrl.pathname.split("/").slice(3).join("/");
  const query = req.nextUrl.search || "";
  const upstreamPath = BACKEND_PREFIX ? `${BACKEND_PREFIX}/${segments}` : segments;
  const base = getApiBase();
  return joinUrl(base, `${upstreamPath}${query}`);
}

async function forward(req: NextRequest) {
  const target = buildTarget(req);
  const method = req.method.toUpperCase();

  const headers = new Headers();
  headers.set("accept", "application/json");

  const incomingAuth = req.headers.get("authorization");
  if (incomingAuth) headers.set("authorization", incomingAuth);

  const contentType = req.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);

  let body: BodyInit | undefined;
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    body = req.body ?? undefined;
  }

  console.debug(`[proxy] ${method} -> ${target}`);

  const response = await fetch(target, {
    method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  });

  const resContentType = response.headers.get("content-type") || "";
  console.debug(`[proxy] <- ${response.status} ${resContentType}`);

  if (!resContentType.includes("application/json")) {
    const html = await response.text();
    return NextResponse.json(
      {
        ok: false,
        message: "Upstream non-JSON",
        status: response.status,
        snippet: html.slice(0, 800),
      },
      { status: 502 },
    );
  }

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(req: NextRequest) {
  return forward(req);
}

export async function POST(req: NextRequest) {
  return forward(req);
}

export async function PATCH(req: NextRequest) {
  return forward(req);
}

export async function DELETE(req: NextRequest) {
  return forward(req);
}


