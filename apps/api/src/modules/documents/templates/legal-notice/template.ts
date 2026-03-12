/**
 * Legal Notice Template
 * 
 * Base template for Legal Notices (Carta Documento) with placeholders.
 */

export const legalNoticeTemplate = {
  id: "legal_notice_v1",
  version: "1.0.0",
  content: `{{PARTIES}}

CARTA DOCUMENTO

{{CLAUSE_CONTEXT}}

{{CLAUSE_FACTS}}

{{CLAUSE_BREACH}}

{{CLAUSE_DEMAND}}

{{CLAUSE_DEADLINE}}

{{CLAUSE_WARNING}}

{{CLAUSE_JURISDICTION}}

{{CLAUSE_DISPUTES}}

Lugar: {{JURISDICTION}}
Fecha: {{FECHA_ACTUAL}}

___________________________
{{REMITENTE_NOMBRE}}
Firma y aclaración / DNI
`,
  variablePlaceholders: [
    "{{PARTIES}}",
    "{{REMITENTE_NOMBRE}}",
    "{{JURISDICTION}}",
    "{{FECHA_ACTUAL}}",
  ],
  clauseSlots: [
    "{{CLAUSE_CONTEXT}}",
    "{{CLAUSE_FACTS}}",
    "{{CLAUSE_BREACH}}",
    "{{CLAUSE_DEMAND}}",
    "{{CLAUSE_DEADLINE}}",
    "{{CLAUSE_WARNING}}",
    "{{CLAUSE_JURISDICTION}}",
    "{{CLAUSE_DISPUTES}}",
  ],
};

