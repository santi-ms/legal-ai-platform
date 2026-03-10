/**
 * Utilidad de sanitización de inputs
 * Protege contra XSS y otros ataques de inyección
 */

import { FilterXSS } from "xss";

// Configuración para sanitización estricta (sin HTML)
const strictXssFilter = new FilterXSS({
  whiteList: {}, // No permite ningún tag
  stripIgnoreTag: true, // Remueve tags no permitidos
  stripIgnoreTagBody: ["script"], // Remueve contenido de scripts
});

// Configuración para sanitización con HTML limitado
const htmlXssFilter = new FilterXSS({
  whiteList: {
    b: [],
    i: [],
    em: [],
    strong: [],
    a: ["href", "title"],
    p: [],
    br: [],
    ul: [],
    ol: [],
    li: [],
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script"],
});

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
    return htmlXssFilter.process(input);
  }

  // No permite HTML, solo texto plano
  return strictXssFilter.process(input);
}

/**
 * Sanitiza un objeto recursivamente
 * @param obj - Objeto a sanitizar
 * @param allowHtml - Si es true, permite HTML seguro en strings
 * @returns Objeto sanitizado
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  allowHtml: boolean = false
): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = { ...obj };

  for (const key in sanitized) {
    if (typeof sanitized[key] === "string") {
      sanitized[key] = sanitizeInput(sanitized[key], allowHtml) as T[Extract<keyof T, string>];
    } else if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], allowHtml) as T[Extract<keyof T, string>];
    }
  }

  return sanitized;
}

/**
 * Sanitiza un array de strings
 * @param arr - Array a sanitizar
 * @param allowHtml - Si es true, permite HTML seguro
 * @returns Array sanitizado
 */
export function sanitizeArray(arr: string[], allowHtml: boolean = false): string[] {
  if (!Array.isArray(arr)) {
    return [];
  }

  return arr.map((item) => {
    if (typeof item === "string") {
      return sanitizeInput(item, allowHtml);
    }
    return String(item);
  });
}

