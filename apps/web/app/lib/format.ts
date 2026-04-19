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
    // Canonical English IDs (new types stored directly in DB)
    "service_contract":     "Contrato de Servicios",
    "nda":                  "Acuerdo de Confidencialidad (NDA)",
    "legal_notice":         "Carta Documento",
    "lease":                "Contrato de Locación",
    "debt_recognition":     "Reconocimiento de Deuda",
    "simple_authorization": "Poder / Autorización",
    "supply_contract":      "Contrato de Suministro",
    // Legacy Spanish slugs (existing DB records for older types)
    "contrato_servicios":   "Contrato de Servicios",
    "contrato_suministro":  "Contrato de Suministro",
    "carta_documento":      "Carta Documento",
    "contrato_locacion":    "Contrato de Locación",
  };

  return typeMap[type] || type;
}

export function truncateText(text: string, maxLength: number = 50) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}






