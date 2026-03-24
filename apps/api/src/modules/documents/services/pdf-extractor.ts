import { createRequire } from "module";

// Lazy-load pdf-parse (CommonJS) solo cuando se necesita.
// Cargarlo a nivel de módulo causa que el servidor no arranque si hay problemas de compatibilidad.
let _pdfParse: ((buffer: Buffer) => Promise<{ text: string }>) | null = null;

function getPdfParse(): (buffer: Buffer) => Promise<{ text: string }> {
  if (_pdfParse) return _pdfParse;
  try {
    const require = createRequire(import.meta.url);
    _pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
    return _pdfParse;
  } catch (err) {
    throw new Error(`[pdf-extractor] No se pudo cargar pdf-parse: ${err}`);
  }
}

/**
 * Extrae el texto de un buffer de PDF.
 * Retorna el texto limpio o null si falla.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string | null> {
  try {
    const pdfParse = getPdfParse();
    const data = await pdfParse(buffer);
    const text = data.text
      .replace(/\r\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return text || null;
  } catch (err) {
    console.error("[pdf-extractor] Error extrayendo texto del PDF:", err);
    return null;
  }
}
