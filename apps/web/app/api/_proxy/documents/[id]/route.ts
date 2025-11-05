import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { config } from "@/app/lib/config";
import { generateJWT } from "../../utils";

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

    const backendUrl = `${config.apiUrl}/documents/${id}`;

    // Generar JWT válido para el backend
    const jwtToken = generateJWT(token);

    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwtToken}`,
      },
      cache: "no-store",
    };

    // Para PATCH, incluir body
    if (method === "PATCH") {
      const body = await request.json().catch(() => ({}));
      options.body = JSON.stringify(body);
    }

    const response = await fetch(backendUrl, options);
    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error(`[proxy/documents/${id}] Error:`, error);
    return NextResponse.json(
      {
        ok: false,
        message: error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
