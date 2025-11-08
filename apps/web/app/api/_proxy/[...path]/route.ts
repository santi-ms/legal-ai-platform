export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse, NextRequest } from "next/server";

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.replace(/^\/+/, "");
  return `${b}/${p}`;
}

async function handle(req: NextRequest, ctx: { params?: { path?: string[] } }) {
  const API_URL = process.env.API_URL;
  if (!API_URL) {
    return NextResponse.json(
      { ok: false, message: "API_URL is not set" },
      { status: 500 }
    );
  }

  const path = ctx.params?.path?.join("/") ?? "";
  const incomingUrl = new URL(req.url);
  const upstream = new URL(joinUrl(API_URL, path));
  upstream.search = incomingUrl.search;

  const headers = new Headers(req.headers);
  headers.delete("cookie");

  const body =
    req.method !== "GET" && req.method !== "HEAD" ? await req.blob() : undefined;

  const init: RequestInit = {
    method: req.method,
    headers,
    body,
  };

  const res = await fetch(upstream.toString(), init);

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const snippet = (await res.text()).slice(0, 500);
    return NextResponse.json(
      { ok: false, message: "Upstream non-JSON", status: res.status, snippet },
      { status: 502 }
    );
  }

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { "content-type": "application/json" },
  });
}

export {
  handle as GET,
  handle as POST,
  handle as PATCH,
  handle as PUT,
  handle as DELETE,
  handle as HEAD,
};

export async function OPTIONS() {
  return NextResponse.json({ ok: true, proxy: "alive" });
}
