export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { backendPath, generateJWT } from "../../utils";

export async function GET(req: NextRequest) {
  const url = backendPath("healthz");
  try {
    // Health no requiere auth, pero si el backend lo necesita podemos enviar token
    let headers: Record<string, string> = {};
    try {
      const jwt = await generateJWT(req);
      headers = { Authorization: `Bearer ${jwt}` };
    } catch {
      // ignorar si no hay sesión
    }

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        ...headers,
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const body = await response.json().catch(() => null);
      return NextResponse.json({ ok: true, status: response.status, contentType, url, body });
    }

    const bodyPreview = (await response.text()).slice(0, 500);
    return NextResponse.json(
      { ok: false, status: response.status, contentType, url, bodyPreview },
      { status: response.status }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, message: e?.message || String(e), url },
      { status: 500 }
    );
  }
}

