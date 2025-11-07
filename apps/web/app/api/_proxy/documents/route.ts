export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  backendPath,
  bearer,
  generateJWT,
  apiJsonOrHtml,
  badGatewayFromHtml,
  serverBearer,
} from "../utils";

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

export async function GET(req: NextRequest) {
  const target = new URL(backendPath("documents"));
  try {
    const incoming = new URL(req.url);
    incoming.searchParams.forEach((value, key) => target.searchParams.set(key, value));

    const jwt = await generateJWT(req);
    const authHeader = bearer(req.headers) || (jwt ? `Bearer ${jwt}` : serverBearer());

    console.debug("[proxy documents] ->", target.toString());
    const response = await fetch(target, {
      headers: {
        accept: "application/json",
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    const contentType = response.headers.get("content-type") || "";
    console.debug("[proxy documents] <-", response.status, contentType);

    if (apiJsonOrHtml(response)) {
      const json = await response.json().catch(() => null);
      if (!json) {
        return jsonError(502, "JSON inválido desde API", { target: target.toString() });
      }
      return NextResponse.json(json, { status: response.status });
    }

    const text = await response.text();
    return badGatewayFromHtml(response.status, text);
  } catch (err: any) {
    return jsonError(500, "Proxy error", {
      target: target.toString(),
      error: err?.message || String(err),
    });
  }
}
