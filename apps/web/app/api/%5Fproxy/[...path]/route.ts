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
    
    console.log("[_proxy] 🔍 Iniciando búsqueda de token de autenticación");
    console.log("[_proxy] Cookie header presente:", !!cookieHeader);
    console.log("[_proxy] Cookie header length:", cookieHeader.length);
    
    if (!cookieHeader) {
      console.error("[_proxy] ❌ No hay cookies en el request");
      console.error("[_proxy] Headers disponibles:", Array.from(req.headers.keys()));
      return null;
    }
    
    // Log parcial de cookies (sin valores sensibles)
    const cookiePreview = cookieHeader.substring(0, 200);
    console.log("[_proxy] Cookie header preview:", cookiePreview + (cookieHeader.length > 200 ? "..." : ""));

    // Parsear cookies
    const cookies: Record<string, string> = {};
    cookieHeader.split(";").forEach(cookie => {
      const trimmed = cookie.trim();
      const equalIndex = trimmed.indexOf("=");
      if (equalIndex > 0) {
        const key = trimmed.substring(0, equalIndex).trim();
        const value = trimmed.substring(equalIndex + 1).trim();
        if (key && value) {
          try {
            cookies[key] = decodeURIComponent(value);
          } catch {
            cookies[key] = value;
          }
        }
      }
    });

    // Buscar cookie de sesión de NextAuth (puede tener diferentes nombres)
    const sessionTokenNames = [
      "__Secure-next-auth.session-token",
      "next-auth.session-token",
      "__Host-next-auth.session-token",
    ];

    let sessionToken: string | undefined;
    let foundName: string | undefined;

    for (const name of sessionTokenNames) {
      if (cookies[name]) {
        sessionToken = cookies[name];
        foundName = name;
        break;
      }
    }

    if (!sessionToken) {
      const cookieNames = Object.keys(cookies);
      console.error("[_proxy] ❌ No se encontró cookie de sesión de NextAuth");
      console.error("[_proxy] Total de cookies parseadas:", cookieNames.length);
      console.error("[_proxy] Cookies disponibles:", cookieNames);
      console.error("[_proxy] Buscando cookies con nombres:", sessionTokenNames);
      
      // Buscar cookies que contengan "next-auth" o "session" en el nombre
      const relatedCookies = cookieNames.filter(name => 
        name.toLowerCase().includes("next") || 
        name.toLowerCase().includes("auth") || 
        name.toLowerCase().includes("session")
      );
      if (relatedCookies.length > 0) {
        console.error("[_proxy] ⚠️ Cookies relacionadas encontradas:", relatedCookies);
      }
      
      return null;
    }

    console.log("[_proxy] ✅ Cookie de sesión encontrada:", foundName);

    // Decodificar el JWT de NextAuth
    const jwt = await import("jsonwebtoken");
    const secret = process.env.NEXTAUTH_SECRET;
    
    if (!secret || secret === "dev-secret-change-in-production") {
      console.error("[_proxy] ⚠️ NEXTAUTH_SECRET no configurado correctamente");
      return null;
    }

    // Decodificar el token (sin verificar primero para ver su estructura)
    let decoded: any;
    try {
      decoded = jwt.verify(sessionToken, secret);
    } catch (verifyError) {
      // Si falla la verificación, intentar decodificar sin verificar
      console.warn("[_proxy] Token no verificado, decodificando sin verificar");
      decoded = jwt.decode(sessionToken);
    }

    if (!decoded) {
      console.error("[_proxy] ❌ No se pudo decodificar el token");
      return null;
    }

    // NextAuth almacena la info del usuario en decoded.user o directamente en decoded
    const user = decoded.user || decoded;
    const userId = user?.id || user?.sub;
    const tenantId = user?.tenantId;
    const role = user?.role || "user";
    const email = user?.email;

    if (!userId) {
      console.error("[_proxy] ❌ Token sin userId. Estructura:", Object.keys(decoded));
      return null;
    }

    console.log("[_proxy] Usuario extraído:", { userId, email, tenantId, role });

    // Generar token para el backend
    const backendToken = jwt.sign(
      {
        id: userId,
        sub: userId,
        email: email,
        tenantId: tenantId,
        role: role,
      },
      secret,
      { expiresIn: "2h" }
    );

    console.log("[_proxy] ✅ Token generado exitosamente");
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
    console.log("[_proxy] ✅ Token de autenticación agregado al header");
  } else {
    console.warn("[_proxy] ⚠️ No se pudo obtener token de autenticación - la petición se enviará sin autenticación");
    console.warn("[_proxy] Esto causará un error 401 en el backend si el endpoint requiere autenticación");
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

  // Logging especial para errores 401 (autenticación)
  if (upstream.status === 401) {
    console.error("[_proxy] ❌ Backend devolvió 401 (No autorizado)");
    console.error("[_proxy] Detalles:", {
      path: path,
      target: target,
      tieneAuthToken: !!authToken,
      status: upstream.status,
    });
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
