/**
 * Generador de PDF en el frontend usando jsPDF
 *
 * Produce documentos legales con formato profesional:
 * - Fuente Times (estándar jurídico)
 * - Detección de estructura: títulos, cláusulas, sub-incisos, firmas
 * - Márgenes y espaciados conforme a documentos legales argentinos
 * - Número de página en pie de página
 *
 * LÍMITES:
 * - Documentos < 50KB: ✅ Óptimo
 * - Documentos 50-200KB: ⚠️ Funciona, puede ser lento
 * - Documentos > 200KB: ❌ Usar generación en servidor
 */

import { jsPDF } from "jspdf";

const MAX_FRONTEND_TEXT_SIZE = 50_000;

// ---------------------------------------------------------------------------
// Markdown cleanup
// ---------------------------------------------------------------------------

function stripMarkdown(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\*\*(.*?)\*\*/gs, "$1")
    .replace(/__(.*?)__/gs, "$1")
    .replace(/\*(.*?)\*/gs, "$1")
    .replace(/_(.*?)_/gs, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .trim();
}

// ---------------------------------------------------------------------------
// Line classifier (same logic as server-side PDF generator)
// ---------------------------------------------------------------------------

const ORDINAL_WORDS = new Set([
  "PRIMERA","SEGUNDA","TERCERA","CUARTA","QUINTA",
  "SEXTA","SÉPTIMA","OCTAVA","NOVENA","DÉCIMA",
  "UNDÉCIMA","DUODÉCIMA","DECIMOTERCERA","DECIMOCUARTA",
  "DECIMOQUINTA","DECIMOSEXTA",
  "I","II","III","IV","V","VI","VII","VIII","IX","X",
  "XI","XII","XIII","XIV","XV","XVI",
]);

type LineType =
  | "title" | "location_date" | "clause_header" | "section_title"
  | "subclause" | "signature_line" | "signature_label" | "empty" | "body";

function classifyLine(line: string, index: number, allLines: string[]): LineType {
  const trimmed = line.trim();
  if (trimmed.length === 0) return "empty";
  // Separator lines (---) → treat as empty space, never print as text
  if (/^[-─—]{3,}$/.test(trimmed)) return "empty";
  if (/^_{4,}/.test(trimmed)) return "signature_line";

  const prevNonEmpty = allLines.slice(0, index).reverse().find(l => l.trim().length > 0);
  if (prevNonEmpty && /^_{4,}/.test(prevNonEmpty.trim()) && trimmed.length <= 80) {
    return "signature_label";
  }

  const nonEmptyBefore = allLines.slice(0, index).filter(l => l.trim().length > 0).length;

  if (nonEmptyBefore <= 4 && /^\w[\w\s]+,\s+\d{1,2}\s+de\s+\w+/i.test(trimmed)) {
    return "location_date";
  }
  if (nonEmptyBefore === 0) return "title";
  if (
    nonEmptyBefore <= 3 &&
    trimmed === trimmed.toUpperCase() &&
    trimmed.length >= 5 && trimmed.length <= 80 &&
    !/^\d/.test(trimmed)
  ) return "title";

  const clauseMatch = trimmed.match(/^(CLÁUSULA\s+)?([A-ZÁÉÍÓÚÑ]+)[\.\-:\s]/);
  if (clauseMatch && ORDINAL_WORDS.has(clauseMatch[2])) return "clause_header";
  if (/^(I{1,3}|IV|V?I{0,3}|IX|X{0,3}I{0,3})\.\s+\S/.test(trimmed)) return "clause_header";

  if (/^([a-z]{1,3}|[ivxlcdm]+|\d+(\.\d+)?)\)\s+\S/i.test(trimmed)) return "subclause";
  if (/^\d+\.\d+\s+\S/.test(trimmed)) return "subclause";

  if (
    trimmed === trimmed.toUpperCase() &&
    trimmed.length >= 4 && trimmed.length <= 60 &&
    /^[A-ZÁÉÍÓÚÑ\s\/\-]+:?$/.test(trimmed) &&
    !/^\d/.test(trimmed)
  ) return "section_title";

  return "body";
}

// ---------------------------------------------------------------------------
// PDF builder
// ---------------------------------------------------------------------------

function createPdfDocument(title: string, text: string): jsPDF {
  if (!text || text.trim().length === 0) {
    throw new Error("No hay contenido para generar el PDF");
  }

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW  = doc.internal.pageSize.getWidth();
  const pageH  = doc.internal.pageSize.getHeight();
  const mLeft  = 30;   // 3cm left (standard legal)
  const mRight = 20;   // 2cm right
  const mTop   = 25;   // 2.5cm top
  const mBot   = 25;   // 2.5cm bottom
  const textW  = pageW - mLeft - mRight;
  const lineH  = 6.5;  // ~1.6 line height at 12pt
  const footerH = 12;

  let y = mTop;
  let pageNum = 1;

  const addPage = () => {
    // Footer on current page
    drawFooter(pageNum);
    doc.addPage();
    pageNum++;
    y = mTop;
  };

  const checkY = (needed: number) => {
    if (y + needed > pageH - mBot - footerH) addPage();
  };

  const drawFooter = (n: number) => {
    const totalPages = (doc.internal as any).getNumberOfPages?.() ?? n;
    doc.setFontSize(8);
    doc.setFont("times", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Página ${n} de ${totalPages}`, pageW / 2, pageH - 10, { align: "center" });
    doc.setTextColor(0, 0, 0);
  };

  const cleanText = stripMarkdown(text);
  const lines     = cleanText.split("\n");

  // ── Title ──────────────────────────────────────────────────────────────────
  doc.setFontSize(13);
  doc.setFont("times", "bold");
  doc.setTextColor(0, 0, 0);
  const titleWrapped = doc.splitTextToSize(title.toUpperCase(), textW);
  checkY(titleWrapped.length * 7 + 8);
  doc.text(titleWrapped, pageW / 2, y, { align: "center" });
  y += titleWrapped.length * 7;

  // Divider line under title
  doc.setLineWidth(0.4);
  doc.line(mLeft, y, pageW - mRight, y);
  y += 8;

  // ── Body ───────────────────────────────────────────────────────────────────
  for (let i = 0; i < lines.length; i++) {
    const line    = lines[i];
    const trimmed = line.trim();
    const type    = classifyLine(line, i, lines);

    switch (type) {
      case "empty":
        y += 3;
        break;

      case "location_date":
        checkY(lineH);
        doc.setFontSize(10);
        doc.setFont("times", "normal");
        doc.text(trimmed, pageW - mRight, y, { align: "right" });
        y += lineH + 2;
        break;

      case "title":
        // Secondary titles (after main title already drawn)
        checkY(lineH + 4);
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        const tLines = doc.splitTextToSize(trimmed, textW);
        doc.text(tLines, pageW / 2, y, { align: "center" });
        y += tLines.length * (lineH - 0.5) + 4;
        break;

      case "section_title":
        checkY(lineH + 6);
        y += 4;
        doc.setFontSize(11);
        doc.setFont("times", "bold");
        doc.text(trimmed, pageW / 2, y, { align: "center" });
        y += lineH + 2;
        break;

      case "clause_header":
        checkY(lineH + 6);
        y += 5;
        doc.setFontSize(12);
        doc.setFont("times", "bold");
        const chLines = doc.splitTextToSize(trimmed, textW);
        doc.text(chLines, mLeft, y);
        y += chLines.length * lineH + 1;
        break;

      case "subclause":
        checkY(lineH);
        doc.setFontSize(11);
        doc.setFont("times", "normal");
        const subIndent = mLeft + 8;
        const subW      = textW - 8;
        const subLines  = doc.splitTextToSize(trimmed, subW);
        doc.text(subLines, subIndent, y);
        y += subLines.length * (lineH - 0.5) + 1.5;
        break;

      case "signature_line":
        checkY(lineH + 6);
        y += 6;
        doc.setFontSize(11);
        doc.setFont("times", "normal");
        doc.text(trimmed, mLeft, y);
        y += lineH;
        break;

      case "signature_label":
        checkY(lineH);
        doc.setFontSize(9);
        doc.setFont("times", "normal");
        doc.setTextColor(60, 60, 60);
        doc.text(trimmed, mLeft, y);
        doc.setTextColor(0, 0, 0);
        y += lineH + 2;
        break;

      case "body":
      default:
        doc.setFontSize(11);
        doc.setFont("times", "normal");
        const bodyLines = doc.splitTextToSize(trimmed, textW);
        checkY(bodyLines.length * lineH);
        // First-line indent for body paragraphs
        const firstLine = doc.splitTextToSize(bodyLines[0] ?? "", textW - 5);
        doc.text(firstLine, mLeft + 5, y);
        if (bodyLines.length > 1) {
          const rest = doc.splitTextToSize(bodyLines.slice(1).join(" "), textW);
          y += firstLine.length * lineH;
          doc.text(rest, mLeft, y);
          y += rest.length * lineH;
        } else {
          y += firstLine.length * lineH;
        }
        y += 1.5;
        break;
    }
  }

  // Footer on last page
  drawFooter(pageNum);

  return doc;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generatePdfFromText(
  title: string,
  text: string,
  fileName = "documento.pdf"
): void {
  if (!text || text.trim().length === 0) {
    alert("Error: No hay contenido para generar el PDF");
    return;
  }

  if (text.length > MAX_FRONTEND_TEXT_SIZE) {
    const ok = confirm(
      `Este documento es muy extenso (${Math.round(text.length / 1000)} KB). ` +
      `La generación puede tardar unos segundos. ¿Continuar?`
    );
    if (!ok) return;
  }

  try {
    const doc = createPdfDocument(title, text);
    doc.save(fileName);
  } catch (err) {
    alert(`Error al generar el PDF: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function generatePdfBlobFromText(title: string, text: string): string {
  if (!text || text.trim().length === 0) {
    throw new Error("No hay contenido para generar el PDF");
  }
  const doc    = createPdfDocument(title, text);
  const blob   = doc.output("blob");
  return URL.createObjectURL(blob);
}
