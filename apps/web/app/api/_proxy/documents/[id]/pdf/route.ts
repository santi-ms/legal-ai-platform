import { NextRequest, NextResponse } from "next/server";
import { apiUrl, generateJWT } from "../../../utils";

function jsonError(status: number, message: string, detail?: any) {
  return NextResponse.json({ ok: false, message, detail }, { status });
}

/**
 * Proxy server-side para GET /documents/:id/pdf
 * Stream del PDF desde el backend sin exponer el token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const jwt = await generateJWT();
    const url = apiUrl(`/documents/${params.id}/pdf`);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      // Si el backend devuelve JSON de error, parsearlo
      const ct = response.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const errorData = await response.json().catch(() => ({}));
        return jsonError(response.status, errorData.message || "Error al obtener PDF");
      }
      // Si devuelve HTML u otro formato, devolver error JSON
      const text = await response.text();
      return jsonError(response.status, "Error al obtener PDF", {
        contentType: ct,
        bodyPreview: text.slice(0, 500),
      });
    }

    // Stream del PDF con headers seguros
    const pdfBuffer = await response.arrayBuffer();
    
    // Sanitizar filename para evitar path traversal
    const sanitizedFilename = `documento-${params.id.replace(/[^a-zA-Z0-9-_]/g, "")}.pdf`;
    
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
    return jsonError(500, "Proxy error", err?.message || String(err));
  }
}
