/**
 * Utilidad de sanitización de inputs para el frontend
 * Protege contra XSS y otros ataques de inyección
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitiza un string removiendo HTML y scripts maliciosos
 * @param input - String a sanitizar
 * @param allowHtml - Si es true, permite HTML seguro (por defecto false)
 * @returns String sanitizado
 */
export function sanitizeInput(input: string, allowHtml: boolean = false): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  if (allowHtml) {
    // Permite HTML seguro pero sanitiza scripts y atributos peligrosos
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li"],
      ALLOWED_ATTR: ["href", "title"],
      ALLOW_DATA_ATTR: false,
    });
  }

  // No permite HTML, solo texto plano
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitiza HTML para renderizar de forma segura
 * @param html - HTML a sanitizar
 * @returns HTML sanitizado seguro para renderizar
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "a", "p", "br", "ul", "ol", "li", "h1", "h2", "h3", "h4", "h5", "h6"],
    ALLOWED_ATTR: ["href", "title", "target"],
    ALLOW_DATA_ATTR: false,
  });
}

