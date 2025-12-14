import { config } from "./config";
import { getSession } from "next-auth/react";
import { buildFrontendUrl, isServer } from "./url-utils";

export interface ApiResponse<T = any> {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
  error?: string;
}

/**
 * Helper para obtener el token de NextAuth (client-side)
 */
async function getAuthToken(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  
  try {
    const session = await getSession();
    // NextAuth no expone el token directamente, así que lo obtenemos desde la cookie
    // O usamos el sessionToken de NextAuth
    return session ? (session as any).token || null : null;
  } catch {
    return null;
  }
}

/**
 * Helper para hacer fetch al backend con manejo homogéneo de errores
 * Incluye autenticación automática si hay sesión
 */
export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit & { includeAuth?: boolean }
): Promise<ApiResponse<T>> {
  // Si el path empieza con /api/, es una ruta relativa (proxy interno)
  // No usar baseUrl para estas rutas
  let url: string;
  if (path.startsWith("/api/")) {
    url = path;
  } else {
    const baseUrl = config.apiUrl;

    if (!baseUrl) {
      throw new Error("NEXT_PUBLIC_API_URL is not defined");
    }

    // Normalizar path (remover / inicial si existe)
    const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
    
    // NO agregar /api porque el path ya viene completo
    url = `${baseUrl}/${normalizedPath}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> || {}),
  };

  // Agregar token de autenticación si está disponible (client-side)
  // Solo para rutas que no son proxies internos
  if (options?.includeAuth !== false && typeof window !== "undefined" && !path.startsWith("/api/")) {
    const token = await getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    console.log("[apiFetch] Making fetch request", { url, method: options?.method || "GET" });
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log("[apiFetch] Response received", { 
      url, 
      status: response.status, 
      statusText: response.statusText,
      contentType: response.headers.get("content-type")
    });

    const data: ApiResponse<T> = await response.json().catch((jsonError) => {
      console.error("[apiFetch] Error parsing JSON", { url, jsonError });
      return {
        ok: false,
        message: "Error al procesar respuesta del servidor",
      };
    });

    console.log("[apiFetch] Parsed data", { url, ok: data.ok, hasMessage: !!data.message });

    // Si la respuesta no es ok, devolver el error del servidor
    if (!response.ok) {
      console.warn("[apiFetch] Response not OK", { url, status: response.status, data });
      return {
        ok: false,
        message: data.message || `Error ${response.status}: ${response.statusText}`,
        fieldErrors: data.fieldErrors,
        error: data.error,
      };
    }

    return data;
  } catch (error) {
    // Error de red o conexión
    console.error("[apiFetch] Network or connection error", { url, error });
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Error de conexión con el servidor",
    };
  }
}

/**
 * Helper para POST requests
 */
export async function apiPost<T = any>(
  path: string,
  body: any
): Promise<ApiResponse<T>> {
  console.log("[apiPost] Making POST request", { path, hasBody: !!body });
  try {
    const response = await apiFetch<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
    });
    console.log("[apiPost] Response received", { path, ok: response.ok });
    return response;
  } catch (error) {
    console.error("[apiPost] Error in apiPost", { path, error });
    throw error;
  }
}

/**
 * Helper para GET requests
 */
export async function apiGet<T = any>(
  path: string,
  params?: Record<string, string>
): Promise<ApiResponse<T>> {
  let url = path;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams(params);
    url = `${path}?${searchParams.toString()}`;
  }
  
  return apiFetch<T>(url, {
    method: "GET",
  });
}

// ============================================
// Funciones de compatibilidad para código existente
// ============================================

/**
 * Obtener todos los documentos (compatibilidad)
 * Funciona tanto en Server Components como en Client Components
 */
export async function getDocuments() {
  try {
    // Usar URL absoluta en servidor, relativa en cliente
    const url = isServer()
      ? buildFrontendUrl("/api/_proxy/documents")
      : "/api/_proxy/documents";
    
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Respuesta no-JSON (status ${res.status}, ct="${ct}"). body="${text.slice(0, 200)}"`
      );
    }

    const data = await res.json();
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.message || data?.error || `HTTP error! status: ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

/**
 * Obtener un documento por ID (compatibilidad)
 * Usa el proxy server-side para autenticación automática
 */
export async function getDocument(id: string) {
  try {
    // Usar URL absoluta en servidor, relativa en cliente
    const url = isServer()
      ? buildFrontendUrl(`/api/_proxy/documents/${id}`)
      : `/api/_proxy/documents/${id}`;
    
    const res = await fetch(url, {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Respuesta no-JSON (status ${res.status}, ct="${ct}"). body="${text.slice(0, 200)}"`
      );
    }

    const data = await res.json();
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.message || data?.error || `HTTP error! status: ${res.status}`);
    }

    return data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}

/**
 * Generar un documento (compatibilidad)
 * Usa el proxy server-side para autenticación automática
 */
export async function generateDocument(formData: any) {
  try {
    // Usar el proxy server-side que maneja la autenticación automáticamente
    // Usar URL absoluta en servidor, relativa en cliente
    const proxyUrl = isServer()
      ? buildFrontendUrl("/api/_proxy/documents/generate")
      : "/api/_proxy/documents/generate";
    
    const response = await fetch(proxyUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(formData),
    });

    // Verificar que la respuesta sea JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("[generateDocument] Respuesta no es JSON:", text.substring(0, 200));
      throw new Error("El servidor devolvió una respuesta inválida");
    }

    const data = await response.json();
    
    if (!response.ok || !data.ok) {
      throw new Error(data.message || data.error || "Error al generar el documento");
    }

    return data;
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
}






