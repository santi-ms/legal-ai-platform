import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { config } from "@/app/lib/config";
import { generateJWT } from "../utils";


/**
 * Proxy server-side para GET /documents
 * Obtiene el token JWT de NextAuth y reenvía al backend con Authorization header
 * NUNCA expone el token al cliente
 */
export async function GET(request: NextRequest) {
  try {
    // Obtener token JWT de la sesión
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) {
      console.warn("[proxy/documents] No se encontró token de NextAuth");
      return NextResponse.json(
        { ok: false, message: "Unauthorized", error: "NO_TOKEN" },
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

    // Construir query string desde URL search params
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const backendUrl = `${config.apiUrl}/documents${queryString ? `?${queryString}` : ""}`;
    
    console.log("[proxy/documents] Llamando al backend:", backendUrl);

    // Reenviar request al backend con Authorization header
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      cache: "no-store",
    });

    // Verificar que la respuesta sea JSON antes de parsearla
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("[proxy/documents] Backend devolvió HTML en lugar de JSON:", text.substring(0, 200));
      return NextResponse.json(
        {
          ok: false,
          message: "El servidor devolvió una respuesta inválida",
          error: "INVALID_RESPONSE",
        },
        { status: 500 }
      );
    }

    let data: any;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error("[proxy/documents] Error parseando JSON:", parseError);
      return NextResponse.json(
        {
          ok: false,
          message: "Error al procesar respuesta del servidor",
          error: "PARSE_ERROR",
        },
        { status: 500 }
      );
    }

    // Retornar respuesta sin exponer el token
    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[proxy/documents] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
