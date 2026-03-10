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
  console.log(`[pdf-puppeteer] Raw text preview (first 300 chars): ${rawText.substring(0, 300)}`);

  // Limpiar y formatear texto
  const formattedText = formatTextForHtml(rawText);
  const titleText = escapeHtml(title || "DOCUMENTO");
  
  console.log(`[pdf-puppeteer] Formatted text length: ${formattedText.length}`);
  console.log(`[pdf-puppeteer] Formatted text preview (first 500 chars): ${formattedText.substring(0, 500)}`);

  // HTML template - EXTREMADAMENTE SIMPLE para debugging
  // Primero, crear un HTML de prueba MUY básico
  const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: Arial; 
      font-size: 16px; 
      color: #000000; 
      background: #FFFFFF;
      padding: 50px;
    }
    .test { 
      background: #FFFF00; 
      color: #000000; 
      padding: 20px; 
      border: 5px solid #FF0000; 
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0;
    }
    h1 { 
      color: #000000; 
      font-size: 24px; 
      margin: 20px 0;
    }
    p { 
      color: #000000; 
      font-size: 14px; 
      margin: 10px 0;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="test">PRUEBA: Este texto debe ser visible en amarillo con borde rojo</div>
  <h1>${titleText}</h1>
  <p style="color: #000000; font-weight: bold;">Este es un párrafo de prueba en negro</p>
  <div style="color: #000000;">
    ${formattedText}
  </div>
  <p style="color: #000000; margin-top: 40px;">__________________________</p>
  <p style="color: #000000;">Firma / Aclaración / DNI</p>
</body>
</html>
  `.trim();
  
  console.log(`[pdf-puppeteer] HTML length: ${testHtml.length}`);
  console.log(`[pdf-puppeteer] HTML preview (first 1000 chars): ${testHtml.substring(0, 1000)}`);
  
  const html = testHtml;

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
    
    console.log(`[pdf-puppeteer] Browser page created`);
    
    // Establecer viewport para asegurar renderizado correcto
    await page.setViewport({ width: 1200, height: 1600 });
    console.log(`[pdf-puppeteer] Viewport set`);
    
    // Establecer contenido HTML
    console.log(`[pdf-puppeteer] Setting HTML content...`);
    await page.setContent(html, { 
      waitUntil: 'load',
      timeout: 30000
    });
    console.log(`[pdf-puppeteer] HTML content set`);

    // Esperar un momento para que se renderice completamente
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`[pdf-puppeteer] Waited for render`);

    // Generar PDF con opciones mejoradas
    console.log(`[pdf-puppeteer] Generating PDF...`);
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
    console.log(`[pdf-puppeteer] PDF file written to: ${absolutePath}`);

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

