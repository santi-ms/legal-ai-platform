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

export async function POST(req: NextRequest) {
  const target = backendPath("documents/generate");
  try {
    const jwt = await generateJWT(req);
    const body = await req.json().catch(() => ({}));
    const authHeader = bearer(req.headers) || (jwt ? `Bearer ${jwt}` : serverBearer());

    console.debug("[proxy/documents.generate] ->", target);
    const upstream = await fetch(target, {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "";
    console.debug("[proxy/documents.generate] <-", upstream.status, contentType);

    if (apiJsonOrHtml(upstream)) {
      const json = await upstream.json().catch(() => null);
      if (!json) return jsonError(502, "JSON inválido desde API", { target });
      return NextResponse.json(json, { status: upstream.status });
    }

    const text = await upstream.text();
    return badGatewayFromHtml(upstream.status, text);
  } catch (err: any) {
    return jsonError(500, "Proxy error", {
      target,
      error: err?.message || String(err),
    });
  }
}

