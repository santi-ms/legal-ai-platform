import { NextResponse } from "next/server";
import { logger } from "@/app/lib/logger";
import { buildAuthProxyTarget } from "../_utils";

// Método OPTIONS para CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Método GET para diagnóstico
export async function GET() {
  logger.warn("[_auth/register][GET] Method not allowed");
  return NextResponse.json(
    { ok: false, message: "Method Not Allowed. Use POST." },
    { status: 405 }
  );
}

export async function POST(req: Request) {
  logger.debug("[_auth/register][POST] Request received");
  try {
    const body = await req.json();
    logger.debug("[_auth/register][POST] Request body", { 
      hasName: !!body.name, 
      hasFirstName: !!body.firstName,
      hasLastName: !!body.lastName,
      hasEmail: !!body.email, 
      hasPassword: !!body.password,
      hasCompanyName: !!body.companyName,
      hasProfessionalRole: !!body.professionalRole,
    });
    
    // Transformar companyName a company para que coincida con el backend
    // Si companyName es una cadena vacía, convertirla a null
    const companyValue = body.companyName || body.company;
    const transformedBody = {
      name: body.name,
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      password: body.password,
      company: companyValue && companyValue.trim().length > 0 ? companyValue.trim() : null,
      professionalRole: body.professionalRole || body.role,
    };
    
    const target = buildAuthProxyTarget("/api/register");
    if (!target) {
      return NextResponse.json(
        {
          ok: false,
          message: "Configuracion incompleta del proxy de autenticacion",
          error: "auth_proxy_api_url_missing",
        },
        { status: 500 },
      );
    }

    logger.debug("[_auth/register][POST] Calling backend", {
      source: target.source,
      targetOrigin: new URL(target.url).origin,
      path: "/api/register",
    });
    logger.debug("[_auth/register][POST] Transformed body", { 
      name: transformedBody.name, 
      firstName: transformedBody.firstName,
      lastName: transformedBody.lastName,
      email: transformedBody.email, 
      hasPassword: !!transformedBody.password,
      company: transformedBody.company,
      professionalRole: transformedBody.professionalRole,
    });
    
    const r = await fetch(target.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformedBody),
      cache: "no-store" as const,
    });
    
    logger.debug("[_auth/register][POST] Backend response status", { status: r.status });
    
    // Verificar que la respuesta sea JSON válido
    const contentType = r.headers.get("content-type");
    let data: any;
    
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await r.json();
        logger.debug("[_auth/register][POST] Backend response data", { 
          ok: data?.ok, 
          hasUser: !!data?.user, 
          error: data?.error 
        });
      } catch (jsonError) {
        logger.error("[_auth/register][POST] Error parsing JSON response", jsonError);
        const text = await r.text().catch(() => "Error desconocido");
        logger.error("[_auth/register][POST] Response text", undefined, { text: text.substring(0, 500) });
        return NextResponse.json(
          { 
            ok: false, 
            message: "Error al procesar respuesta del servidor",
            error: `Respuesta inválida: ${text.substring(0, 200)}`
          }, 
          { status: 500 }
        );
      }
    } else {
      const text = await r.text().catch(() => "Error desconocido");
      logger.error("[_auth/register][POST] Non-JSON response", undefined, { text: text.substring(0, 500) });
      return NextResponse.json(
        { 
          ok: false, 
          message: "Error al procesar respuesta del servidor",
          error: `El servidor devolvió una respuesta no-JSON: ${text.substring(0, 200)}`
        }, 
        { status: r.status || 500 }
      );
    }
    
    logger.debug("[_auth/register][POST] Returning response", { 
      status: r.status, 
      ok: data?.ok, 
      hasUser: !!data?.user 
    });
    
    return NextResponse.json(data, { 
      status: r.status, 
      headers: { "cache-control": "no-store" } 
    });
  } catch (err) {
    logger.error("Auth proxy /api/_auth/register error", err);
    return NextResponse.json(
      { 
        ok: false, 
        message: "Error al procesar respuesta del servidor",
        error: err instanceof Error ? err.message : "Error desconocido"
      }, 
      { status: 500 }
    );
  }
}

