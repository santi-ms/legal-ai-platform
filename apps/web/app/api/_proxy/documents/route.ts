import { NextResponse } from "next/server";
import { apiUrl, generateJWT } from "../utils";

function jsonError(status: number, message: string, detail?: any) {
  return NextResponse.json({ ok: false, message, detail }, { status });
}

export async function GET(req: Request) {
  try {
    const jwt = await generateJWT();
    const url = new URL(apiUrl("/documents"));
    // forward de query params
    const inUrl = new URL(req.url);
    inUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const upstream = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
      },
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
