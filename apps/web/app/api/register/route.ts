import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api-production-8cad.up.railway.app"; // backend real

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const res = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.text();

    if (!res.ok) {
      return new NextResponse(data, { status: res.status });
    }

    return NextResponse.json(JSON.parse(data));
  } catch (err: any) {
    console.error("Proxy /api/register error:", err);
    return new NextResponse(
      JSON.stringify({ message: "Error proxying to API", error: err?.message }),
      { status: 500 }
    );
  }
}
