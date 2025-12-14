import { NextResponse } from "next/server";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4001";

// Método GET para diagnóstico
export async function GET() {
  console.log("[_auth/register][GET] Method not allowed");
  return NextResponse.json(
    { ok: false, message: "Method Not Allowed. Use POST." },
    { status: 405 }
  );
}

export async function POST(req: Request) {
  console.log("[_auth/register][POST] Request received");
  try {
    const body = await req.json();
    
    // Transformar companyName a company para que coincida con el backend
    // Si companyName es una cadena vacía, convertirla a null
    const companyValue = body.companyName || body.company;
    const transformedBody = {
      name: body.name,
      email: body.email,
      password: body.password,
      company: companyValue && companyValue.trim().length > 0 ? companyValue.trim() : null,
    };
    
    console.log("[_auth/register][POST] Calling backend:", `${API_BASE}/api/register`);
    
    const r = await fetch(`${API_BASE}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(transformedBody),
      cache: "no-store" as const,
    });
    
    console.log("[_auth/register][POST] Backend response status:", r.status);
    
    // Verificar que la respuesta sea JSON válido
    const contentType = r.headers.get("content-type");
    let data: any;
    
    if (contentType && contentType.includes("application/json")) {
      try {
        data = await r.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        const text = await r.text().catch(() => "Error desconocido");
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
      console.error("Non-JSON response:", text);
      return NextResponse.json(
        { 
          ok: false, 
          message: "Error al procesar respuesta del servidor",
          error: `El servidor devolvió una respuesta no-JSON: ${text.substring(0, 200)}`
        }, 
        { status: r.status || 500 }
      );
    }
    
    return NextResponse.json(data, { 
      status: r.status, 
      headers: { "cache-control": "no-store" } 
    });
  } catch (err) {
    console.error("Auth proxy /api/_auth/register error:", err);
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

