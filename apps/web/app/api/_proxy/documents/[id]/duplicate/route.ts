export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  backendPath,
  bearer,
  generateJWT,
  apiJsonOrHtml,
  badGatewayFromHtml,
  serverBearer,
} from "../../../utils";

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

/**
 * Proxy server-side para POST /documents/:id/duplicate
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const target = backendPath(`documents/${params.id}/duplicate`);
  try {
    const jwt = await generateJWT(request);
    const authHeader = bearer(request.headers) || (jwt ? `Bearer ${jwt}` : serverBearer());

    console.debug(`[proxy/documents.duplicate] ->`, target);
    const response = await fetch(target, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    console.debug(`[proxy/documents.duplicate] <-`, response.status, contentType);

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
