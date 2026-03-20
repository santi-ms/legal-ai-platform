import { NextResponse } from "next/server";
import { buildAuthProxyTarget } from "../../_utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const target = buildAuthProxyTarget("/api/auth/reset/confirm");
    if (!target) {
      return NextResponse.json(
        { ok: false, message: "API URL missing", error: "auth_proxy_api_url_missing" },
        { status: 500 }
      );
    }

    const r = await fetch(target.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // @ts-ignore
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { 
      status: r.status, 
      headers: { "cache-control": "no-store" } 
    });
  } catch (err) {
    console.error("Auth proxy /api/_auth/reset/confirm error:", err);
    return NextResponse.json(
      { ok: false, message: "Auth proxy error" }, 
      { status: 500 }
    );
  }
}

