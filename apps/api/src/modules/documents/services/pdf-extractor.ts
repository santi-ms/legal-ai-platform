// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;

/**
 * Extrae el texto de un buffer de PDF.
 * Retorna el texto limpio o null si falla.
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<string | null> {
  try {
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
