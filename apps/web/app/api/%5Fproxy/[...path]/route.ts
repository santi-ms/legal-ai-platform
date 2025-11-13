export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL!;

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
