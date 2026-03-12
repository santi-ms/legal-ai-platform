/**
 * Generador de PDF en el frontend usando jsPDF
 * Solución más confiable que generar en el servidor
 * 
 * LÍMITES DE ESCALABILIDAD:
 * - Documentos pequeños/medianos (< 50KB texto): ✅ Funciona perfectamente
 * - Documentos grandes (50-200KB texto): ⚠️ Puede ser lento pero funciona
 * - Documentos muy grandes (> 200KB texto): ❌ Considerar generación en servidor
 */

import { jsPDF } from "jspdf";

// Límite práctico para generación en frontend (~20-30 páginas)
const MAX_FRONTEND_TEXT_SIZE = 50000; // ~50KB de texto

/**
 * Base function that creates a jsPDF document from text
 * Used internally by both generatePdfFromText and generatePdfBlobFromText
 */
function createPdfDocument(
  title: string,
  text: string
): jsPDF {
  if (!text || text.trim().length === 0) {
    throw new Error("No hay contenido para generar el PDF");
  }

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;

  let yPosition = margin;

  // Título
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  const titleLines = doc.splitTextToSize(title.toUpperCase(), maxWidth);
  doc.text(titleLines, pageWidth / 2, yPosition, {
    align: "center",
  });
  yPosition += titleLines.length * 8 + 10;

  // Línea separadora
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Limpiar texto - remover markdown
  let cleanText = text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1");

  // Dividir texto en líneas
  const lines = cleanText.split("\n").filter((line) => line.trim().length > 0);

  // Configurar fuente para el contenido
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);

  // Escribir cada línea
  for (const line of lines) {
    // Si nos quedamos sin espacio, agregar nueva página
    if (yPosition > pageHeight - margin - 20) {
      doc.addPage();
      yPosition = margin;
    }

    // Dividir línea si es muy larga
    const textLines = doc.splitTextToSize(line.trim(), maxWidth);
    
    for (const textLine of textLines) {
      if (yPosition > pageHeight - margin - 20) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setTextColor(0, 0, 0);
      doc.text(textLine, margin, yPosition);
      yPosition += 6; // Espaciado entre líneas
    }
    
    yPosition += 2; // Espacio adicional entre párrafos
  }

  // Bloque de firma
  if (yPosition > pageHeight - margin - 30) {
    doc.addPage();
    yPosition = margin;
  }

  yPosition += 20;
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, margin + 80, yPosition);
  yPosition += 8;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text("Firma / Aclaración / DNI", margin, yPosition);

  return doc;
}

/**
 * Generate and download a PDF from text
 * 
 * @param title - Document title
 * @param text - Document content
 * @param fileName - Output filename (default: "documento.pdf")
 */
export function generatePdfFromText(
  title: string,
  text: string,
  fileName: string = "documento.pdf"
): void {
  console.log("[pdf-generator] Iniciando generación de PDF");
  console.log("[pdf-generator] Title:", title);
  console.log("[pdf-generator] Text length:", text?.length || 0);
  console.log("[pdf-generator] Text preview:", text?.substring(0, 200) || "NO TEXT");
  
  if (!text || text.trim().length === 0) {
    console.error("[pdf-generator] ERROR: No hay texto para generar el PDF");
    alert("Error: No hay contenido para generar el PDF");
    return;
  }

  // Advertencia para documentos grandes
  if (text.length > MAX_FRONTEND_TEXT_SIZE) {
    const shouldContinue = confirm(
      `Este documento es muy grande (${Math.round(text.length / 1000)}KB). ` +
      `La generación puede tardar varios segundos y consumir mucha memoria. ¿Continuar?`
    );
    if (!shouldContinue) {
      return;
    }
  }

  try {
    const doc = createPdfDocument(title, text);
    console.log("[pdf-generator] Guardando PDF:", fileName);
    doc.save(fileName);
    console.log("[pdf-generator] PDF generado exitosamente");
  } catch (error) {
    console.error("[pdf-generator] ERROR al generar PDF:", error);
    alert(`Error al generar el PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a PDF blob from text (for preview/embedding)
 * 
 * @param title - Document title
 * @param text - Document content
 * @returns Blob URL for the PDF
 */
export function generatePdfBlobFromText(
  title: string,
  text: string
): string {
  console.log("[pdf-generator] Iniciando generación de PDF blob");
  console.log("[pdf-generator] Title:", title);
  console.log("[pdf-generator] Text length:", text?.length || 0);
  
  if (!text || text.trim().length === 0) {
    throw new Error("No hay contenido para generar el PDF");
  }

  try {
    const doc = createPdfDocument(title, text);
    const pdfBlob = doc.output("blob");
    const blobUrl = URL.createObjectURL(pdfBlob);
    console.log("[pdf-generator] PDF blob generado exitosamente");
    return blobUrl;
  } catch (error) {
    console.error("[pdf-generator] ERROR al generar PDF blob:", error);
    throw error;
  }
}
