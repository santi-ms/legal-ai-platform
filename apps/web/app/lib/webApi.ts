import { backendFetchJSON } from "@/app/lib/server-api";

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

export interface DocumentsResponse {
  ok: boolean;
  items: Document[];
  total: number;
  page: number;
  pageSize: number;
  message?: string;
  error?: string;
}

export interface DocumentResponse {
  ok: boolean;
  document?: Document;
  message?: string;
  error?: string;
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

/**
 * Helper "content-type aware" que nunca parsea HTML como JSON
 */
export async function apiFetchJSON<T = any>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { Accept: "application/json", ...(init.headers || {}) },
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const text = await res.text().catch(() => "");
    const preview = text.slice(0, 400);
    throw new Error(
      `Respuesta no-JSON (status ${res.status}, ct="${ct}"). body="${preview}"`
    );
  }

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`JSON inválido (status ${res.status}).`);
  }

  if (!res.ok || data?.ok === false) {
    const msg = data?.message || data?.error || `Error ${res.status}`;
    throw new Error(msg);
  }

  return data as T;
}

/**
 * Lista documentos con filtros y paginación
 * Funciona tanto en Server Components como en Client Components
 */
export async function listDocuments(
  params?: DocumentsParams | Record<string, any> | URLSearchParams
): Promise<DocumentsResponse> {
  let qs = "";
  if (params instanceof URLSearchParams) {
    const serialized = params.toString();
    qs = serialized ? `?${serialized}` : "";
  } else if (params && typeof params === "object") {
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && `${value}` !== "") {
        usp.set(key, `${value}`);
      }
    }
    const serialized = usp.toString();
    qs = serialized ? `?${serialized}` : "";
  }

  return backendFetchJSON<DocumentsResponse>(`/documents${qs}`);
}

/**
 * Obtiene un documento por ID
 */
export async function getDocument(id: string): Promise<DocumentResponse> {
  return apiFetchJSON<DocumentResponse>(`/api/_proxy/documents/${id}`);
}

/**
 * Duplica un documento
 */
export async function duplicateDocument(id: string): Promise<{ ok: boolean; data: { id: string }; message?: string }> {
  return apiFetchJSON(`/api/_proxy/documents/${id}/duplicate`, {
    method: "POST",
  });
}

/**
 * Elimina un documento
 */
export async function deleteDocument(id: string): Promise<{ ok: boolean; message?: string }> {
  return apiFetchJSON(`/api/_proxy/documents/${id}`, {
    method: "DELETE",
  });
}

/**
 * Actualiza metadatos de un documento
 */
export async function patchDocument(
  id: string,
  payload: { type?: string; jurisdiccion?: string; tono?: string }
): Promise<{ ok: boolean; document?: Document; message?: string }> {
  return apiFetchJSON(`/api/_proxy/documents/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

/**
 * Obtiene la URL del PDF (via proxy)
 */
export function getPdfUrl(id: string): string {
  return `/api/_proxy/documents/${id}/pdf`;
}
