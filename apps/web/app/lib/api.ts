import { config } from "./config";
import { getSession } from "next-auth/react";

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
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json().catch(() => ({
      ok: false,
      message: "Error al procesar respuesta del servidor",
    }));

    // Si la respuesta no es ok, devolver el error del servidor
    if (!response.ok) {
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
    console.error("Error en apiFetch:", error);
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
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
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
 */
export async function getDocuments() {
  try {
    // Usar el proxy server-side que maneja la autenticación automáticamente
    const response = await fetch(`/api/_proxy/documents`, { 
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching documents:', error);
    throw error;
  }
}

/**
 * Obtener un documento por ID (compatibilidad)
 */
export async function getDocument(id: string) {
  try {
    const response = await fetch(`${config.apiUrl}/documents/${id}`, { 
      cache: "no-store",
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching document:', error);
    throw error;
  }
}

/**
 * Generar un documento (compatibilidad)
 */
export async function generateDocument(formData: any) {
  try {
    const response = await fetch(`${config.apiUrl}/documents/generate`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(data.error || "Error al generar el documento");
    }

    return data;
  } catch (error) {
    console.error('Error generating document:', error);
    throw error;
  }
}






