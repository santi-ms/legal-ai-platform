import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4001";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const r = await fetch(`${API_BASE}/api/auth/login`, {
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
    console.error("Auth proxy /api/_auth/login error:", err);
    return NextResponse.json(
      { ok: false, message: "Auth proxy error" }, 
      { status: 500 }
    );
  }
}

