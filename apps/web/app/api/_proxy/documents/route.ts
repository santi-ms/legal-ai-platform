import { NextRequest, NextResponse } from "next/server";
import { apiUrl, generateJWT } from "../utils";

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

export async function GET(req: NextRequest) {
  try {
    const target = new URL(apiUrl("/documents"));
    const incoming = new URL(req.url);
    incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));

    const jwt = await generateJWT(req);

    const response = await fetch(target, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const json = await response.json().catch(() => null);
      if (!json) {
        return jsonError(502, "JSON inválido desde API", { target: target.toString() });
      }
      return NextResponse.json(json, { status: response.status });
    }

    const text = await response.text();
    return jsonError(response.status || 502, "Upstream no devolvió JSON", {
      contentType,
      bodyPreview: text.slice(0, 500),
      target: target.toString(),
    });
  } catch (err: any) {
    return jsonError(500, "Proxy error", {
      target: apiUrl("/documents"),
      error: err?.message || String(err),
    });
  }
}
