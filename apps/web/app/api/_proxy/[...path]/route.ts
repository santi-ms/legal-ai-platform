export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';

function joinUrl(base: string, ...parts: string[]) {
  const b = base.replace(/\/+$/, '');
  const p = parts.join('/').replace(/(^\/+|\/+$)/g, '');
  return p ? `${b}/${p}` : b;
}

function sanitizePrefix(v?: string | null) {
  if (!v) return '';
  return v.replace(/^\/+|\/+$/g, '');
}

async function forward(req: NextRequest, params: { path?: string[] }) {
  const METHOD = req.method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';
  const apiBase = process.env.API_URL || '';
  const prefix  = sanitizePrefix(process.env.BACKEND_PREFIX || '');
  const segs    = params?.path ?? [];
  const relPath = segs.join('/');
  const urlPath = prefix ? `${prefix}/${relPath}` : relPath;

  const target = new URL(joinUrl(apiBase, urlPath));
  const reqUrl = new URL(req.url);
  if (reqUrl.search) target.search = reqUrl.search;

  const headers = new Headers(req.headers);
  headers.delete('host');
  headers.delete('x-forwarded-host');
  headers.delete('x-forwarded-proto');
  headers.delete('content-length');

  const hasBody = !['GET','HEAD'].includes(METHOD);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  const upstreamResp = await fetch(target.toString(), {
    method: METHOD,
    headers,
    body,
    redirect: 'manual',
  });

  const ct = upstreamResp.headers.get('content-type') || '';
  if (!ct.toLowerCase().includes('application/json')) {
    const snippet = (await upstreamResp.text()).slice(0, 800);
    return NextResponse.json(
      { ok: false, message: 'Upstream non-JSON', status: upstreamResp.status, snippet },
      { status: 502 }
    );
  }

  const buf = await upstreamResp.arrayBuffer();
  const out = new NextResponse(buf, {
    status: upstreamResp.status,
    headers: upstreamResp.headers,
  });
  return out;
}

export async function GET(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params);
}
export async function POST(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params);
}
export async function OPTIONS(req: NextRequest, { params }: { params: { path?: string[] } }) {
  return forward(req, params);
}


