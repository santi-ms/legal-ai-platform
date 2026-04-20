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
  const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB
  if (buffer.length > MAX_PDF_SIZE) {
    throw new Error(`PDF too large: ${(buffer.length / 1024 / 1024).toFixed(1)}MB. Maximum allowed: 50MB`);
  }

  try {
    const pdfParse = getPdfParse();
    const extractWithTimeout = Promise.race([
      pdfParse(buffer),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('PDF extraction timeout')), 30000)
      ),
    ]);
    const data = await extractWithTimeout;
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
