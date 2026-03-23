import { buildFrontendUrl, isServer } from "./url-utils";

/**
 * Helper para llamar al proxy de documentos
 * Funciona tanto en client-side como en server-side (RSC)
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
  /** Cliente asociado (opcional) */
  clientId?: string | null;
  client?: { id: string; name: string; type: string } | null;
  lastVersion: {
    id: string;
    rawText: string;
    /** Contenido editado manualmente por el usuario. Si existe, tiene prioridad sobre rawText para el PDF. */
    editedContent?: string | null;
    pdfUrl: string | null;
    /** Version status: "generated" | "needs_review" | "draft" | "reviewed" | "final" */
    status: string | null;
    /** Post-generation output validation issues. Present when status === "needs_review". */
    outputWarnings: Array<{
      code: string;
      message: string;
      match?: string;
      severity: "error" | "warning";
    }> | null;
    createdAt: string;
  } | null;
}

export interface DocumentsParams {
  query?: string;
  type?: string;
  jurisdiccion?: string;
  clientId?: string;
  expedienteId?: string;
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

  // Construir URL: absoluta en servidor, relativa en cliente
  const url = isServer()
    ? buildFrontendUrl(`${PROXY_BASE}${normalized}`)
    : `${PROXY_BASE}${normalized}`;

  const resp = await fetch(url, {
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

export interface DocumentStats {
  total: number;
  totalClients: number;
  byStatus: {
    generated: number;
    needs_review: number;
    draft: number;
    reviewed: number;
    final: number;
    [key: string]: number;
  };
  /** Documents grouped by type */
  byType: Record<string, number>;
  /** Documents per month — last 6 months, ordered oldest→newest */
  byMonth: Array<{ month: string; count: number }>;
  /** Expedientes con status "activo" */
  expedientesActivos: number;
  /** Activos con deadline vencido o ≤ 3 días */
  vencimientosUrgentes: number;
}

export async function getDocumentStats(): Promise<DocumentStats> {
  const { data } = await proxyJson<any>("/documents/stats");
  return {
    total:                data?.total                ?? 0,
    totalClients:         data?.totalClients         ?? 0,
    expedientesActivos:   data?.expedientesActivos   ?? 0,
    vencimientosUrgentes: data?.vencimientosUrgentes ?? 0,
    byStatus: {
      generated:    data?.byStatus?.generated    ?? 0,
      needs_review: data?.byStatus?.needs_review  ?? 0,
      draft:        data?.byStatus?.draft         ?? 0,
      reviewed:     data?.byStatus?.reviewed      ?? 0,
      final:        data?.byStatus?.final         ?? 0,
    },
    byType:  data?.byType  ?? {},
    byMonth: data?.byMonth ?? [],
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

/** Cambia el estado de revisión de la última versión del documento (workflow) */
export async function updateDocumentReviewStatus(
  id: string,
  status: "draft" | "generated" | "needs_review" | "reviewed" | "final"
): Promise<{ ok: boolean; status: string }> {
  const { data } = await proxyJson<any>(`/documents/${id}/review-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return data;
}

export interface DocumentVersion {
  id: string;
  status: string | null;
  rawText: string;
  editedContent: string | null;
  pdfUrl: string | null;
  createdAt: string;
}

export async function getDocumentVersions(documentId: string): Promise<DocumentVersion[]> {
  const { data } = await proxyJson<any>(`/documents/${documentId}/versions`);
  return data?.versions ?? [];
}

// ─── Document Annotations ────────────────────────────────────────────────────

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  content: string;
  resolved: boolean;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string | null; email: string } | null;
}

export async function listDocumentAnnotations(documentId: string): Promise<DocumentAnnotation[]> {
  const { data } = await proxyJson<any>(`/documents/${documentId}/annotations`);
  return data?.annotations ?? [];
}

export async function createDocumentAnnotation(
  documentId: string,
  content: string
): Promise<DocumentAnnotation> {
  const { data } = await proxyJson<any>(`/documents/${documentId}/annotations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  return data.annotation;
}

export async function updateDocumentAnnotation(
  documentId: string,
  annotationId: string,
  patch: { content?: string; resolved?: boolean }
): Promise<DocumentAnnotation> {
  const { data } = await proxyJson<any>(`/documents/${documentId}/annotations/${annotationId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  return data.annotation;
}

export async function deleteDocumentAnnotation(
  documentId: string,
  annotationId: string
): Promise<void> {
  await proxyJson<any>(`/documents/${documentId}/annotations/${annotationId}`, {
    method: "DELETE",
  });
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

/**
 * Asocia o desasocia un cliente de un documento.
 * @param clientId — UUID del cliente, o null para desasociar
 */
export async function patchDocumentClient(
  id: string,
  clientId: string | null
): Promise<{ ok: boolean; data?: { clientId: string | null; client: { id: string; name: string; type: string } | null } }> {
  const { data } = await proxyJson<any>(`/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId }),
  });
  return data;
}

/**
 * Asocia o desasocia un expediente de un documento.
 * @param expedienteId — UUID del expediente, o null para desasociar
 */
export async function patchDocumentExpediente(
  id: string,
  expedienteId: string | null
): Promise<{ ok: boolean; data?: { expedienteId: string | null; expediente: { id: string; title: string; number: string | null; matter: string; status: string } | null } }> {
  const { data } = await proxyJson<any>(`/documents/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ expedienteId }),
  });
  return data;
}

/**
 * Guarda el contenido editado manualmente por el usuario.
 * Invalida el PDF previo en el servidor (se regenerará desde este contenido al descargar).
 */
export async function saveEditedContent(
  id: string,
  content: string
): Promise<{ ok: boolean; versionId?: string; message?: string }> {
  const { data } = await proxyJson<{ ok: boolean; versionId?: string; message?: string }>(
    `/documents/${id}/content`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    }
  );
  return data;
}

// User Profile API
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string | null;
  bio: string;
  phone: string;
  matricula: string;
  especialidad: string;
  professionalRole: string;
  tenantId: string | null;
  notificationPreferences: {
    emailNotifications: boolean;
    securityAlerts: boolean;
    productUpdates: boolean;
  };
}

export interface TenantProfile {
  id: string;
  name: string;
  cuit: string;
  address: string;
  phone: string;
  website: string;
}

export interface UpdateProfileData {
  profile?: {
    name?: string;
    email?: string;
    bio?: string | null;
    phone?: string | null;
    matricula?: string | null;
    especialidad?: string | null;
    professionalRole?: string | null;
  };
  notificationPreferences?: {
    emailNotifications?: boolean;
    securityAlerts?: boolean;
    productUpdates?: boolean;
  };
}

export interface OnboardingPayload {
  name: string;
  company: string;
}

export interface OnboardingResult {
  alreadyCompleted: boolean;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    tenantId: string | null;
  };
  tenant: {
    id: string;
    name: string;
  } | null;
}

export async function getUserProfile(): Promise<UserProfile> {
  const { data } = await proxyJson<{ ok: boolean; data: UserProfile }>("/user/profile");
  if (!data.ok || !data.data) {
    throw new Error("Error al obtener perfil");
  }
  return data.data;
}

export async function updateUserProfile(
  payload: UpdateProfileData
): Promise<UserProfile> {
  const { data } = await proxyJson<{ ok: boolean; data: UserProfile; message?: string }>(
    "/user/profile",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );
  if (!data.ok || !data.data) {
    const errorMessage = data.message || "Error al actualizar perfil";
    throw new Error(errorMessage);
  }
  return data.data;
}

export async function getTenantProfile(): Promise<TenantProfile> {
  const { data } = await proxyJson<{ ok: boolean; data: TenantProfile }>("/user/tenant");
  if (!data.ok || !data.data) {
    throw new Error("Error al obtener datos del estudio");
  }
  return data.data;
}

export async function updateTenantProfile(
  payload: Partial<Omit<TenantProfile, "id">>
): Promise<TenantProfile> {
  const { data } = await proxyJson<{ ok: boolean; data: TenantProfile; message?: string }>(
    "/user/tenant",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
  if (!data.ok || !data.data) {
    throw new Error(data.message || "Error al actualizar datos del estudio");
  }
  return data.data;
}

export async function completeOnboarding(
  payload: OnboardingPayload
): Promise<OnboardingResult> {
  const { data } = await proxyJson<{ ok: boolean; data: OnboardingResult; message?: string }>(
    "/api/user/onboarding",
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!data.ok || !data.data) {
    throw new Error(data.message || "Error al completar onboarding");
  }

  return data.data;
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export type ClientType = "persona_fisica" | "persona_juridica";
export type DocumentIdType = "DNI" | "CUIT" | "CUIL" | "Pasaporte";

export interface Client {
  id: string;
  type: ClientType;
  name: string;
  documentType: DocumentIdType | null;
  documentNumber: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPayload {
  type: ClientType;
  name: string;
  documentType?: DocumentIdType | null;
  documentNumber?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  notes?: string | null;
}

export interface ListClientsResult {
  clients: Client[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ClientsParams {
  query?: string;
  type?: ClientType;
  page?: number;
  pageSize?: number;
  sort?: "name:asc" | "name:desc" | "createdAt:asc" | "createdAt:desc";
}

export async function listClients(params?: ClientsParams): Promise<ListClientsResult> {
  const qs = buildQuery(params);
  const { data } = await proxyJson<any>(`/clients${qs}`);
  return {
    clients: Array.isArray(data?.clients) ? data.clients : [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
  };
}

export async function getClient(id: string): Promise<Client> {
  const { data } = await proxyJson<any>(`/clients/${id}`);
  return data.client;
}

export async function createClient(payload: ClientPayload): Promise<Client> {
  const { data } = await proxyJson<any>("/clients", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.client;
}

export async function updateClient(id: string, payload: ClientPayload): Promise<Client> {
  const { data } = await proxyJson<any>(`/clients/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.client;
}

export async function deleteClient(id: string): Promise<void> {
  await proxyJson(`/clients/${id}`, { method: "DELETE" });
}

// ─── Expedientes ───────────────────────────────────────────────────────────────

export type ExpedienteMatter =
  | "civil" | "penal" | "laboral" | "familia"
  | "comercial" | "administrativo" | "constitucional" | "tributario" | "otro";

export type ExpedienteStatus = "activo" | "cerrado" | "archivado" | "suspendido";

export interface Expediente {
  id: string;
  number: string | null;
  title: string;
  matter: ExpedienteMatter;
  status: ExpedienteStatus;
  clientId: string | null;
  client: { id: string; name: string; type: string; email?: string | null; phone?: string | null } | null;
  court: string | null;
  judge: string | null;
  opposingParty: string | null;
  openedAt: string;
  closedAt: string | null;
  deadline: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { documents: number };
  documents?: Array<{
    id: string;
    type: string;
    jurisdiccion: string;
    estado: string;
    createdAt: string;
    versions: Array<{ id: string; status: string | null; pdfUrl: string | null }>;
  }>;
}

export interface ExpedientePayload {
  number?: string | null;
  title: string;
  matter: ExpedienteMatter;
  status?: ExpedienteStatus;
  clientId?: string | null;
  court?: string | null;
  judge?: string | null;
  opposingParty?: string | null;
  openedAt?: string | null;
  closedAt?: string | null;
  deadline?: string | null;
  notes?: string | null;
}

export interface ExpedientesParams {
  query?: string;
  matter?: ExpedienteMatter;
  status?: ExpedienteStatus;
  clientId?: string;
  page?: number;
  pageSize?: number;
  sort?: "createdAt:asc" | "createdAt:desc" | "title:asc" | "title:desc" | "openedAt:desc" | "openedAt:asc" | "deadline:asc" | "deadline:desc";
  /** "true" = only with deadline set, "false" = only without */
  hasDeadline?: "true" | "false";
  /** ISO datetime — deadline ≤ this date */
  deadlineBefore?: string;
  /** ISO datetime — deadline ≥ this date */
  deadlineAfter?: string;
}

export interface ListExpedientesResult {
  expedientes: Expediente[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listExpedientes(params?: ExpedientesParams): Promise<ListExpedientesResult> {
  const qs = buildQuery(params);
  const { data } = await proxyJson<any>(`/expedientes${qs}`);
  return {
    expedientes: Array.isArray(data?.expedientes) ? data.expedientes : [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
  };
}

export async function getExpediente(id: string): Promise<Expediente> {
  const { data } = await proxyJson<any>(`/expedientes/${id}`);
  return data.expediente;
}

export async function createExpediente(payload: ExpedientePayload): Promise<Expediente> {
  const { data } = await proxyJson<any>("/expedientes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.expediente;
}

export async function updateExpediente(id: string, payload: ExpedientePayload): Promise<Expediente> {
  const { data } = await proxyJson<any>(`/expedientes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return data.expediente;
}

export async function deleteExpediente(id: string): Promise<void> {
  await proxyJson(`/expedientes/${id}`, { method: "DELETE" });
}