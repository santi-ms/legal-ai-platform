export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import {
  backendPath,
  bearer,
  generateJWT,
  badGatewayFromHtml,
  serverBearer,
} from "../../../utils";

function jsonError(status: number, message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: false, message, ...extra }, { status });
}

/**
 * Proxy server-side para GET /documents/:id/pdf
 * Stream del PDF desde el backend sin exponer el token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const target = backendPath(`documents/${params.id}/pdf`);
  try {
    const jwt = await generateJWT(request);
    const authHeader = bearer(request.headers) || (jwt ? `Bearer ${jwt}` : serverBearer());

    console.debug(`[proxy/documents.pdf] ->`, target);
    const response = await fetch(target, {
      method: "GET",
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Si el backend devuelve JSON de error, parsearlo
      const ct = response.headers.get("content-type") || "";
      console.debug(`[proxy/documents.pdf] <-`, response.status, ct);
      if (ct.includes("application/json")) {
        const errorData = await response.json().catch(() => ({}));
        return jsonError(response.status, errorData.message || "Error al obtener PDF", {
          target,
        });
      }
      // Si devuelve HTML u otro formato, devolver error JSON
      const text = await response.text();
      return badGatewayFromHtml(response.status, text);
    }

    // Stream del PDF con headers seguros
    const pdfBuffer = await response.arrayBuffer();
    
    // Sanitizar filename para evitar path traversal
    const sanitizedFilename = `documento-${params.id.replace(/[^a-zA-Z0-9-_]/g, "")}.pdf`;
    
    console.debug(`[proxy/documents.pdf] <-`, response.status, "application/pdf");
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${sanitizedFilename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: any) {
    return jsonError(500, "Proxy error", {
      target,
      error: err?.message || String(err),
    });
  }
}
