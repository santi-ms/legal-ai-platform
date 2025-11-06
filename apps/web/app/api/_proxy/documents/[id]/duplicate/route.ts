import { NextRequest, NextResponse } from "next/server";
import { apiUrl, generateJWT } from "../../../utils";

function jsonError(status: number, message: string, detail?: any) {
  return NextResponse.json({ ok: false, message, detail }, { status });
}

/**
 * Proxy server-side para POST /documents/:id/duplicate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jwt = await generateJWT(request);
    const url = apiUrl(`/documents/${params.id}/duplicate`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const ct = response.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const json = await response.json().catch(() => null);
      if (!json) return jsonError(502, "JSON inválido desde API");
      return NextResponse.json(json, { status: response.status });
    }

    const text = await response.text();
    return jsonError(response.status || 502, "Upstream no devolvió JSON", {
      contentType: ct,
      bodyPreview: text.slice(0, 500),
      url: url.toString(),
    });
  } catch (err: any) {
    return jsonError(500, "Proxy error", err?.message || String(err));
  }
}
