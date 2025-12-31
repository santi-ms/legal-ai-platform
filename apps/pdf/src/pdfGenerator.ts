import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

// ESM safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta donde vamos a guardar los PDFs generados
const OUTPUT_DIR = process.env.PDF_OUTPUT_DIR || path.resolve(__dirname, "../generated");

export type GeneratePdfInput = {
  title: string;
  rawText: string;
  fileName?: string; // opcional: si viene, usarlo; si no, generar uno único
};

export type GeneratePdfResult = {
  filePath: string;
  fileName: string;
};

export async function generatePdfFromContract({
  title,
  rawText,
  fileName: providedFileName
}: GeneratePdfInput): Promise<GeneratePdfResult> {
  // asegurar carpeta
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // usar fileName proporcionado o generar uno único
  const fileName = providedFileName || `${Date.now()}-${randomUUID()}.pdf`;
  const absolutePath = path.join(OUTPUT_DIR, fileName);
  
  // Logging (se puede mejorar para usar logger inyectado)
  console.log(`[pdf] Generating PDF with fileName: ${fileName}`);
  console.log(`[pdf] Output path: ${absolutePath}`);
  console.log(`[pdf] Title length: ${title.length}, Text length: ${rawText.length}`);

  return new Promise<GeneratePdfResult>((resolve, reject) => {
    const writeStream = fs.createWriteStream(absolutePath);
    let hasError = false;

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, left: 50, right: 50, bottom: 50 }
    });

    // Manejar errores
    const handleError = (err: Error) => {
      if (hasError) return;
      hasError = true;
      console.error(`[pdf] Error:`, err);
      writeStream.destroy();
      reject(err);
    };

    writeStream.on("error", handleError);
    doc.on("error", handleError);

    doc.pipe(writeStream);

    try {
      // Título
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("black")
        .text(title || "DOCUMENTO", {
          align: "center",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });

      doc.moveDown(2);

      // Limpiar texto - remover markdown
      let cleanText = rawText.trim()
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/_(.*?)_/g, "$1")
        .trim();
      
      if (!cleanText || cleanText.length === 0) {
        cleanText = "[Sin contenido]";
      }
      
      // Escribir texto principal - método directo y simple
      const textWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
      
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("black")
        .text(cleanText, {
          align: "left",
          width: textWidth,
          lineGap: 3
        });

      doc.moveDown(3);

      // Bloque de firma
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("black")
        .text("__________________________", {
          align: "left",
          width: textWidth
        });
      doc.moveDown(0.5);
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("black")
        .text("Firma / Aclaración / DNI", {
          align: "left",
          width: textWidth
        });

      // Finalizar el documento
      doc.end();
      
      console.log(`[pdf] PDF document ended, waiting for stream to finish...`);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    // Esperar a que el stream termine de escribir
    writeStream.on("finish", () => {
      if (hasError) return;
      
      console.log(`[pdf] PDF generation completed: ${fileName}`);
      try {
        // Verificar que el archivo existe y tiene contenido
        const stats = fs.statSync(absolutePath);
        console.log(`[pdf] PDF file size: ${stats.size} bytes`);
        if (stats.size === 0) {
          console.error(`[pdf] ERROR: Generated PDF is empty!`);
          reject(new Error("Generated PDF file is empty"));
        } else {
          resolve({
            filePath: absolutePath,
            fileName
          });
        }
      } catch (err) {
        console.error(`[pdf] Error checking file stats:`, err);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    });

    // Timeout de seguridad (30 segundos)
    setTimeout(() => {
      if (!hasError && !writeStream.writableEnded) {
        console.error(`[pdf] ERROR: PDF generation timeout`);
        hasError = true;
        writeStream.destroy();
        reject(new Error("PDF generation timeout"));
      }
    }, 30000);
  });
}
