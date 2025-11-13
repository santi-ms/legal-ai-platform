export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL!;

// Helper para obtener el token JWT de la sesión de NextAuth
async function getAuthToken(req: Request): Promise<string | null> {
  try {
    // Leer la cookie de sesión de NextAuth directamente
    const cookieHeader = req.headers.get("cookie") || "";
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split("=");
      if (key && value) acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

    // Buscar el token de sesión de NextAuth
    const sessionTokenName = process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";
    
    const sessionToken = cookies[sessionTokenName];
    
    if (!sessionToken) {
      return null;
    }

    // Decodificar el JWT de NextAuth (sin verificar, solo para extraer datos)
    const jwt = await import("jsonwebtoken");
    const secret = process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production";
    
    try {
      // Decodificar el token de NextAuth
      const decoded = jwt.verify(sessionToken, secret) as any;
      
      // Extraer información del usuario del token
      const user = decoded.user || decoded;
      
      if (!user || !user.id) {
        return null;
      }

      // Generar un nuevo token JWT con la estructura que espera el backend
      const backendToken = jwt.sign(
        {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role || "user",
        },
        secret,
        { expiresIn: "2h" }
      );

      return backendToken;
    } catch (verifyError) {
      // Si el token no es válido, intentar decodificarlo sin verificar
      try {
        const decoded = jwt.decode(sessionToken) as any;
        const user = decoded?.user || decoded;
        
        if (!user || !user.id) {
          return null;
        }

        const backendToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
            tenantId: user.tenantId,
            role: user.role || "user",
          },
          secret,
          { expiresIn: "2h" }
        );

        return backendToken;
      } catch (decodeError) {
        console.error("[_proxy] Error decodificando token:", decodeError);
        return null;
      }
    }
  } catch (error) {
    console.error("[_proxy] Error obteniendo token:", error);
    return null;
  }
}

async function handler(
  req: Request, 
  ctx: { params: Promise<{ path?: string[] }> | { path?: string[] } }
) {
  if (!API_URL) {
    return Response.json(
      { ok: false, error: "MISSING_API_URL" },
      { status: 500 }
    );
  }

  // Manejar params como Promise (Next.js 15+) o como objeto directo
  const params = ctx.params instanceof Promise ? await ctx.params : ctx.params;
  
  // Extraer el path de los parámetros
  const pathArray = params.path ?? [];
  const path = pathArray.join("/");
  
  // Logging para diagnóstico
  console.log("[_proxy] Debug:", {
    url: req.url,
    method: req.method,
    params: params,
    pathArray: pathArray,
    path: path,
    API_URL: API_URL
  });
  
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
  const target = `${cleanApiUrl}/${cleanPath}${search}`;
  
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
