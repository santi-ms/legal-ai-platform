import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4001";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // Log mínimo (sin password)
    console.log("[_auth/login] in", { hasEmail: !!body.email });

    const r = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: body.email, password: body.password }),
      cache: "no-store" as const,
    });

    const data = await r.json().catch(() => ({}));
    console.log("[_auth/login] out", { status: r.status, ok: data?.ok });

    return NextResponse.json(data, {
      status: r.status,
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    console.error("[_auth/login] proxy error", err);
    return NextResponse.json(
      { ok: false, message: "Auth proxy error" },
      { status: 500 }
    );
  }
}

// Handler defensivo para GET (405)
export async function GET() {
  return NextResponse.json(
    { ok: false, message: "Method Not Allowed" },
    { status: 405 }
  );
}

