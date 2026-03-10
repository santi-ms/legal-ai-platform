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
    let streamFinished = false;

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

    // Verificar que el stream esté listo antes de escribir
    writeStream.on("open", () => {
      console.log(`[pdf] Write stream opened, starting PDF generation...`);
    });

    doc.pipe(writeStream);

    try {
      console.log(`[pdf] Starting to write PDF content...`);
      console.log(`[pdf] rawText preview (first 200 chars): ${rawText.substring(0, 200)}`);
      
      // Asegurar que el color sea negro explícitamente
      doc.fillColor("black");
      doc.strokeColor("black");
      
      // Título - usar fuente estándar que soporte mejor caracteres especiales
      const titleText = title || "DOCUMENTO";
      console.log(`[pdf] Writing title: "${titleText}"`);
      
      // Escribir título usando el método estándar de PDFKit
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("black")
        .text(titleText, {
          align: "center",
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right
        });

      doc.moveDown(2);
      console.log(`[pdf] Title written, current Y position: ${doc.y}`);

      // Calcular ancho del texto antes de usarlo
      const textWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

      // Escribir texto de prueba para verificar que el PDF funciona
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("black")
        .text("TEXTO DE PRUEBA: Si ves esto, el PDF está funcionando correctamente.", {
          align: "left",
          width: textWidth
        });
      doc.moveDown(1);

      // Limpiar texto - remover markdown
      let cleanText = rawText.trim()
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/__(.*?)__/g, "$1")
        .replace(/_(.*?)_/g, "$1")
        .trim();
      
      console.log(`[pdf] Cleaned text length: ${cleanText.length}`);
      console.log(`[pdf] Cleaned text preview: ${cleanText.substring(0, 100)}...`);
      
      if (!cleanText || cleanText.length === 0) {
        console.warn(`[pdf] WARNING: Cleaned text is empty, using placeholder`);
        cleanText = "[Sin contenido]";
      }
      const pageHeight = doc.page.height;
      const currentY = doc.y;
      
      console.log(`[pdf] Page dimensions: width=${doc.page.width}, height=${pageHeight}`);
      console.log(`[pdf] Current position: x=${doc.x}, y=${currentY}`);
      console.log(`[pdf] Text width: ${textWidth}`);
      console.log(`[pdf] Writing main text (${cleanText.length} chars)...`);
      
      // Asegurar que estamos en una posición válida
      if (currentY > pageHeight - 100) {
        console.warn(`[pdf] WARNING: Current Y position (${currentY}) is too close to bottom, adding new page`);
        doc.addPage();
      }
      
      // Escribir texto principal - método simple y directo
      console.log(`[pdf] Writing main text (${cleanText.length} chars)...`);
      console.log(`[pdf] First 500 chars of cleanText: ${cleanText.substring(0, 500)}`);
      
      // Asegurar que el color sea negro explícitamente
      doc.fillColor("black");
      doc.strokeColor("black");
      
      // Usar fuente estándar que definitivamente existe
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("black");
      
      // Verificar que el texto no esté vacío antes de escribir
      if (cleanText && cleanText.length > 0) {
        // Escribir el texto completo usando el método estándar de PDFKit
        try {
          const startY = doc.y;
          
          // Asegurar que el color y fuente estén configurados
          doc
            .font("Helvetica")
            .fontSize(12)
            .fillColor("black");
          
          // Escribir el texto
          doc.text(cleanText, {
            align: "left",
            width: textWidth,
            lineGap: 3,
            paragraphGap: 5
          });
          
          const endY = doc.y;
          console.log(`[pdf] Text written successfully, Y position: ${startY} -> ${endY}`);
          
          // Verificar que el cursor se movió (indica que el texto se escribió)
          if (Math.abs(endY - startY) < 1) {
            console.warn(`[pdf] WARNING: Y position did not change after writing text!`);
            console.warn(`[pdf] Attempting to write test text...`);
            // Intentar escribir texto de prueba
            doc.text("TEST: Este texto debería ser visible", {
              width: textWidth
            });
          }
        } catch (textError) {
          console.error(`[pdf] ERROR writing text:`, textError);
          // Intentar escribir texto de prueba
          doc.text("[ERROR al escribir texto]", {
            width: textWidth
          });
        }
      } else {
        console.error(`[pdf] ERROR: cleanText is empty or invalid!`);
        doc.text("[ERROR: Texto vacío]", {
          width: textWidth
        });
      }
      
      const afterTextY = doc.y;
      console.log(`[pdf] Main text written, Y position after: ${afterTextY}`);

      doc.moveDown(3);

      // Bloque de firma
      doc.moveDown(3);
      console.log(`[pdf] Writing signature block at Y: ${doc.y}`);
      
      // Asegurar color negro explícitamente
      doc.fillColor("black");
      doc.strokeColor("black");
      
      doc
        .font("Helvetica")
        .fontSize(11)
        .text("__________________________", {
          align: "left",
          width: textWidth,
          continued: false
        });
      doc.moveDown(0.5);
      doc
        .font("Helvetica")
        .fontSize(11)
        .text("Firma / Aclaración / DNI", {
          align: "left",
          width: textWidth,
          continued: false
        });
      console.log(`[pdf] Signature block written, final Y: ${doc.y}`);

      // Finalizar el documento
      console.log(`[pdf] Ending PDF document...`);
      doc.end();
      
      console.log(`[pdf] PDF document ended, waiting for stream to finish...`);
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    // Esperar a que el stream termine de escribir
    writeStream.on("finish", () => {
      if (hasError) return;
      streamFinished = true;
      
      console.log(`[pdf] Write stream finished`);
      console.log(`[pdf] PDF generation completed: ${fileName}`);
      
      // Dar un pequeño delay para asegurar que el archivo esté completamente escrito
      setTimeout(() => {
        try {
          // Verificar que el archivo existe y tiene contenido
          const stats = fs.statSync(absolutePath);
          console.log(`[pdf] PDF file size: ${stats.size} bytes`);
          
          if (stats.size === 0) {
            console.error(`[pdf] ERROR: Generated PDF is empty!`);
            reject(new Error("Generated PDF file is empty"));
          } else if (stats.size < 1000) {
            // PDFs válidos deberían tener al menos algunos KB
            console.warn(`[pdf] WARNING: PDF file is very small (${stats.size} bytes), might be corrupted`);
          }
          
          // Verificar que el archivo es realmente un PDF leyendo los primeros bytes
          const fileBuffer = fs.readFileSync(absolutePath, { encoding: null });
          const pdfHeader = fileBuffer.slice(0, 4).toString();
          if (pdfHeader !== "%PDF") {
            console.error(`[pdf] ERROR: File does not have PDF header! Got: ${pdfHeader}`);
            reject(new Error("Generated file is not a valid PDF"));
          } else {
            console.log(`[pdf] PDF header verified: ${pdfHeader}`);
            resolve({
              filePath: absolutePath,
              fileName
            });
          }
        } catch (err) {
          console.error(`[pdf] Error checking file stats:`, err);
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      }, 100); // 100ms delay para asegurar escritura completa
    });

    // Timeout de seguridad (30 segundos)
    setTimeout(() => {
      if (!hasError && !streamFinished) {
        console.error(`[pdf] ERROR: PDF generation timeout (stream not finished)`);
        console.error(`[pdf] Stream state: writableEnded=${writeStream.writableEnded}, destroyed=${writeStream.destroyed}`);
        hasError = true;
        writeStream.destroy();
        reject(new Error("PDF generation timeout"));
      }
    }, 30000);
  });
}
