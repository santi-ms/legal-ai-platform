export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { backendPath, generateJWT } from "../../utils";

export async function GET(req: NextRequest) {
  const url = backendPath("documents");
  try {
    const jwt = await generateJWT(req);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${jwt}`, Accept: "application/json" },
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

