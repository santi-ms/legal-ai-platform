import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { config } from "@/app/lib/config";
import { generateJWT } from "../../../utils";

/**
 * Proxy server-side para GET /documents/:id/pdf
 * Stream del PDF desde el backend sin exponer el token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtener token JWT de la sesión
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Unauthorized" },
        { 
          status: 401,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        }
      );
    }

    // Generar JWT válido para el backend
    const jwtToken = generateJWT(token);

    const backendUrl = `${config.apiUrl}/documents/${params.id}/pdf`;

    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, message: errorData.message || "Error al obtener PDF" },
        { status: response.status }
      );
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
  } catch (error) {
    console.error(`[proxy/documents/${params.id}/pdf] Error:`, error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
