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
  console.log("[pdf-generator] Iniciando generación de PDF");
  console.log("[pdf-generator] Title:", title);
  console.log("[pdf-generator] Text length:", text?.length || 0);
  console.log("[pdf-generator] Text preview:", text?.substring(0, 200) || "NO TEXT");
  
  if (!text || text.trim().length === 0) {
    console.error("[pdf-generator] ERROR: No hay texto para generar el PDF");
    alert("Error: No hay contenido para generar el PDF");
    return;
  }

  try {
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

    // TEXTO DE PRUEBA PRIMERO para verificar que funciona
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Negro explícito
    doc.text("PRUEBA: Este texto debe ser visible", pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 15;

    // Título
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0); // Negro explícito
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
  doc.setTextColor(0, 0, 0); // Negro explícito

  console.log("[pdf-generator] Escribiendo", lines.length, "líneas de texto");

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
      
      doc.setTextColor(0, 0, 0); // Negro explícito en cada línea
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
  doc.setTextColor(0, 0, 0); // Negro explícito
  doc.text("Firma / Aclaración / DNI", margin, yPosition);

  // Descargar PDF
  console.log("[pdf-generator] Guardando PDF:", fileName);
  doc.save(fileName);
  console.log("[pdf-generator] PDF generado exitosamente");
  } catch (error) {
    console.error("[pdf-generator] ERROR al generar PDF:", error);
    alert(`Error al generar el PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}

