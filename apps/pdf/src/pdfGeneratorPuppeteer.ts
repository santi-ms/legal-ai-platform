/**
 * Generador de PDF usando Puppeteer (alternativa a PDFKit)
 * Más confiable para generar PDFs desde HTML
 */

import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatTextForHtml(text: string): string {
  // Limpiar markdown
  let cleanText = text.trim()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/__(.*?)__/g, "<strong>$1</strong>")
    .replace(/_(.*?)_/g, "<em>$1</em>")
    .trim();

  // Convertir saltos de línea a párrafos
  const lines = cleanText.split('\n').filter(line => line.trim().length > 0);
  const formatted = lines.map(line => {
    const escaped = escapeHtml(line.trim());
    return `<p>${escaped}</p>`;
  }).join('');

  return formatted || '<p>[Sin contenido]</p>';
}

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

  console.log(`[pdf-puppeteer] Generating PDF with fileName: ${fileName}`);
  console.log(`[pdf-puppeteer] Title: ${title}, Text length: ${rawText.length}`);

  // Limpiar y formatear texto
  const formattedText = formatTextForHtml(rawText);
  const titleText = escapeHtml(title || "DOCUMENTO");

  // HTML template
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Helvetica', 'Arial', sans-serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000000;
      margin: 0;
      padding: 0;
    }
    .title {
      font-size: 18pt;
      font-weight: bold;
      text-align: center;
      margin-bottom: 30px;
      color: #000000;
    }
    .content {
      text-align: left;
      color: #000000;
    }
    .content p {
      margin: 8px 0;
      color: #000000;
    }
    .signature {
      margin-top: 40px;
      color: #000000;
    }
    .signature-line {
      border-top: 1px solid #000;
      width: 200px;
      margin: 20px 0 5px 0;
    }
  </style>
</head>
<body>
  <div class="title">${titleText}</div>
  <div class="content">
    ${formattedText}
  </div>
  <div class="signature">
    <div class="signature-line"></div>
    <p>Firma / Aclaración / DNI</p>
  </div>
</body>
</html>
  `.trim();

  try {
    // Lanzar browser
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    
    // Establecer contenido HTML
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generar PDF
    await page.pdf({
      path: absolutePath,
      format: 'A4',
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      },
      printBackground: true
    });

    await browser.close();

    // Verificar que el archivo existe
    const stats = fs.statSync(absolutePath);
    if (stats.size === 0) {
      throw new Error("Generated PDF is empty");
    }

    console.log(`[pdf-puppeteer] PDF generated successfully: ${fileName} (${stats.size} bytes)`);

    return {
      filePath: absolutePath,
      fileName
    };
  } catch (error) {
    console.error(`[pdf-puppeteer] Error generating PDF:`, error);
    throw error;
  }
}

