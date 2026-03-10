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
    .replace(/\*\*(.*?)\*\*/g, "$1") // Remover markdown bold
    .replace(/\*(.*?)\*/g, "$1") // Remover markdown italic
    .replace(/__(.*?)__/g, "$1") // Remover markdown bold
    .replace(/_(.*?)_/g, "$1") // Remover markdown italic
    .trim();

  if (!cleanText || cleanText.length === 0) {
    return '<p style="color: #000000;">[Sin contenido]</p>';
  }

  // Convertir saltos de línea a párrafos - método más simple
  const lines = cleanText.split('\n');
  const formatted = lines.map(line => {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      return '<br>';
    }
    // Escapar HTML pero mantener el texto visible
    const escaped = escapeHtml(trimmed);
    return `<p style="color: #000000; margin: 8px 0;">${escaped}</p>`;
  }).join('');

  return formatted;
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

  // HTML template - MUY SIMPLE para debugging
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 14px;
      color: black;
      background: white;
      padding: 40px;
      margin: 0;
    }
    h1 {
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      color: black;
      margin-bottom: 30px;
      border-bottom: 2px solid black;
      padding-bottom: 10px;
    }
    .test {
      background: yellow;
      padding: 10px;
      margin: 20px 0;
      border: 2px solid red;
      color: black;
      font-weight: bold;
    }
    .content {
      color: black;
      line-height: 1.6;
    }
    .content p {
      color: black;
      margin: 10px 0;
    }
    .signature {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid black;
    }
  </style>
</head>
<body>
  <div class="test">TEXTO DE PRUEBA: Si ves esto, el PDF funciona correctamente</div>
  <h1>${titleText}</h1>
  <div class="content">
    ${formattedText}
  </div>
  <div class="signature">
    <p style="color: black;">__________________________</p>
    <p style="color: black;">Firma / Aclaración / DNI</p>
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
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();
    
    // Establecer viewport para asegurar renderizado correcto
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Establecer contenido HTML
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Esperar un momento para que se renderice completamente
    await new Promise(resolve => setTimeout(resolve, 500));

    // Generar PDF con opciones mejoradas
    await page.pdf({
      path: absolutePath,
      format: 'A4',
      margin: {
        top: '2cm',
        right: '2cm',
        bottom: '2cm',
        left: '2cm'
      },
      printBackground: true,
      preferCSSPageSize: false
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

