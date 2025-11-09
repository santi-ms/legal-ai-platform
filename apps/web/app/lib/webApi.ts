/**
 * Helper client-side para llamar al proxy de documentos
 * Todas las requests van por el proxy server-side que inyecta el JWT
 */
export interface Document {
  id: string;
  type: string;
  jurisdiccion: string;
  tono: string | null;
  estado: string;
  costUsd: number | null;
  createdAt: string;
  updatedAt: string;
  tenantId: string;
  lastVersion: {
    id: string;
    rawText: string;
    pdfUrl: string | null;
    createdAt: string;
  } | null;
}

export interface DocumentsParams {
  query?: string;
  type?: string;
  jurisdiccion?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
  sort?: "createdAt:asc" | "createdAt:desc";
}

export type DocumentApiResponse = {
  ok?: boolean;
  document?: Document;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

const PROXY_BASE = "/api/_proxy";

export type ListDocumentsResult = {
  documents: Document[];
  total: number;
  page: number;
  pageSize: number;
  raw: unknown;
  status: number;
};

function buildQuery(params?: URLSearchParams | DocumentsParams | Record<string, any>) {
  if (!params) return "";
  if (params instanceof URLSearchParams) {
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }

  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const stringValue = Array.isArray(value) ? value[0] : String(value);
    if (stringValue !== "") {
      usp.set(key, stringValue);
    }
  });
  const serialized = usp.toString();
  return serialized ? `?${serialized}` : "";
}

function isJson(resp: Response) {
  const ct = resp.headers.get("content-type") || "";
  return ct.includes("application/json");
}

async function readJson(resp: Response) {
  if (!isJson(resp)) {
    const snippet = (await resp.text().catch(() => "")).slice(0, 400);
    throw new Error(`Proxy non-JSON: status=${resp.status}, snippet=${snippet}`);
  }

  try {
    return await resp.json();
  } catch {
    throw new Error(`JSON inválido (status ${resp.status}).`);
  }
}

async function proxyJson<T = any>(
  path: string,
  init: RequestInit = {}
): Promise<{ status: number; data: T }> {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  const resp = await fetch(`${PROXY_BASE}${normalized}`, {
    ...init,
    headers,
    cache: "no-store",
  });

  const data = await readJson(resp);

  if (!resp.ok || (data && typeof data === "object" && "ok" in data && (data as any).ok === false)) {
    const message =
      (data as any)?.message ||
      (data as any)?.error ||
      `Error ${resp.status}`;
    throw new Error(message);
  }

  return { status: resp.status, data: data as T };
}

export async function listDocuments(
  params?: URLSearchParams | DocumentsParams | Record<string, any>
): Promise<ListDocumentsResult> {
  const qs = buildQuery(params);
  const { status, data } = await proxyJson<any>(`/documents${qs}`);

  const documents = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];

  const total =
    typeof data?.total === "number"
      ? data.total
      : Array.isArray(documents)
      ? documents.length
      : 0;

  const page = typeof data?.page === "number" ? data.page : 1;
  const pageSize =
    typeof data?.pageSize === "number"
      ? data.pageSize
      : typeof data?.limit === "number"
      ? data.limit
      : documents.length || 20;

  return {
    documents,
    total,
    page,
    pageSize,
    raw: data,
    status,
  };
}

export async function getDocument(id: string) {
  const { data } = await proxyJson<DocumentApiResponse>(`/documents/${id}`);
  return data;
}

export async function duplicateDocument(id: string) {
  const { data } = await proxyJson(`/documents/${id}/duplicate`, {
    method: "POST",
  });
  return data as { ok: boolean; data?: { id: string }; message?: string };
}

export async function deleteDocument(id: string) {
  const { data } = await proxyJson(`/documents/${id}`, {
    method: "DELETE",
  });
  return data as { ok: boolean; message?: string };
}

export async function patchDocument(
  id: string,
  payload: { type?: string; jurisdiccion?: string; tono?: string }
) {
  const { data } = await proxyJson(`/documents/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  return data as { ok: boolean; document?: Document; message?: string };
}

export function getPdfUrl(id: string): string {
  return `${PROXY_BASE}/documents/${id}/pdf`;
}
