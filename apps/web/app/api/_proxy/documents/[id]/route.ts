import { NextRequest, NextResponse } from "next/server";
import { apiUrl, generateJWT } from "../../utils";

function jsonError(status: number, message: string, detail?: any) {
  return NextResponse.json({ ok: false, message, detail }, { status });
}

/**
 * Proxy server-side para operaciones en documentos individuales
 * GET /documents/:id
 * PATCH /documents/:id
 * DELETE /documents/:id
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRequest(request, params.id, "GET");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRequest(request, params.id, "PATCH");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleRequest(request, params.id, "DELETE");
}

async function handleRequest(
  request: NextRequest,
  id: string,
  method: "GET" | "PATCH" | "DELETE"
) {
  try {
    const jwt = await generateJWT();
    const url = apiUrl(`/documents/${id}`);

    const options: RequestInit = {
      method,
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: "application/json",
      },
      cache: "no-store",
    };

    // Para PATCH, incluir body
    if (method === "PATCH") {
      const body = await request.json().catch(() => ({}));
      options.body = JSON.stringify(body);
      (options.headers as any)["Content-Type"] = "application/json";
    }

    const response = await fetch(url, options);

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
