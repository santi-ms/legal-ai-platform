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
 * Lista documentos con filtros y paginación
 */
export async function listDocuments(
  params: DocumentsParams = {}
): Promise<DocumentsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.query) searchParams.set("query", params.query);
  if (params.type) searchParams.set("type", params.type);
  if (params.jurisdiccion) searchParams.set("jurisdiccion", params.jurisdiccion);
  if (params.from) searchParams.set("from", params.from);
  if (params.to) searchParams.set("to", params.to);
  if (params.page) searchParams.set("page", params.page.toString());
  if (params.pageSize) searchParams.set("pageSize", params.pageSize.toString());
  if (params.sort) searchParams.set("sort", params.sort);

  const queryString = searchParams.toString();
  const url = `/api/_proxy/documents${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Error al cargar documentos");
  }

  return data;
}

/**
 * Obtiene un documento por ID
 */
export async function getDocument(id: string): Promise<DocumentResponse> {
  const response = await fetch(`/api/_proxy/documents/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Error al cargar documento");
  }

  return data;
}

/**
 * Duplica un documento
 */
export async function duplicateDocument(id: string): Promise<{ ok: boolean; data: { id: string }; message?: string }> {
  const response = await fetch(`/api/_proxy/documents/${id}/duplicate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Error al duplicar documento");
  }

  return data;
}

/**
 * Elimina un documento
 */
export async function deleteDocument(id: string): Promise<{ ok: boolean; message?: string }> {
  const response = await fetch(`/api/_proxy/documents/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Error al eliminar documento");
  }

  return data;
}

/**
 * Actualiza metadatos de un documento
 */
export async function patchDocument(
  id: string,
  payload: { type?: string; jurisdiccion?: string; tono?: string }
): Promise<{ ok: boolean; document?: Document; message?: string }> {
  const response = await fetch(`/api/_proxy/documents/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Error al actualizar documento");
  }

  return data;
}

/**
 * Obtiene la URL del PDF (via proxy)
 */
export function getPdfUrl(id: string): string {
  return `/api/_proxy/documents/${id}/pdf`;
}
