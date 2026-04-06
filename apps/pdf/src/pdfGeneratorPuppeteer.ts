/**
 * Generador de PDF profesional usando Puppeteer
 *
 * Produce documentos legales con formato tipográfico de calidad:
 * - Fuente Times New Roman (estándar jurídico)
 * - Detección automática de estructura: títulos, cláusulas, sub-incisos, firmas
 * - Márgenes, interlineado y sangría conforme a documentos legales argentinos
 * - Número de página en pie de página
 */

import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_DIR =
  process.env.PDF_OUTPUT_DIR || path.resolve(__dirname, "../generated");

export type GeneratePdfInput = {
  title: string;
  rawText: string;
  fileName?: string;
};

export type GeneratePdfResult = {
  filePath: string;
  fileName: string;
};

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ---------------------------------------------------------------------------
// Markdown cleanup
// ---------------------------------------------------------------------------

function stripMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Strip any HTML tags the AI might emit (e.g. <div align="center">...</div>)
    // keeping only the inner text
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\*\*(.*?)\*\*/gs, "$1")
    .replace(/__(.*?)__/gs, "$1")
    .replace(/\*(.*?)\*/gs, "$1")
    .replace(/_(.*?)_/gs, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    // Normalize separator lines: ensure --- lines have blank lines around them
    .replace(/\n([-─—]{3,})\n/g, "\n\n$1\n\n")
    .trim();
}

// ---------------------------------------------------------------------------
// Document structure parser
// Detects semantic blocks in Argentine legal document plain text and converts
// them to styled HTML elements.
// ---------------------------------------------------------------------------

type LineType =
  | "title"           // Título principal del documento (ej: CONTRATO DE LOCACIÓN)
  | "location_date"   // Línea de ciudad/fecha al inicio (ej: Buenos Aires, 22 de marzo…)
  | "clause_header"   // Encabezado de cláusula (ej: PRIMERA. - …  /  CLÁUSULA PRIMERA:)
  | "subclause"       // Sub-inciso (ej: a) …  /  i) …  /  1. …)
  | "section_title"   // Subtítulo de sección en mayúsculas (ej: PARTES, OBJETO)
  | "signature_line"  // Línea de firma (_____)
  | "signature_label" // Etiqueta bajo firma (Firma / Aclaración / DNI)
  | "separator"       // Línea separadora de párrafos (--- / ----------)
  | "empty"           // Línea vacía
  | "body";           // Párrafo normal

// Ordinal words for clause detection (Spanish)
const ORDINAL_WORDS = new Set([
  "PRIMERA", "SEGUNDA", "TERCERA", "CUARTA", "QUINTA",
  "SEXTA", "SÉPTIMA", "OCTAVA", "NOVENA", "DÉCIMA",
  "UNDÉCIMA", "DUODÉCIMA", "DECIMOTERCERA", "DECIMOCUARTA",
  "DECIMOQUINTA", "DECIMOSEXTA",
  // numbers
  "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI",
]);

function classifyLine(
  line: string,
  index: number,
  allLines: string[]
): LineType {
  const trimmed = line.trim();

  if (trimmed.length === 0) return "empty";

  // Separator line: 3+ dashes/em-dashes (e.g. "---", "----------")
  if (/^[-─—]{3,}$/.test(trimmed)) return "separator";

  // Signature underscores (1+ underscores, or lone dash used as placeholder line)
  if (/^_+$/.test(trimmed) || /^_{4,}/.test(trimmed)) return "signature_line";

  // Signature labels (short lines near signature lines)
  const prevNonEmpty = allLines
    .slice(0, index)
    .reverse()
    .find((l) => l.trim().length > 0);
  if (
    prevNonEmpty &&
    /^_{4,}/.test(prevNonEmpty.trim()) &&
    trimmed.length <= 80
  ) {
    return "signature_label";
  }

  // City/date line at the beginning of the document (first ~5 non-empty lines)
  // Must be checked BEFORE the generic title rule so "Buenos Aires, 5 de abril…"
  // at position 0 is not mistakenly promoted to a bold h1 title.
  const nonEmptyBefore = allLines
    .slice(0, index)
    .filter((l) => l.trim().length > 0).length;
  if (
    nonEmptyBefore <= 4 &&
    /^\w[\w\s,]+,\s+\d{1,2}\s+de\s+\w+/i.test(trimmed)
  ) {
    return "location_date";
  }

  // Main document title: first non-empty line OR all-caps short line near top
  if (nonEmptyBefore === 0) return "title";
  if (
    nonEmptyBefore <= 3 &&
    trimmed === trimmed.toUpperCase() &&
    trimmed.length >= 5 &&
    trimmed.length <= 80 &&
    !/^\d/.test(trimmed) &&
    !/^[a-z]/.test(trimmed)
  ) {
    return "title";
  }

  // Clause header: PRIMERA. / PRIMERA - / CLÁUSULA PRIMERA / PRIMERA: texto
  const clauseMatch = trimmed.match(
    /^(CLÁUSULA\s+)?([A-ZÁÉÍÓÚÑ]+)[\.\-:\s]/
  );
  if (clauseMatch) {
    const word = clauseMatch[2];
    if (ORDINAL_WORDS.has(word)) return "clause_header";
  }
  // Roman numeral clause: "IV. Descripción"
  if (/^(I{1,3}|IV|V?I{0,3}|IX|X{0,3}I{0,3})\.\s+\S/.test(trimmed)) {
    return "clause_header";
  }

  // Sub-inciso: a) / b) / i) / ii) / 1) / 1.1
  if (/^([a-z]{1,3}|[ivxlcdm]+|\d+(\.\d+)?)\)\s+\S/i.test(trimmed)) {
    return "subclause";
  }
  if (/^\d+\.\d+\s+\S/.test(trimmed)) return "subclause";

  // Section title: all-caps line, short, no punctuation at end (except colon)
  if (
    trimmed === trimmed.toUpperCase() &&
    trimmed.length >= 4 &&
    trimmed.length <= 60 &&
    /^[A-ZÁÉÍÓÚÑ\s\/\-]+:?$/.test(trimmed) &&
    !/^\d/.test(trimmed)
  ) {
    return "section_title";
  }

  return "body";
}

function buildHtmlBody(rawText: string): string {
  const cleaned = stripMarkdown(rawText);
  const lines = cleaned.split("\n");
  const html: string[] = [];

  let inSignatureBlock = false;
  let signatureGroupOpen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const type = classifyLine(line, i, lines);

    // Manage signature grouping
    if (type === "signature_line" || type === "signature_label") {
      if (!signatureGroupOpen) {
        html.push('<div class="signature-block">');
        signatureGroupOpen = true;
      }
      inSignatureBlock = true;
    } else if (inSignatureBlock && type !== "empty") {
      if (signatureGroupOpen) {
        html.push("</div>");
        signatureGroupOpen = false;
      }
      inSignatureBlock = false;
    }

    switch (type) {
      case "empty":
        if (!inSignatureBlock) html.push('<div class="spacer"></div>');
        break;

      case "title":
        html.push(`<h1 class="doc-title">${escapeHtml(trimmed)}</h1>`);
        break;

      case "location_date":
        html.push(
          `<p class="location-date">${escapeHtml(trimmed)}</p>`
        );
        break;

      case "clause_header":
        html.push(
          `<p class="clause-header">${escapeHtml(trimmed)}</p>`
        );
        break;

      case "section_title":
        html.push(
          `<p class="section-title">${escapeHtml(trimmed)}</p>`
        );
        break;

      case "subclause":
        html.push(
          `<p class="subclause">${escapeHtml(trimmed)}</p>`
        );
        break;

      case "separator":
        // Treat separator lines (---) as blank space — legal docs don't use visible dividers
        html.push('<div class="spacer"></div>');
        break;

      case "signature_line":
        html.push(`<p class="sig-line">${escapeHtml(trimmed)}</p>`);
        break;

      case "signature_label":
        html.push(
          `<p class="sig-label">${escapeHtml(trimmed)}</p>`
        );
        break;

      case "body":
      default:
        html.push(`<p class="body-text">${escapeHtml(trimmed)}</p>`);
        break;
    }
  }

  if (signatureGroupOpen) html.push("</div>");

  return html.join("\n");
}

// ---------------------------------------------------------------------------
// Full HTML document
// ---------------------------------------------------------------------------

function buildFullHtml(title: string, bodyHtml: string): string {
  const escapedTitle = escapeHtml(title || "DOCUMENTO LEGAL");

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <style>
    /* ── Reset ──────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Page setup ─────────────────────────────────────── */
    @page {
      size: A4 portrait;
      margin: 2.5cm 2cm 2.5cm 3cm;
    }

    /* ── Base typography ────────────────────────────────── */
    body {
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 12pt;
      line-height: 1.6;
      color: #000000;
      background: #ffffff;
      text-align: justify;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Document wrapper ───────────────────────────────── */
    .doc-wrapper {
      width: 100%;
      max-width: 100%;
    }

    /* ── Title ──────────────────────────────────────────── */
    .doc-title {
      font-family: "Times New Roman", Times, serif;
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #000000;
      margin-top: 0;
      margin-bottom: 20pt;
      padding-bottom: 8pt;
      border-bottom: 1pt solid #000000;
    }

    /* ── Location / date ────────────────────────────────── */
    .location-date {
      font-size: 11pt;
      text-align: right;
      margin-bottom: 14pt;
      color: #000000;
    }

    /* ── Section title (PARTES, OBJETO, etc.) ───────────── */
    .section-title {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      text-align: center;
      margin-top: 16pt;
      margin-bottom: 6pt;
      color: #000000;
    }

    /* ── Clause header (PRIMERA., SEGUNDA., etc.) ────────── */
    .clause-header {
      font-size: 12pt;
      font-weight: bold;
      text-align: justify;
      margin-top: 0;
      margin-bottom: 0;
      color: #000000;
      text-indent: 0;
    }

    /* ── Body paragraph ─────────────────────────────────── */
    .body-text {
      font-size: 12pt;
      text-align: justify;
      text-indent: 0;
      margin-top: 0;
      margin-bottom: 0;
      color: #000000;
    }

    /* ── Sub-inciso (a), b), i), etc.) ─────────────────── */
    .subclause {
      font-size: 12pt;
      text-align: justify;
      margin-left: 0;
      margin-top: 0;
      margin-bottom: 0;
      color: #000000;
    }

    /* ── Spacer (blank lines and separators ---) ────────── */
    .spacer {
      height: 6pt;
    }

    /* ── Signature block ────────────────────────────────── */
    .signature-block {
      display: flex;
      flex-direction: column;
      margin-top: 28pt;
      page-break-inside: avoid;
    }

    .sig-line {
      font-size: 12pt;
      color: #000000;
      margin-bottom: 4pt;
      letter-spacing: 0.1em;
    }

    .sig-label {
      font-size: 10pt;
      color: #000000;
      margin-bottom: 16pt;
    }

    /* ── Page numbers ───────────────────────────────────── */
    @page {
      @bottom-center {
        content: counter(page) " / " counter(pages);
        font-family: "Times New Roman", Times, serif;
        font-size: 9pt;
        color: #555555;
      }
    }

    /* ── Page break helpers ─────────────────────────────── */
    .clause-header {
      page-break-after: avoid;
    }
    .signature-block {
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="doc-wrapper">
    ${bodyHtml}
  </div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generatePdfFromContract({
  title,
  rawText,
  fileName: providedFileName,
}: GeneratePdfInput): Promise<GeneratePdfResult> {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const fileName =
    providedFileName || `${Date.now()}-${randomUUID()}.pdf`;
  const absolutePath = path.join(OUTPUT_DIR, fileName);

  const bodyHtml = buildHtmlBody(rawText);
  const fullHtml = buildFullHtml(title, bodyHtml);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754 }); // A4 at 150dpi

    await page.setContent(fullHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "2.5cm",
        right: "2cm",
        bottom: "2.5cm",
        left: "3cm",
      },
      printBackground: true,
      preferCSSPageSize: false,
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;font-family:'Times New Roman',serif;font-size:8pt;color:#888;text-align:right;padding-right:2cm;padding-top:0.5cm;">${escapeHtml(title || "")}</div>`,
      footerTemplate: `<div style="width:100%;font-family:'Times New Roman',serif;font-size:9pt;color:#555;text-align:center;padding-bottom:0.5cm;">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>`,
    });

    fs.writeFileSync(absolutePath, pdfBuffer);

    const stats = fs.statSync(absolutePath);
    if (stats.size === 0) throw new Error("Generated PDF is empty");

    const header = fs.readFileSync(absolutePath).slice(0, 4).toString();
    if (header !== "%PDF") throw new Error(`Invalid PDF header: ${header}`);

    return { filePath: absolutePath, fileName };
  } finally {
    await browser.close();
  }
}
