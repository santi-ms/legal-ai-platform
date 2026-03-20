import { NextResponse } from "next/server";
import { buildAuthProxyTarget } from "../_utils";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Token requerido" }, 
        { status: 400 }
      );
    }

    const target = buildAuthProxyTarget(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
    if (!target) {
      return NextResponse.json(
        { ok: false, message: "API URL missing", error: "auth_proxy_api_url_missing" },
        { status: 500 }
      );
    }

    const r = await fetch(target.url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      // @ts-ignore
      cache: "no-store",
    });
    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, { 
      status: r.status, 
      headers: { "cache-control": "no-store" } 
    });
  } catch (err) {
    console.error("Auth proxy /api/_auth/verify-email error:", err);
    return NextResponse.json(
      { ok: false, message: "Auth proxy error" }, 
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    const target = buildAuthProxyTarget("/api/auth/verify-email");
    if (!target) {
      return NextResponse.json(
        { ok: false, message: "API URL missing", error: "auth_proxy_api_url_missing" },
        { status: 500 },
      );
    }

    const r = await fetch(target.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: body.email,
        code: body.code,
      }),
      cache: "no-store",
    });

    const data = await r.json().catch(() => ({}));
    return NextResponse.json(data, {
      status: r.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    console.error("Auth proxy /api/_auth/verify-email POST error:", err);
    return NextResponse.json(
      { ok: false, message: "Auth proxy error" },
      { status: 500 },
    );
  }
}

