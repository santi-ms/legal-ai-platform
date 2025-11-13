export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Función para obtener la URL de la API (leer en tiempo de ejecución, no en tiempo de módulo)
function getApiUrl(): string {
  // En producción, preferir NEXT_PUBLIC_API_URL (disponible en build y runtime)
  // API_URL solo está disponible en runtime (server-side)
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

// Helper para obtener el token JWT de la sesión de NextAuth
async function getAuthToken(req: Request): Promise<string | null> {
  try {
    // Leer cookies del request
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies: Record<string, string> = {};
    
    cookieHeader.split(";").forEach(cookie => {
      const [key, ...values] = cookie.trim().split("=");
      if (key && values.length > 0) {
        cookies[key.trim()] = decodeURIComponent(values.join("="));
      }
    });

    // Buscar el token de sesión de NextAuth
    const sessionTokenName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";
    
    const sessionToken = cookies[sessionTokenName];
    
    if (!sessionToken) {
      console.log("[_proxy] No se encontró cookie de sesión");
      return null;
    }

    // Decodificar el JWT de NextAuth
    const jwt = await import("jsonwebtoken");
    const secret = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";
    
    if (!secret) {
      console.error("[_proxy] NEXTAUTH_SECRET no configurado");
      return null;
    }

    let decoded: any;
    try {
      // Intentar verificar el token
      decoded = jwt.verify(sessionToken, secret);
    } catch (verifyError) {
      // Si falla la verificación, intentar decodificar sin verificar
      console.warn("[_proxy] Token no verificado, decodificando sin verificar");
      decoded = jwt.decode(sessionToken);
    }

    if (!decoded) {
      console.log("[_proxy] No se pudo decodificar el token");
      return null;
    }

    // Extraer información del usuario del token de NextAuth
    // NextAuth almacena la info del usuario en decoded.user
    const user = decoded.user || decoded;
    const userId = user?.id || user?.sub;
    const tenantId = user?.tenantId;
    const role = user?.role || "user";
    const email = user?.email;

    if (!userId) {
      console.log("[_proxy] Token sin userId:", decoded);
      return null;
    }

    console.log("[_proxy] Usuario extraído del token:", {
      userId,
      email,
      tenantId,
      role,
    });

    // Generar un nuevo token JWT con la estructura que espera el backend
    const backendToken = jwt.sign(
      {
        id: userId,      // El backend busca 'id' primero
        sub: userId,     // Luego busca 'sub' como fallback
        email: email,
        tenantId: tenantId,
        role: role,
      },
      secret,
      { expiresIn: "2h" }
    );

    console.log("[_proxy] Token generado exitosamente");
    return backendToken;
  } catch (error: any) {
    console.error("[_proxy] Error obteniendo token:", error?.message || error);
    return null;
  }
}

async function handler(
  req: Request, 
  ctx: { params: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  // Obtener API_URL en tiempo de ejecución
  let API_URL: string;
  try {
    API_URL = getApiUrl();
  } catch (error: any) {
    const envCheck = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL ? `✅ configurado (${process.env.NEXT_PUBLIC_API_URL.substring(0, 30)}...)` : "❌ faltante",
      API_URL: process.env.API_URL ? `✅ configurado (${process.env.API_URL.substring(0, 30)}...)` : "❌ faltante",
      NODE_ENV: process.env.NODE_ENV || "no definido",
    };
    
    console.error("[_proxy] Error obteniendo API_URL:", envCheck);
    
    return Response.json(
      { 
        ok: false, 
        error: "MISSING_API_URL",
        message: "La URL de la API no está configurada.",
        detail: "Configure NEXT_PUBLIC_API_URL en Vercel con la URL completa de su API (ej: https://api-pr...)"
      },
      { status: 500 }
    );
  }
  
  // Validar que no sea localhost en producción
  const isProduction = process.env.NODE_ENV === "production";
  const isLocalhost = API_URL.includes("localhost") || API_URL.includes("127.0.0.1");
  
  if (isProduction && isLocalhost) {
    console.error("[_proxy] API_URL es localhost en producción:", API_URL);
    return Response.json(
      { 
        ok: false, 
        error: "INVALID_API_URL",
        message: "No se puede usar localhost en producción.",
        detail: "Configure NEXT_PUBLIC_API_URL con una URL de producción válida"
      },
      { status: 500 }
    );
  }

  // Manejar params como Promise (Next.js 15+) o como objeto directo
  const params = ctx.params instanceof Promise ? await ctx.params : ctx.params;
  
  // Extraer el path de los parámetros
  const pathArray = params.path ?? [];
  const path = pathArray.join("/");
  
  // Logging para diagnóstico (solo en desarrollo o si hay error)
  if (process.env.NODE_ENV === "development" || !path) {
    console.log("[_proxy] Debug:", {
      url: req.url,
      method: req.method,
      path: path,
      API_URL: API_URL.substring(0, 50) + "...", // Solo mostrar primeros 50 caracteres por seguridad
    });
  }
  
  // Si el path está vacío, devolver error
  if (!path) {
    console.error("[_proxy] Path vacío. Params:", params, "URL:", req.url);
    return Response.json(
      { ok: false, error: "EMPTY_PATH", detail: "La ruta del proxy está vacía. Verifique que la URL sea correcta." },
      { status: 400 }
    );
  }

  const url = new URL(req.url);
  const search = url.search ?? "";
  
  // Asegurar que API_URL no termine con / y path no empiece con /
  const cleanApiUrl = API_URL.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  
  // Construir la URL de destino de forma segura
  let target: string;
  try {
    // Si API_URL ya es una URL completa, usarla directamente
    if (cleanApiUrl.startsWith("http://") || cleanApiUrl.startsWith("https://")) {
      target = `${cleanApiUrl}/${cleanPath}${search}`;
    } else {
      // Si no tiene protocolo, asumir http://
      target = `http://${cleanApiUrl}/${cleanPath}${search}`;
    }
    
    // Validar que la URL sea válida
    new URL(target);
  } catch (urlError) {
    console.error("[_proxy] Error construyendo URL:", {
      API_URL,
      cleanApiUrl,
      path,
      cleanPath,
      error: urlError
    });
    return Response.json(
      { 
        ok: false, 
        error: "INVALID_URL", 
        detail: `No se pudo construir la URL: ${cleanApiUrl}/${cleanPath}` 
      },
      { status: 500 }
    );
  }
  
  console.log(`[_proxy] ${req.method} ${path} -> ${target}`);
  
  // Obtener token de autenticación
  const authToken = await getAuthToken(req);
  
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");
  
  // Agregar token de autenticación si está disponible
  if (authToken) {
    headers.set("Authorization", `Bearer ${authToken}`);
    console.log("[_proxy] Token de autenticación agregado");
  } else {
    console.warn("[_proxy] No se pudo obtener token de autenticación");
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method)
      ? undefined
      : await req.arrayBuffer(),
    cache: "no-store",
    redirect: "manual",
  };

  let upstream: Response;
  try {
    upstream = await fetch(target, init);
  } catch (err: any) {
    return Response.json(
      { ok: false, error: "UPSTREAM_FETCH_FAILED", detail: String(err) },
      { status: 502 }
    );
  }

  const ct = upstream.headers.get("content-type") || "";
  if (ct.includes("text/html")) {
    const snippet = (await upstream.text()).slice(0, 400);
    return Response.json(
      {
        ok: false,
        error: "UPSTREAM_NON_JSON",
        status: upstream.status,
        snippet,
      },
      { status: upstream.status === 200 ? 502 : upstream.status }
    );
  }

  const body = new Uint8Array(await upstream.arrayBuffer());
  const headersOut = new Headers(upstream.headers);
  return new Response(body, { status: upstream.status, headers: headersOut });
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE, handler as OPTIONS };
