export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const prefix =
  process.env.BACKEND_PREFIX?.replace(/^\/|\/$/g, "") || "";
const API_URL = process.env.API_URL?.replace(/\/$/, "");

function upstreamURL(req: NextRequest) {
  if (!API_URL) throw new Error("API_URL is not set");
  const path = req.nextUrl.pathname.replace(/^\/api\/_proxy\/?/, "");
  const seg = prefix ? `/${prefix}` : "";
  const qs = req.nextUrl.search || "";
  return `${API_URL}${seg}/${path}${qs}`;
}

async function forward(req: NextRequest, method: string) {
  try {
    const url = upstreamURL(req);

    const headers = new Headers(req.headers);
    headers.set("x-forwarded-host", req.headers.get("host") || "");
    headers.delete("host");

    const body =
      method === "GET" || method === "HEAD" || method === "OPTIONS"
        ? undefined
        : await req.arrayBuffer();

    const resp = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
    });

    const ct = resp.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const snippet = (await resp.text()).slice(0, 600);
      return NextResponse.json(
        { ok: false, message: "Upstream non-JSON", status: resp.status, snippet },
        { status: 502 }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data, { status: resp.status });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, message: "Proxy error", error: String(err?.message || err) },
      { status: 502 }
    );
  }
}

export async function GET(req: NextRequest) {
  return forward(req, "GET");
}
export async function POST(req: NextRequest) {
  return forward(req, "POST");
}
export async function PUT(req: NextRequest) {
  return forward(req, "PUT");
}
export async function PATCH(req: NextRequest) {
  return forward(req, "PATCH");
}
export async function DELETE(req: NextRequest) {
  return forward(req, "DELETE");
}
export async function OPTIONS(req: NextRequest) {
  return forward(req, "OPTIONS");
}
export async function HEAD(req: NextRequest) {
  return forward(req, "HEAD");
}
