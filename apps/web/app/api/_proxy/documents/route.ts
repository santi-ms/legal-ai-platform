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

    // Construir query string desde URL search params
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();
    const backendUrl = `${config.apiUrl}/documents${queryString ? `?${queryString}` : ""}`;

    // Reenviar request al backend con Authorization header
    const response = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      cache: "no-store",
    });

    const data = await response.json();

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
