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

    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 50, left: 50, right: 50, bottom: 50 }
    });

    // Manejar errores
    writeStream.on("error", (err) => {
      console.error(`[pdf] Write stream error:`, err);
      reject(err);
    });
    
    doc.on("error", (err) => {
      console.error(`[pdf] PDF document error:`, err);
      reject(err);
    });

    doc.pipe(writeStream);

    // título
    doc
      .font("Times-Bold")
      .fontSize(16)
      .text(title, { align: "center" });

    doc.moveDown(1);

    // cuerpo legal
    doc.font("Times-Roman").fontSize(11);
    
    // Escribir el contenido del texto (ya validado en la ruta)
    doc.text(rawText, {
      align: "justify"
    });

    doc.moveDown(4);

    // bloque de firma
    doc.fontSize(11).text("__________________________", { align: "left" });
    doc.text("Firma / Aclaración / DNI", { align: "left" });

    // Finalizar el documento
    doc.end();

    // Esperar a que el stream termine de escribir
    writeStream.on("finish", () => {
      console.log(`[pdf] PDF generation completed: ${fileName}`);
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
    });

    // Timeout de seguridad (30 segundos)
    setTimeout(() => {
      if (!writeStream.writableEnded) {
        console.error(`[pdf] ERROR: PDF generation timeout`);
        reject(new Error("PDF generation timeout"));
      }
    }, 30000);
  });
}
