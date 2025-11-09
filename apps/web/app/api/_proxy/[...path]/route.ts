import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL!;
const TIMEOUT_MS = 20000;

function jsonError(status: number, info: Record<string, unknown>) {
  return NextResponse.json({ ok: false, ...info }, { status });
}

async function doProxy(req: NextRequest, params: { path: string[] }) {
  if (!API_URL) {
    return jsonError(500, { message: "API_URL not configured" });
  }

  const path = params.path?.length ? `/${params.path.join("/")}` : "/";
  const url = new URL(API_URL);
  const target = `${url.origin}${path}${req.nextUrl.search || ""}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers = new Headers(req.headers);
  headers.set("x-forwarded-host", req.headers.get("host") || "");
  headers.set("x-proxy", "next");

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.arrayBuffer(),
    signal: controller.signal,
    redirect: "manual",
  };

  try {
    const upstream = await fetch(target, init);
    const ct = upstream.headers.get("content-type") || "";
    const status = upstream.status;

    if (ct.includes("application/json")) {
      const body = await upstream.text();
      clearTimeout(timer);
      return new NextResponse(body, {
        status,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }

    const text = await upstream.text();
    clearTimeout(timer);
    return jsonError(502, {
      message: "Upstream non-JSON",
      status,
      contentType: ct,
      snippet: text.slice(0, 400),
      target,
    });
  } catch (err: any) {
    clearTimeout(timer);
    return jsonError(502, {
      message: "Proxy failed",
      error: String(err?.message || err),
      target,
    });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return doProxy(req, params);
}
export const POST = GET;
export const PUT = GET;
export const PATCH = GET;
export const DELETE = GET;
export const HEAD = GET;
export const OPTIONS = GET;
