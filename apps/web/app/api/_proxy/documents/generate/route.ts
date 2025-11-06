import { NextRequest, NextResponse } from "next/server";
import { apiUrl, generateJWT } from "../../utils";

function jsonError(status: number, message: string, detail?: any) {
  return NextResponse.json({ ok: false, message, detail }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const jwt = await generateJWT(req);
    const url = apiUrl("/documents/generate");
    const body = await req.json().catch(() => ({}));

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const ct = upstream.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const json = await upstream.json().catch(() => null);
      if (!json) return jsonError(502, "JSON inválido desde API");
      return NextResponse.json(json, { status: upstream.status });
    }

    const text = await upstream.text();
    return jsonError(upstream.status || 502, "Upstream no devolvió JSON", {
      contentType: ct,
      bodyPreview: text.slice(0, 500),
      url: url.toString(),
    });
  } catch (err: any) {
    return jsonError(500, "Proxy error", err?.message || String(err));
  }
}

