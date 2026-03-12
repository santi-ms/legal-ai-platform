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
  fileName?: string;
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
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const fileName = providedFileName || `${Date.now()}-${randomUUID()}.pdf`;
  const absolutePath = path.join(OUTPUT_DIR, fileName);
  
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

    const handleError = (err: Error) => {
      if (hasError) return;
      hasError = true;
      console.error(`[pdf] Error:`, err);
      writeStream.destroy();
      reject(err);
    };

    writeStream.on("error", handleError);
    doc.on("error", handleError);

    writeStream.on("open", () => {
      console.log(`[pdf] Write stream opened`);
    });

    doc.pipe(writeStream);

    try {
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
      
      console.log(`[pdf] Cleaned text length: ${cleanText.length}`);

      // Calcular dimensiones
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const marginLeft = doc.page.margins.left;
      const marginTop = doc.page.margins.top;
      const marginRight = doc.page.margins.right;
      const marginBottom = doc.page.margins.bottom;
      const textWidth = pageWidth - marginLeft - marginRight;

      console.log(`[pdf] Page: ${pageWidth}x${pageHeight}, Margins: L=${marginLeft} R=${marginRight} T=${marginTop} B=${marginBottom}`);
      console.log(`[pdf] Text width: ${textWidth}`);

      // POSICIÓN INICIAL
      let currentY = marginTop;

      // 1. TÍTULO - Escribir en posición fija
      const titleText = title || "DOCUMENTO";
      console.log(`[pdf] Writing title at Y=${currentY}: "${titleText}"`);
      
      doc
        .font("Helvetica-Bold")
        .fontSize(18)
        .fillColor("black")
        .moveTo(marginLeft, currentY)
        .text(titleText, {
          width: textWidth,
          align: "center"
        });

      currentY += 40; // Espacio después del título
      doc.y = currentY;

      // 2. TEXTO DE PRUEBA - Para verificar que funciona
      console.log(`[pdf] Writing test text at Y=${currentY}`);
      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("black")
        .moveTo(marginLeft, currentY)
        .text("=== TEXTO DE PRUEBA ===", {
          width: textWidth
        });

      currentY += 20;
      doc.y = currentY;

      // 3. TEXTO PRINCIPAL - Escribir línea por línea para mejor control
      console.log(`[pdf] Writing main text starting at Y=${currentY}`);
      const lines = cleanText.split('\n');
      console.log(`[pdf] Text has ${lines.length} lines`);

      doc
        .font("Helvetica")
        .fontSize(12)
        .fillColor("black");

      let lineY = currentY;
      const lineHeight = 15;
      const maxY = pageHeight - marginBottom - 50;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Si nos quedamos sin espacio, agregar nueva página
        if (lineY > maxY) {
          console.log(`[pdf] Adding new page at line ${i}`);
          doc.addPage();
          lineY = marginTop;
        }

        if (line.trim().length > 0) {
          // Escribir línea en posición fija
          doc.moveTo(marginLeft, lineY);
          doc.text(line, {
            width: textWidth
          });
          // Actualizar lineY basado en la nueva posición de doc.y
          lineY = doc.y;
        } else {
          lineY += lineHeight;
        }
        
        lineY += lineHeight;
      }

      doc.y = lineY;
      console.log(`[pdf] Main text written, final Y: ${lineY}`);

      // 4. BLOQUE DE FIRMA
      if (lineY > maxY) {
        doc.addPage();
        lineY = marginTop;
      }

      lineY += 20;
      console.log(`[pdf] Writing signature block at Y=${lineY}`);

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("black");
      
      doc.moveTo(marginLeft, lineY);
      doc.text("__________________________", {
        width: textWidth
      });

      lineY = doc.y + 5;
      doc.moveTo(marginLeft, lineY);
      doc.text("Firma / Aclaración / DNI", {
          width: textWidth
        });

      console.log(`[pdf] Signature block written, final Y: ${lineY}`);

      // Finalizar
      console.log(`[pdf] Ending PDF document...`);
      doc.end();
      
    } catch (err) {
      handleError(err instanceof Error ? err : new Error(String(err)));
      return;
    }

    // Esperar a que el stream termine
    writeStream.on("finish", () => {
      if (hasError) return;
      streamFinished = true;
      
      console.log(`[pdf] Write stream finished`);
      
      setTimeout(() => {
      try {
        const stats = fs.statSync(absolutePath);
        console.log(`[pdf] PDF file size: ${stats.size} bytes`);
          
        if (stats.size === 0) {
          console.error(`[pdf] ERROR: Generated PDF is empty!`);
          reject(new Error("Generated PDF file is empty"));
            return;
          }
          
          // Verificar header PDF
          const fileBuffer = fs.readFileSync(absolutePath, { encoding: null });
          const pdfHeader = fileBuffer.slice(0, 4).toString();
          if (pdfHeader !== "%PDF") {
            console.error(`[pdf] ERROR: File does not have PDF header! Got: ${pdfHeader}`);
            reject(new Error("Generated file is not a valid PDF"));
            return;
          }
          
          console.log(`[pdf] PDF header verified: ${pdfHeader}`);
          console.log(`[pdf] PDF generated successfully: ${fileName}`);
          
          resolve({
            filePath: absolutePath,
            fileName
          });
      } catch (err) {
        console.error(`[pdf] Error checking file stats:`, err);
        reject(err instanceof Error ? err : new Error(String(err)));
      }
      }, 200);
    });

    // Timeout
    setTimeout(() => {
      if (!hasError && !streamFinished) {
        console.error(`[pdf] ERROR: PDF generation timeout`);
        hasError = true;
        writeStream.destroy();
        reject(new Error("PDF generation timeout"));
      }
    }, 30000);
  });
}
