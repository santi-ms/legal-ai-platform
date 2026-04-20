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
  /** Expediente asociado (opcional) */
  expedienteId?: string | null;
  expediente?: { id: string; title: string; number: string | null; matter: string; status: string } | null;
  /** Fragmento del contenido del documento que coincide con la búsqueda (solo cuando hay query) */
  matchSnippet?: string | null;
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
  // Siempre forzar Content-Type: application/json cuando hay body de texto/JSON
  // para que el proxy lo reenvíe correctamente y Fastify lo parsee
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
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
  /** Docs created this calendar month */
  docsThisMonth: number;
  /** Active (non-archived) clients */
  totalClients: number;
  /** New active clients created this calendar month */
  newClientsThisMonth: number;
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
  /** Expedientes grouped by matter type */
  byMateria: Record<string, number>;
  /** Expedientes con status "activo" */
  expedientesActivos: number;
  /** Activos con deadline vencido o ≤ 3 días */
  vencimientosUrgentes: number;
  /** Links de compartición activos y no expirados */
  activeShares: number;
  /** Total de análisis de contratos realizados */
  totalAnalyses: number;
  /** Costo total IA (USD) acumulado */
  aiCostUsdTotal: number;
  /** Costo IA (USD) este mes */
  aiCostUsdThisMonth: number;
}

export async function getDocumentStats(): Promise<DocumentStats> {
  const { data } = await proxyJson<any>("/documents/stats");
  return {
    total:                data?.total                ?? 0,
    docsThisMonth:        data?.docsThisMonth        ?? 0,
    totalClients:         data?.totalClients         ?? 0,
    newClientsThisMonth:  data?.newClientsThisMonth  ?? 0,
    expedientesActivos:   data?.expedientesActivos   ?? 0,
    vencimientosUrgentes: data?.vencimientosUrgentes ?? 0,
    byStatus: {
      generated:    data?.byStatus?.generated    ?? 0,
      needs_review: data?.byStatus?.needs_review  ?? 0,
      draft:        data?.byStatus?.draft         ?? 0,
      reviewed:     data?.byStatus?.reviewed      ?? 0,
      final:        data?.byStatus?.final         ?? 0,
    },
    byType:        data?.byType    ?? {},
    byMonth:       data?.byMonth   ?? [],
    byMateria:     data?.byMateria ?? {},
    activeShares:       data?.activeShares       ?? 0,
    totalAnalyses:      data?.totalAnalyses      ?? 0,
    aiCostUsdTotal:     data?.aiCostUsdTotal     ?? 0,
    aiCostUsdThisMonth: data?.aiCostUsdThisMonth ?? 0,
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
 * Descarga el documento en formato Word (.docx).
 */
export async function downloadDocumentDocx(id: string, title?: string): Promise<void> {
  const response = await fetch(`${PROXY_BASE}/documents/${id}/docx`);
  if (!response.ok) throw new Error("Error al generar el archivo Word");
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${(title || id).replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}.docx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
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
  logoUrl?: string | null;
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
  professionalRole?: string;
  promoCode?: string;
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
  promo?: {
    applied: boolean;
    planCode?: string;
    trialDays?: number;
    warning?: string;
  };
}

export async function getUserProfile(): Promise<UserProfile> {
  const { data } = await proxyJson<{ ok: boolean; data: UserProfile }>("/api/user/profile");
  if (!data.ok || !data.data) {
    throw new Error("Error al obtener perfil");
  }
  return data.data;
}

export async function updateUserProfile(
  payload: UpdateProfileData
): Promise<UserProfile> {
  const { data } = await proxyJson<{ ok: boolean; data: UserProfile; message?: string }>(
    "/api/user/profile",
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
  const { data } = await proxyJson<{ ok: boolean; data: TenantProfile }>("/api/user/tenant");
  if (!data.ok || !data.data) {
    throw new Error("Error al obtener datos del estudio");
  }
  return data.data;
}

export async function updateTenantProfile(
  payload: Partial<Omit<TenantProfile, "id">>
): Promise<TenantProfile> {
  const { data } = await proxyJson<{ ok: boolean; data: TenantProfile; message?: string }>(
    "/api/user/tenant",
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

export async function uploadTenantLogo(
  file: File
): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const url = isServer()
    ? buildFrontendUrl(`${PROXY_BASE}/user/tenant/logo`)
    : `${PROXY_BASE}/user/tenant/logo`;

  const resp = await fetch(url, {
    method: "POST",
    body: formData,
    // No poner Content-Type — el browser lo setea con el boundary correcto
    cache: "no-store",
  });

  const data = await readJson(resp);
  if (!resp.ok || !data?.ok) {
    throw new Error(data?.message || `Error ${resp.status}`);
  }
  return { logoUrl: data.data.logoUrl };
}

export async function deleteTenantLogo(): Promise<void> {
  const { data } = await proxyJson<{ ok: boolean; message?: string }>(
    "/user/tenant/logo",
    { method: "DELETE" }
  );
  if (!data.ok) {
    throw new Error(data.message || "Error al eliminar el logo");
  }
}

/**
 * Hace una pregunta a la IA sobre un documento específico.
 * El documento se usa como contexto y Claude genera una respuesta.
 */
export async function askDocument(
  documentId: string,
  question: string
): Promise<string> {
  const { data } = await proxyJson<{ ok: boolean; answer?: string; message?: string }>(
    `/documents/${documentId}/ask`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    }
  );
  if (!data.ok || !data.answer) {
    throw new Error(data.message || "Error al procesar la pregunta");
  }
  return data.answer;
}

export interface DocumentRevisionSuggestion {
  id: string;
  section: string;
  original: string;
  suggested: string;
  explanation: string;
}

/**
 * Genera sugerencias de revisión con IA para un documento.
 * Devuelve entre 3 y 5 cambios concretos con texto original y sugerido.
 */
export async function getDocumentRevisions(
  documentId: string
): Promise<DocumentRevisionSuggestion[]> {
  const { data } = await proxyJson<{ ok: boolean; suggestions?: DocumentRevisionSuggestion[]; message?: string }>(
    `/documents/${documentId}/revisions`,
    { method: "POST" }
  );
  if (!data.ok) {
    throw new Error(data.message || "Error al generar revisiones");
  }
  return data.suggestions ?? [];
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
  // Persona de contacto (persona_juridica)
  contactPersonName: string | null;
  contactPersonRole: string | null;
  contactPersonPhone: string | null;
  contactPersonEmail: string | null;
  notes: string | null;
  archivedAt: string | null;
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
  contactPersonName?: string | null;
  contactPersonRole?: string | null;
  contactPersonPhone?: string | null;
  contactPersonEmail?: string | null;
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
  archived?: boolean;
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

/** Archivar cliente (soft delete) */
export async function deleteClient(id: string): Promise<void> {
  await proxyJson(`/clients/${id}`, { method: "DELETE" });
}

/** Restaurar cliente archivado */
export async function unarchiveClient(id: string): Promise<void> {
  await proxyJson(`/clients/${id}/unarchive`, { method: "PATCH" });
}

/** Eliminar cliente definitivamente (solo si ya está archivado) */
export async function permanentDeleteClient(id: string): Promise<void> {
  await proxyJson(`/clients/${id}/permanent`, { method: "DELETE" });
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

// ─── Cálculo de plazos procesales ─────────────────────────────────────────────

export interface PlazoResult {
  fechaVencimiento: string;
  diasCalendario: number;
  feriadosSaltados: Array<{ fecha: string; nombre: string }>;
}

export async function calcularPlazoProcesal(
  fechaNotificacion: string, // "YYYY-MM-DD"
  diasHabiles: number
): Promise<PlazoResult> {
  const { data } = await proxyJson<any>("/expedientes/calcular-plazo", {
    method: "POST",
    body: JSON.stringify({ fechaNotificacion, diasHabiles }),
  });
  return data as PlazoResult;
}

// ─── Floating Assistant ───────────────────────────────────────────────────────

export interface AssistantMessage {
  role: "user" | "assistant";
  content: string;
}

export async function sendAssistantMessage(
  messages: AssistantMessage[]
): Promise<string> {
  const { data } = await proxyJson<any>("/assistant/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });
  return data?.reply ?? "";
}

// ─── Contract Analysis ────────────────────────────────────────────────────────

export interface AnalysisRiskyClause {
  title: string;
  text: string;
  risk: "Alta" | "Media" | "Baja";
  explanation: string;
  recommendation: string;
}

export interface AnalysisMissingClause {
  title: string;
  importance: "Alta" | "Media" | "Baja";
  explanation: string;
}

export interface AnalysisResult {
  summary: string;
  contractType: string;
  parties: string[];
  keyDates: Array<{ label: string; date: string }>;
  mainObligations: string[];
  riskyClausesMain: AnalysisRiskyClause[];
  missingClauses: AnalysisMissingClause[];
  generalRecommendations: string[];
  overallRisk: "low" | "medium" | "high";
}

export interface ContractAnalysis {
  id: string;
  originalName: string;
  fileSize: number;
  storageUrl?: string;
  status: "pending" | "processing" | "done" | "error";
  errorMessage?: string | null;
  result: AnalysisResult | null;
  createdAt: string;
  uploadedBy?: { firstName: string | null; lastName: string | null; email: string } | null;
}

/**
 * Sube un PDF para análisis con IA.
 * El backend responde inmediatamente con 202 (el análisis se procesa en segundo plano).
 * Retorna { analysisId, status: "processing" } para que el frontend haga polling.
 */
export async function uploadContractForAnalysis(
  file: File
): Promise<{ analysisId: string; status: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const url = isServer()
    ? buildFrontendUrl(`${PROXY_BASE}/analysis/upload`)
    : `${PROXY_BASE}/analysis/upload`;

  const resp = await fetch(url, {
    method: "POST",
    body: formData,
    cache: "no-store",
  });

  const data = await readJson(resp);
  if (!resp.ok || (data && typeof data === "object" && "ok" in data && (data as any).ok === false)) {
    throw new Error((data as any)?.message || (data as any)?.error || `Error ${resp.status}`);
  }
  return {
    analysisId: (data as any).analysisId as string,
    status: (data as any).status as string,
  };
}

export async function listContractAnalyses(page = 1, pageSize = 20): Promise<{
  analyses: ContractAnalysis[];
  total: number;
  page: number;
  pageSize: number;
}> {
  const { data } = await proxyJson<any>(`/analysis?page=${page}&pageSize=${pageSize}`);
  return {
    analyses: Array.isArray(data?.analyses) ? data.analyses : [],
    total: data?.total ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? 20,
  };
}

export async function getContractAnalysis(id: string): Promise<ContractAnalysis> {
  const { data } = await proxyJson<any>(`/analysis/${id}`);
  return data.analysis;
}

export async function deleteContractAnalysis(id: string): Promise<void> {
  await proxyJson(`/analysis/${id}`, { method: "DELETE" });
}

export async function askContractAnalysis(id: string, question: string): Promise<string> {
  const { data } = await proxyJson<any>(`/analysis/${id}/ask`, {
    method: "POST",
    body: JSON.stringify({ question }),
  });
  return data.answer as string;
}

// ─── Calendar ─────────────────────────────────────────────────────────────────

export type DeadlineUrgency = "overdue" | "urgent" | "warning" | "normal";

export interface CalendarDeadlineItem {
  id: string;
  number: string | null;
  title: string;
  matter: string;
  status: string;
  court: string | null;
  client: { id: string; name: string } | null;
  deadline: string; // ISO string
  dateKey: string;  // "YYYY-MM-DD"
  urgency: DeadlineUrgency;
}

export interface CalendarDay {
  date: string; // "YYYY-MM-DD"
  items: CalendarDeadlineItem[];
}

export interface CalendarSummary {
  total: number;
  overdue: number;
  urgent: number;
  warning: number;
  normal: number;
}

export interface CalendarData {
  year: number;
  month: number;
  days: CalendarDay[];
  summary: CalendarSummary;
}

export async function getCalendarDeadlines(year: number, month: number): Promise<CalendarData> {
  const { data } = await proxyJson<any>(`/expedientes/calendar?year=${year}&month=${month}`);
  return {
    year:    data?.year    ?? year,
    month:   data?.month   ?? month,
    days:    data?.days    ?? [],
    summary: data?.summary ?? { total: 0, overdue: 0, urgent: 0, warning: 0, normal: 0 },
  };
}

// ─── Reference Documents ───────────────────────────────────────────────────────

export const REFERENCE_DOCUMENT_TYPES = [
  // ── Tipos con flujo optimizado ──────────────────────────────────────────────
  { value: "legal_notice",        label: "Carta Documento" },
  { value: "service_contract",    label: "Contrato de Prestación de Servicios" },
  { value: "nda",                 label: "Acuerdo de Confidencialidad (NDA)" },
  { value: "lease",               label: "Contrato de Locación (Alquiler)" },
  { value: "debt_recognition",    label: "Reconocimiento de Deuda" },
  { value: "simple_authorization",label: "Autorización Simple" },
  // ── Tipos libres frecuentes ─────────────────────────────────────────────────
  { value: "comodato",            label: "Contrato de Comodato" },
  { value: "mutuo",               label: "Contrato de Mutuo (Préstamo)" },
  { value: "cesion_derechos",     label: "Cesión de Derechos" },
  { value: "compraventa_vehiculo",label: "Compraventa de Vehículo" },
  { value: "compraventa_inmueble",label: "Compraventa de Inmueble" },
  { value: "contrato_trabajo",    label: "Contrato de Trabajo" },
  { value: "convenio_desvinculacion", label: "Convenio de Desvinculación" },
  { value: "convenio_honorarios", label: "Convenio de Honorarios" },
  { value: "locacion_de_obra",    label: "Contrato de Locación de Obra" },
  { value: "poder_especial",      label: "Poder Especial" },
  { value: "poder_general",       label: "Poder General" },
  { value: "acta_directorio",     label: "Acta de Directorio" },
  { value: "franquicia",          label: "Contrato de Franquicia" },
  { value: "distribucion",        label: "Contrato de Distribución" },
  { value: "agencia",             label: "Contrato de Agencia" },
  { value: "joint_venture",       label: "Acuerdo de Joint Venture" },
  { value: "donacion",            label: "Donación" },
  { value: "otro",                label: "Otro tipo de documento" },
] as const;

export type ReferenceDocumentType = (typeof REFERENCE_DOCUMENT_TYPES)[number]["value"];

export interface ReferenceDocument {
  id: string;
  originalName: string;
  documentType: string;
  fileSize: number;
  storageUrl: string;
  hasText?: boolean;
  createdAt: string;
  uploadedBy?: { firstName: string; lastName: string; email: string } | null;
}

/**
 * Sube un PDF de referencia al servidor.
 * Hace el fetch directamente (no a través de proxyJson) ya que es multipart.
 */
export async function uploadReferenceDocument(
  file: File,
  documentType: string
): Promise<{ doc: ReferenceDocument; warning: string | null }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  const url = isServer()
    ? buildFrontendUrl(`${PROXY_BASE}/documents/references/upload`)
    : `${PROXY_BASE}/documents/references/upload`;

  const resp = await fetch(url, {
    method: "POST",
    body: formData,
    // No poner Content-Type — el browser lo setea con el boundary correcto
    cache: "no-store",
  });

  const data = await readJson(resp);
  if (!resp.ok || (data && typeof data === "object" && "ok" in data && (data as any).ok === false)) {
    throw new Error((data as any)?.message || (data as any)?.error || `Error ${resp.status}`);
  }
  return {
    doc: (data as any).referenceDocument as ReferenceDocument,
    warning: (data as any).warning ?? null,
  };
}

export async function listReferenceDocuments(
  documentType?: string
): Promise<ReferenceDocument[]> {
  const qs = documentType ? `?documentType=${encodeURIComponent(documentType)}` : "";
  const { data } = await proxyJson<any>(`/documents/references${qs}`);
  return Array.isArray(data?.references) ? data.references : [];
}

export async function deleteReferenceDocument(id: string): Promise<void> {
  await proxyJson(`/documents/references/${id}`, { method: "DELETE" });
}
// ─── Billing ─────────────────────────────────────────────────────────────────

export interface BillingPlan {
  id: string;
  code: string;
  name: string;
  description: string;
  priceArs: number | null;
  trialDays: number;
  limits: {
    docsPerMonth: number;
    maxUsers: number;
    maxClients: number;
    maxExpedientes: number;
    maxReferenceFiles: number;
  };
  features: {
    chatIA: boolean;
    edicion: boolean;
    analytics: boolean;
    anotaciones: boolean;
    logoEstudio: boolean;
    referenciaDocs: boolean;
    exportarReportes: boolean;
  };
}

export interface BillingSubscription {
  id: string;
  status: string;
  trialEndsAt: string | null;
  startsAt: string;
  renewsAt: string | null;
  maxUsers: number;
}

export interface BillingData {
  subscription: BillingSubscription | null;
  plan: BillingPlan | null;
  usage: { docsThisMonth: number };
}

export interface Invoice {
  id: string;
  mpPaymentId: string | null;
  status: string;
  amountArs: number;
  period: string;
  dueAt: string;
  paidAt: string | null;
  createdAt: string;
}

export async function getBillingSubscription(): Promise<BillingData> {
  const { data } = await proxyJson<any>("/billing/subscription");
  return data;
}

export async function getBillingPlans(): Promise<BillingPlan[]> {
  const { data } = await proxyJson<any>("/billing/plans");
  return data?.plans ?? [];
}

export async function startCheckout(planCode: string, additionalUsers = 0): Promise<{ checkoutUrl: string; subscriptionId?: string }> {
  const { data } = await proxyJson<any>("/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ planCode, additionalUsers }),
  });
  return data;
}

export type ChangePlanResult =
  | { type: "upgrade"; checkoutUrl: string; proRataAmount: number; daysRemaining: number; renewsAt: string }
  | { type: "downgrade"; newPlanName: string; renewsAt: string | null };

export async function changePlan(planCode: string, additionalUsers = 0): Promise<ChangePlanResult> {
  const { data } = await proxyJson<any>("/billing/change-plan", {
    method: "POST",
    body: JSON.stringify({ planCode, additionalUsers }),
  });
  return data;
}

export async function cancelSubscription(): Promise<{
  canceledAtPeriodEnd: boolean;
  renewsAt?: string | null;
  message?: string;
}> {
  const { data } = await proxyJson<any>("/billing/subscription", { method: "DELETE" });
  return {
    canceledAtPeriodEnd: data?.canceledAtPeriodEnd ?? false,
    renewsAt: data?.renewsAt ?? null,
    message: data?.message,
  };
}

export async function reactivateSubscription(): Promise<{ checkoutUrl: string }> {
  const { data } = await proxyJson<any>("/billing/reactivate", { method: "POST" });
  return { checkoutUrl: data.checkoutUrl };
}

export async function getInvoices(): Promise<Invoice[]> {
  const { data } = await proxyJson<any>("/billing/invoices");
  return data?.invoices ?? [];
}

// ─── Team ─────────────────────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
  professionalRole: string | null;
  createdAt: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
  invitedBy: { name: string | null; firstName: string | null; lastName: string | null };
}

export interface InvitationInfo {
  email: string;
  tenantName: string;
  inviterName: string;
  expiresAt: string;
}

export async function getTeamMembers(): Promise<{
  members: TeamMember[];
  maxUsers: number;
  usedSlots: number;
  availableSlots: number | null;
}> {
  const { data } = await proxyJson<any>("/team/members");
  return data;
}

export async function getTeamInvitations(): Promise<TeamInvitation[]> {
  const { data } = await proxyJson<any>("/team/invitations");
  return data?.invitations ?? [];
}

export async function inviteMember(email: string): Promise<void> {
  await proxyJson("/team/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function removeMember(userId: string): Promise<void> {
  await proxyJson(`/team/members/${userId}`, { method: "DELETE" });
}

export async function cancelInvitation(invitationId: string): Promise<void> {
  await proxyJson(`/team/invitations/${invitationId}`, { method: "DELETE" });
}

/** Obtener info de invitación (público — sin auth) */
export async function getInvitationInfo(token: string): Promise<InvitationInfo> {
  // Este endpoint es público — no pasa por el proxy con auth
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const resp = await fetch(`${apiUrl}/team/invite/${token}`, { cache: "no-store" });
  const data = await resp.json();
  if (!data.ok) throw new Error(data.message ?? "Invitación inválida");
  return data.invitation;
}

/** Aceptar invitación (requiere auth) */
export async function acceptInvitation(token: string): Promise<{ tenantId: string; tenantName: string }> {
  const { data } = await proxyJson<any>(`/team/invite/${token}/accept`, { method: "POST" });
  return data;
}

// ─── Document Sharing ─────────────────────────────────────────────────────────

export interface DocumentShareLink {
  id: string;
  token: string;
  shareUrl: string;
  expiresAt: string;
  viewCount: number;
  lastViewedAt: string | null;
  status: "active" | "revoked";
  isExpired: boolean;
  createdAt: string;
}

export interface SharedDocumentInfo {
  share: { id: string; expiresAt: string; viewCount: number };
  document: {
    id: string;
    type: string | null;
    typeLabel: string | null;
    jurisdiccion: string | null;
    createdAt: string;
    client: { name: string; type: string } | null;
    hasPdf: boolean;
    pdfUrl: string | null;
  };
}

/** Crear link de compartición para un documento */
export async function createDocumentShare(
  documentId: string,
  expiresInDays = 7
): Promise<DocumentShareLink> {
  const { data } = await proxyJson<any>(`/documents/${documentId}/share`, {
    method: "POST",
    body: JSON.stringify({ expiresInDays }),
  });
  return data.share;
}

/** Listar links de compartición activos de un documento */
export async function listDocumentShares(documentId: string): Promise<DocumentShareLink[]> {
  const { data } = await proxyJson<any>(`/documents/${documentId}/shares`);
  return data.shares ?? [];
}

/** Revocar un link de compartición */
export async function revokeDocumentShare(shareId: string): Promise<void> {
  await proxyJson<any>(`/documents/shares/${shareId}`, { method: "DELETE" });
}

/** Obtener info de documento compartido (público — sin auth) */
export async function getSharedDocument(token: string): Promise<SharedDocumentInfo> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
  const resp = await fetch(`${apiUrl}/shared/${token}`, { cache: "no-store" });
  const data = await resp.json();
  if (!data.ok) {
    const err: any = new Error(data.message ?? "Link no disponible");
    err.code = data.error;
    throw err;
  }
  return { share: data.share, document: data.document };
}

// ---------------------------------------------------------------------------
// Document Prompt Library
// ---------------------------------------------------------------------------

export interface DocumentPrompt {
  id: string;
  documentType: string;
  label: string;
  systemMessage: string;
  baseInstructions: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PromptBody {
  documentType: string;
  label: string;
  systemMessage: string;
  baseInstructions: string[];
  isActive?: boolean;
}

export interface PromptPatch {
  label?: string;
  systemMessage?: string;
  baseInstructions?: string[];
  isActive?: boolean;
}

/** Listar todos los prompts */
export async function listPrompts(): Promise<DocumentPrompt[]> {
  const { data } = await proxyJson<any>(`/prompts`);
  return data.prompts ?? [];
}

/** Obtener un prompt por tipo de documento */
export async function getPrompt(documentType: string): Promise<DocumentPrompt> {
  const { data } = await proxyJson<any>(`/prompts/${encodeURIComponent(documentType)}`);
  return data.prompt;
}

/** Crear un nuevo prompt (admin only) */
export async function createPrompt(body: PromptBody): Promise<DocumentPrompt> {
  const { data } = await proxyJson<any>(`/prompts`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.prompt;
}

/** Upsert (crear o reemplazar) un prompt por tipo (admin only) */
export async function upsertPrompt(documentType: string, body: Omit<PromptBody, "documentType">): Promise<DocumentPrompt> {
  const { data } = await proxyJson<any>(`/prompts/${encodeURIComponent(documentType)}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
  return data.prompt;
}

/** Actualización parcial de un prompt (admin only) */
export async function patchPrompt(documentType: string, patch: PromptPatch): Promise<DocumentPrompt> {
  const { data } = await proxyJson<any>(`/prompts/${encodeURIComponent(documentType)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.prompt;
}

/** Eliminar un prompt (admin only) */
export async function deletePrompt(documentType: string): Promise<void> {
  await proxyJson<any>(`/prompts/${encodeURIComponent(documentType)}`, {
    method: "DELETE",
  });
}

// ---------------------------------------------------------------------------
// Super-Admin API
// ---------------------------------------------------------------------------

export interface SuperAdminOverview {
  totalTenants: number;
  totalUsers: number;
  totalDocuments: number;
  docsThisMonth: number;
  totalClients: number;
  totalExpedientes: number;
  totalAnalyses: number;
  totalAiCostUsd: number;
  planBreakdown: Array<{ plan: string; count: number }>;
  recentTenants: Array<{
    id: string;
    name: string;
    currentPlanCode: string;
    createdAt: string;
    _count: { users: number; documents: number };
  }>;
}

export interface SuperAdminTenant {
  id: string;
  name: string;
  cuit: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  currentPlanCode: string;
  createdAt: string;
  updatedAt: string;
  aiCostUsd: number;
  _count: {
    users: number;
    documents: number;
    clients: number;
    expedientes: number;
    contractAnalyses: number;
  };
}

export interface SuperAdminTenantDetail extends SuperAdminTenant {
  subscription: {
    status: string;
    startsAt: string | null;
    renewsAt: string | null;
    trialEndsAt: string | null;
    maxUsers: number | null;
    plan: { code: string; name: string; priceArs: number | null } | null;
  } | null;
  users: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    email: string;
    role: string;
    professionalRole: string | null;
    especialidad: string | null;
    createdAt: string;
    emailVerified: string | null;
  }>;
  recentDocuments: Array<{
    id: string;
    type: string;
    jurisdiccion: string;
    estado: string;
    costUsd: number | null;
    createdAt: string;
    client: { name: string } | null;
    createdBy: { firstName: string | null; lastName: string | null; email: string } | null;
  }>;
  recentClients: Array<{
    id: string;
    name: string;
    type: string;
    documentNumber: string | null;
    email: string | null;
    createdAt: string;
  }>;
  analyses: Array<{
    id: string;
    originalName: string;
    status: string;
    fileSize: number;
    createdAt: string;
  }>;
  aiUsage: {
    total: { costUsd: number; promptTokens: number; completionTokens: number; calls: number };
    byService: Array<{
      service: string;
      costUsd: number;
      promptTokens: number;
      completionTokens: number;
      calls: number;
    }>;
  };
  docsByType: Array<{ type: string; count: number }>;
}

export interface SuperAdminUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  email: string;
  role: string;
  professionalRole: string | null;
  especialidad: string | null;
  createdAt: string;
  emailVerified: string | null;
  tenantId: string | null;
  tenant: { name: string; currentPlanCode: string } | null;
}

export async function getSuperAdminOverview(): Promise<SuperAdminOverview> {
  const { data } = await proxyJson<any>(`/superadmin/overview`);
  return data.overview;
}

export async function getSuperAdminTenants(params?: {
  page?: number;
  pageSize?: number;
  plan?: string;
  search?: string;
}): Promise<{ tenants: SuperAdminTenant[]; total: number; page: number; pageSize: number }> {
  const qs = buildQuery(params ?? {});
  const { data } = await proxyJson<any>(`/superadmin/tenants${qs}`);
  return { tenants: data.tenants, total: data.total, page: data.page, pageSize: data.pageSize };
}

export async function getSuperAdminTenant(id: string): Promise<SuperAdminTenantDetail> {
  const { data } = await proxyJson<any>(`/superadmin/tenants/${id}`);
  return data.tenant;
}

export async function getSuperAdminUsers(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<{ users: SuperAdminUser[]; total: number; page: number; pageSize: number }> {
  const qs = buildQuery(params ?? {});
  const { data } = await proxyJson<any>(`/superadmin/users${qs}`);
  return { users: data.users, total: data.total, page: data.page, pageSize: data.pageSize };
}

// ─── Promo Codes (Super-Admin) ────────────────────────────────────────────────

export interface PromoCode {
  id: string;
  code: string;
  planCode: string;
  trialDays: number;
  maxUses: number;       // -1 = ilimitado
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PromoCodePayload {
  code: string;
  planCode?: "pro" | "proplus" | "estudio";
  trialDays?: number;
  maxUses?: number;
  expiresAt?: string | null;
  note?: string | null;
}

export interface PromoCodePatch {
  isActive?: boolean;
  trialDays?: number;
  maxUses?: number;
  expiresAt?: string | null;
  note?: string | null;
}

export async function listPromoCodes(): Promise<PromoCode[]> {
  const { data } = await proxyJson<any>("/superadmin/promos");
  return data?.promos ?? [];
}

export async function createPromoCode(payload: PromoCodePayload): Promise<PromoCode> {
  const { data } = await proxyJson<any>("/superadmin/promos", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return data.promo;
}

export async function patchPromoCode(id: string, patch: PromoCodePatch): Promise<PromoCode> {
  const { data } = await proxyJson<any>(`/superadmin/promos/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return data.promo;
}

export async function deletePromoCode(id: string): Promise<void> {
  await proxyJson(`/superadmin/promos/${id}`, { method: "DELETE" });
}
