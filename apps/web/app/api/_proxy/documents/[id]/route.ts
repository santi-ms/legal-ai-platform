export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  backendPath,
  bearer,
  generateJWT,
  apiJsonOrHtml,
  badGatewayFromHtml,
  serverBearer,
} from "../../utils";

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
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
  const target = backendPath(`documents/${id}`);
  try {
    const jwt = await generateJWT(request);
    const authHeader = bearer(request.headers) || (jwt ? `Bearer ${jwt}` : serverBearer());

    const options: RequestInit = {
      method,
      headers: {
        accept: "application/json",
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      cache: "no-store",
    };

    // Para PATCH, incluir body
    if (method === "PATCH") {
      const body = await request.json().catch(() => ({}));
      options.body = JSON.stringify(body);
      (options.headers as any)["Content-Type"] = "application/json";
    }

    console.debug(`[proxy documents ${method}] ->`, target);
    const response = await fetch(target, options);

    const contentType = response.headers.get("content-type") || "";
    console.debug(`[proxy documents ${method}] <-`, response.status, contentType);

    if (apiJsonOrHtml(response)) {
      const json = await response.json().catch(() => null);
      if (!json) return jsonError(502, "JSON inválido desde API", { target });
      return NextResponse.json(json, { status: response.status });
    }

    const text = await response.text();
    return badGatewayFromHtml(response.status, text);
  } catch (err: any) {
    return jsonError(500, "Proxy error", {
      target,
      error: err?.message || String(err),
    });
  }
}
