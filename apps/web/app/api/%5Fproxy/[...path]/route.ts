export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL!;

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
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("x-forwarded-host");
  headers.delete("x-forwarded-proto");

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
