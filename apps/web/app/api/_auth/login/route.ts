import { NextResponse } from "next/server";
import { buildAuthProxyTarget } from "../_utils";

function json405() {
  return NextResponse.json(
    { ok: false, message: "Method Not Allowed" },
    { status: 405 }
  );
}

export async function GET() {
  // Para que sepamos si alguna request cae con GET
  console.log("[_auth/login][GET] 405");
  return json405();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    console.log("[_auth/login][POST] in", { hasEmail: !!body?.email });

    const target = buildAuthProxyTarget("/api/auth/login");
    if (!target) {
      console.error("[_auth/login] API target missing");
      return NextResponse.json(
        { ok: false, message: "API URL missing", error: "auth_proxy_api_url_missing" },
        { status: 500 }
      );
    }

    const r = await fetch(target.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store" as const,
    });

    const data = await r.json().catch(() => ({}));
    console.log("[_auth/login][POST] out", { status: r.status, ok: data?.ok });

    return NextResponse.json(data, {
      status: r.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    console.error("[_auth/login][POST] error", err);
    return NextResponse.json(
      { ok: false, message: "Auth proxy error" },
      { status: 500 }
    );
  }
}
