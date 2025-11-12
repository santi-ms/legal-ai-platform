export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const API_URL = process.env.API_URL!;

async function handler(req: Request, ctx: { params: { path?: string[] } }) {
  if (!API_URL) {
    return Response.json(
      { ok: false, error: "MISSING_API_URL" },
      { status: 500 }
    );
  }

  const path = (ctx.params.path ?? []).join("/");
  const url = new URL(req.url);
  const search = url.search ?? "";
  const target = `${API_URL}/${path}${search}`;
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
