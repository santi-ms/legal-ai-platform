/**
 * Helper para construir URLs absolutas del frontend
 * Necesario cuando se ejecuta código en el servidor (RSC, Server Components, etc.)
 * porque Node.js no puede resolver URLs relativas sin una base URL
 */

/**
 * Obtiene la URL base del frontend
 * Prioridad: NEXTAUTH_URL > VERCEL_URL > localhost (dev)
 */
function getFrontendBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }
  
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Desarrollo local
  return "http://localhost:3000";
}

/**
 * Construye una URL absoluta para el frontend
 * @param path - Ruta relativa (ej: "/api/_proxy/documents")
 * @param searchParams - Parámetros de búsqueda opcionales
 * @returns URL absoluta completa
 */
export function buildFrontendUrl(
  path: string,
  searchParams?: URLSearchParams | Record<string, string | number | undefined>
): string {
  const baseUrl = getFrontendBaseUrl();
  
  // Asegurar que el path empiece con /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  
  // Construir URL
  const url = new URL(normalizedPath, baseUrl);
  
  // Agregar parámetros de búsqueda si se proporcionan
  if (searchParams) {
    if (searchParams instanceof URLSearchParams) {
      searchParams.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
    } else {
      // Es un objeto Record
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }
  }
  
  return url.toString();
}

/**
 * Verifica si el código se está ejecutando en el servidor
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}

