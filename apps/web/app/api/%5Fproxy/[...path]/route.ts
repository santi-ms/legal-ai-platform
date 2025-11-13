import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import jwt from "jsonwebtoken";

// Asegurar que se ejecute en Node.js runtime (no Edge)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Función para obtener la URL de la API
 * Lee las variables de entorno en tiempo de ejecución
 */
function getApiUrl(): string {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
  
  if (!apiUrl) {
    // Solo usar localhost si estamos en desarrollo
    if (process.env.NODE_ENV === "development") {
      return "http://localhost:4001";
    }
    throw new Error("NEXT_PUBLIC_API_URL o API_URL debe estar configurado");
  }
  
  return apiUrl;
}

/**
 * Genera un JWT para el backend a partir del token de NextAuth
 */
function generateBackendToken(token: any): string {
  const secret = process.env.NEXTAUTH_SECRET;
  
  if (!secret || secret === "dev-secret-change-in-production") {
    throw new Error("NEXTAUTH_SECRET no configurado correctamente");
  }

  // El token de NextAuth tiene la estructura del callback jwt
  // token.user contiene: id, email, tenantId, role
  const user = token?.user || token;
  
  if (!user?.id) {
    throw new Error("Token sin información de usuario");
  }

  // Generar token con la estructura que espera el backend
  return jwt.sign(
    {
      id: user.id,
      sub: user.id, // El backend también acepta 'sub'
      email: user.email,
      tenantId: user.tenantId,
      role: user.role || "user",
    },
    secret,
    { expiresIn: "15m" } // Token de corta duración para seguridad
  );
}

/**
 * Route Handler del proxy
 * Intercepta requests y los reenvía al backend con autenticación
 */
async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  try {
    // 1. Obtener API_URL
    let API_URL: string;
    try {
      API_URL = getApiUrl();
    } catch (error: any) {
      console.error("[_proxy] Error obteniendo API_URL:", error.message);
      return NextResponse.json(
        { 
          ok: false, 
          error: "MISSING_API_URL",
          message: "La URL de la API no está configurada.",
          detail: "Configure NEXT_PUBLIC_API_URL en Vercel con la URL completa de su API"
        },
        { status: 500 }
      );
    }
    
    // Validar que no sea localhost en producción
    const isProduction = process.env.NODE_ENV === "production";
    const isLocalhost = API_URL.includes("localhost") || API_URL.includes("127.0.0.1");
    
    if (isProduction && isLocalhost) {
      console.error("[_proxy] API_URL es localhost en producción:", API_URL);
      return NextResponse.json(
        { 
          ok: false, 
          error: "INVALID_API_URL",
          message: "No se puede usar localhost en producción.",
          detail: "Configure NEXT_PUBLIC_API_URL con una URL de producción válida"
        },
        { status: 500 }
      );
    }

    // 2. Obtener el path de los parámetros
    const params = ctx.params instanceof Promise ? await ctx.params : ctx.params;
    const pathArray = params.path ?? [];
    const path = pathArray.join("/");
    
    if (!path) {
      console.error("[_proxy] Path vacío. URL:", req.url);
      return NextResponse.json(
        { ok: false, error: "EMPTY_PATH", detail: "La ruta del proxy está vacía." },
        { status: 400 }
      );
    }

    // 3. Obtener token de NextAuth usando getToken
    const secret = process.env.NEXTAUTH_SECRET;
    
    if (!secret || secret === "dev-secret-change-in-production") {
      console.error("[_proxy] NEXTAUTH_SECRET no configurado correctamente");
      return NextResponse.json(
        { 
          ok: false,
          error: "MISSING_SECRET",
          message: "Error de configuración del servidor" 
        },
        { status: 500 }
      );
    }

    const token = await getToken({ 
      req, 
      secret: secret 
    });
    
    if (!token) {
      console.log("[_proxy] Sin token de NextAuth - usuario no autenticado");
      return NextResponse.json(
        { 
          ok: false,
          error: "UNAUTHORIZED",
          message: "Autenticación requerida" 
        },
        { status: 401 }
      );
    }

    // Extraer información del usuario del token
    const user = token.user || token;
    const userId = user?.id;
    const email = user?.email;
    const tenantId = user?.tenantId;
    const role = user?.role || "user";

    console.log("[_proxy] ✅ Token encontrado para usuario:", {
      id: userId,
      email: email,
      tenantId: tenantId,
      role: role,
    });

    // 4. Generar token JWT para el backend
    let backendToken: string;
    try {
      backendToken = generateBackendToken(token);
    } catch (error: any) {
      console.error("[_proxy] Error generando token:", error.message);
      return NextResponse.json(
        { 
          ok: false,
          error: "TOKEN_GENERATION_FAILED",
          message: "Error al generar token de autenticación" 
        },
        { status: 500 }
      );
    }

    // 5. Construir URL de destino
    const url = new URL(req.url);
    const search = url.search || "";
    const cleanApiUrl = API_URL.replace(/\/$/, "");
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    
    let targetUrl: string;
    try {
      if (cleanApiUrl.startsWith("http://") || cleanApiUrl.startsWith("https://")) {
        targetUrl = `${cleanApiUrl}/${cleanPath}${search}`;
      } else {
        targetUrl = `http://${cleanApiUrl}/${cleanPath}${search}`;
      }
      // Validar que la URL sea válida
      new URL(targetUrl);
    } catch (urlError) {
      console.error("[_proxy] Error construyendo URL:", {
        API_URL,
        path,
        error: urlError
      });
      return NextResponse.json(
        { 
          ok: false, 
          error: "INVALID_URL", 
          detail: `No se pudo construir la URL: ${cleanApiUrl}/${cleanPath}` 
        },
        { status: 500 }
      );
    }

    console.log(`[_proxy] ${req.method} ${path} -> ${targetUrl}`);

    // 6. Preparar headers para el backend
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${backendToken}`,
    };

    // Copiar headers relevantes del request original (si es necesario)
    const contentType = req.headers.get("content-type");
    if (contentType) {
      headers["Content-Type"] = contentType;
    }

    // 7. Hacer fetch al backend
    let backendResponse: Response;
    try {
      const body = ["GET", "HEAD"].includes(req.method) 
        ? undefined 
        : await req.text();

      backendResponse = await fetch(targetUrl, {
        method: req.method,
        headers,
        body,
        cache: "no-store",
        redirect: "manual",
      });
    } catch (fetchError: any) {
      console.error("[_proxy] Error en fetch al backend:", fetchError.message);
      return NextResponse.json(
        { 
          ok: false, 
          error: "UPSTREAM_FETCH_FAILED", 
          detail: String(fetchError) 
        },
        { status: 502 }
      );
    }

    // 8. Logging especial para errores 401
    if (backendResponse.status === 401) {
      console.error("[_proxy] ❌ Backend devolvió 401 (No autorizado)");
      console.error("[_proxy] Detalles:", {
        path,
        targetUrl,
        tieneToken: !!backendToken,
        status: backendResponse.status,
      });
    } else if (backendResponse.ok) {
      console.log("[_proxy] ✅ Request exitoso:", {
        path,
        status: backendResponse.status,
      });
    }

    // 9. Leer respuesta del backend
    const responseText = await backendResponse.text();
    
    // 10. Devolver respuesta al cliente
    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: {
        "Content-Type": backendResponse.headers.get("content-type") || "application/json",
      },
    });

  } catch (error: any) {
    console.error("[_proxy] Error inesperado:", error);
    return NextResponse.json(
      { 
        ok: false, 
        error: "INTERNAL_ERROR", 
        message: "Error interno del servidor",
        detail: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// Exportar handlers para todos los métodos HTTP
export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };
