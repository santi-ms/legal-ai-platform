import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";      // que nunca quede en caché
export const revalidate = 0;
export const runtime = "nodejs";

const API_BASE = process.env.API_URL!;
const BACKEND_PREFIX =
  process.env.BACKEND_PREFIX?.replace(/^\/|\/$/g, "") || ""; // ej: "api" si tu Fastify cuelga de /api

function buildTargetUrl(pathParts: string[], search: string) {
  const p = pathParts.join("/");
  const prefix = BACKEND_PREFIX ? `/${BACKEND_PREFIX}` : "";
  return `${API_BASE}${prefix}/${p}${search || ""}`;
}

async function forward(req: NextRequest, ctx: { params: { path?: string[] } }) {
  const parts = ctx.params?.path ?? [];
  const target = buildTargetUrl(parts, req.nextUrl.search);

  // Tomamos body (si corresponde)
  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  // Copiamos headers útiles y agregamos JSON por defecto
  const outHeaders = new Headers();
  // Propagamos Authorization/cookies si aplica (sirve para tus endpoints protegidos)
  const auth = req.headers.get("authorization");
  if (auth) outHeaders.set("authorization", auth);
  const contentType = req.headers.get("content-type");
  if (contentType) outHeaders.set("content-type", contentType);
  // CORS/others opcionalmente
  const xReqId = req.headers.get("x-request-id");
  if (xReqId) outHeaders.set("x-request-id", xReqId);

  const upstream = await fetch(target, {
    method,
    headers: outHeaders,
    body: body as any,
    // desactiva caché
    cache: "no-store",
    redirect: "manual",
  });

  const ct = upstream.headers.get("content-type") || "";
  // Si el upstream devolvió HTML, envolvemos en JSON para que el dashboard no falle
  if (ct.includes("text/html")) {
    const snippet = (await upstream.text()).slice(0, 500);
    return NextResponse.json(
      {
        ok: false,
        message: "Upstream non-JSON",
        status: upstream.status,
        contentType: ct,
        target,
        snippet,
      },
      { status: 502 }
    );
  }

  // Reenviamos la respuesta tal cual (JSON, binarios, etc.)
  const bytes = new Uint8Array(await upstream.arrayBuffer());
  const resp = new NextResponse(bytes, {
    status: upstream.status,
    headers: upstream.headers,
  });
  return resp;
}

// Handlers HTTP soportados por el proxy catch-all
export {
  forward as GET,
  forward as POST,
  forward as PUT,
  forward as PATCH,
  forward as DELETE,
  forward as HEAD,
  forward as OPTIONS,
};


