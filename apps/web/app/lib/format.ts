export function formatDate(value: string | Date) {
  const d = new Date(value);
  return d.toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatCurrency(amount: number, currency: string = "USD") {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(amount);
}

export function formatDocumentType(type: string) {
  const typeMap: Record<string, string> = {
    "contrato_servicios": "Contrato de Servicios",
    "contrato_suministro": "Contrato de Suministro", 
    "nda": "Acuerdo de Confidencialidad",
    "carta_documento": "Carta Documento",
    "contrato_locacion": "Contrato de Locación",
  };
  
  return typeMap[type] || type;
}

export function truncateText(text: string, maxLength: number = 50) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}






