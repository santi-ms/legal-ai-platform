import { NextRequest, NextResponse } from "next/server";
import { apiUrl, generateJWT } from "../utils";

function jsonError(status: number, message: string, detail?: any) {
  return NextResponse.json({ ok: false, message, detail }, { status });
}

export async function GET(req: NextRequest) {
  try {
    console.log("[proxy/documents] Iniciando request");
    const jwt = await generateJWT(req);
    console.log("[proxy/documents] JWT generado correctamente");
    const url = new URL(apiUrl("/documents"));
    // forward de query params
    const inUrl = new URL(req.url);
    inUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));

    console.log("[proxy/documents] Llamando al backend:", url.toString());
    const upstream = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    console.log("[proxy/documents] Respuesta del backend:", upstream.status, upstream.statusText);
    const ct = upstream.headers.get("content-type") || "";
    console.log("[proxy/documents] Content-Type:", ct);
    
    if (ct.includes("application/json")) {
      const json = await upstream.json().catch((e) => {
        console.error("[proxy/documents] Error parseando JSON:", e);
        return null;
      });
      if (!json) return jsonError(502, "JSON inválido desde API");
      console.log("[proxy/documents] JSON parseado correctamente, ok:", json.ok);
      return NextResponse.json(json, { status: upstream.status });
    }

    const text = await upstream.text();
    console.error("[proxy/documents] Backend devolvió no-JSON:", text.substring(0, 200));
    return jsonError(upstream.status || 502, "Upstream no devolvió JSON", {
      contentType: ct,
      bodyPreview: text.slice(0, 500),
      url: url.toString(),
    });
  } catch (err: any) {
    console.error("[proxy/documents] Error:", err?.message, err?.stack);
    return jsonError(500, "Proxy error", err?.message || String(err));
  }
}
