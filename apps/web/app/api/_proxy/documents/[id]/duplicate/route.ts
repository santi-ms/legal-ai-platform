import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { config } from "@/app/lib/config";
import { generateJWT } from "../../../utils";

/**
 * Proxy server-side para POST /documents/:id/duplicate
 */
export async function POST(
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

    const backendUrl = `${config.apiUrl}/documents/${params.id}/duplicate`;

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error(`[proxy/documents/${params.id}/duplicate] Error:`, error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
