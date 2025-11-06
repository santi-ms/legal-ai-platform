import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4001";

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

    const r = await fetch(`${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
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

