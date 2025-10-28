import PDFDocument from "pdfkit";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

// ESM safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carpeta donde vamos a guardar los PDFs generados
const OUTPUT_DIR = path.resolve(__dirname, "../generated");

export type GeneratePdfInput = {
  title: string;
  rawText: string;
};

export type GeneratePdfResult = {
  filePath: string;
  fileName: string;
};

export async function generatePdfFromContract({
  title,
  rawText
}: GeneratePdfInput): Promise<GeneratePdfResult> {
  // asegurar carpeta
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // nombre único
  const fileName = `${Date.now()}-${randomUUID()}.pdf`;
  const absolutePath = path.join(OUTPUT_DIR, fileName);

  const writeStream = fs.createWriteStream(absolutePath);

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 50, left: 50, right: 50, bottom: 50 }
  });

  const errPromise = new Promise<never>((_, reject) => {
    writeStream.on("error", reject);
    doc.on("error", reject);
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
  doc.text(rawText, {
    align: "justify"
  });

  doc.moveDown(4);

  // bloque de firma
  doc.fontSize(11).text("__________________________", { align: "left" });
  doc.text("Firma / Aclaración / DNI", { align: "left" });

  doc.end();

  const finishPromise = new Promise<void>((resolve) => {
    writeStream.on("finish", () => resolve());
  });

  await Promise.race([finishPromise, errPromise]);

  return {
    filePath: absolutePath,
    fileName
  };
}
