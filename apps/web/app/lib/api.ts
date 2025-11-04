import { config } from "./config";

export interface ApiResponse<T = any> {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
  data?: T;
  error?: string;
}

/**
 * Helper para hacer fetch al backend con manejo homogéneo de errores
 */
export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const baseUrl = config.apiUrl;

  if (!baseUrl) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined");
  }

  // Normalizar path (remover / inicial si existe, agregar /api si no está)
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const fullPath = normalizedPath.startsWith("api/") 
    ? normalizedPath 
    : `api/${normalizedPath}`;
  
  const url = `${baseUrl}/${fullPath}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
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
    const response = await fetch(`${config.apiUrl}/documents`, { 
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






