/**
 * Generador de PDF en el frontend usando jsPDF
 * Solución más confiable que generar en el servidor
 */

import { jsPDF } from "jspdf";

export function generatePdfFromText(
  title: string,
  text: string,
  fileName: string = "documento.pdf"
): void {
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
  doc.text("Firma / Aclaración / DNI", margin, yPosition);

  // Descargar PDF
  doc.save(fileName);
}

