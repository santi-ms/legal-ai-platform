/**
 * Legal Notice Template (Carta Documento)
 *
 * Structure follows Argentine legal practice for cartas documento:
 * - Header: city, date, remitente → destinatario
 * - Title: CARTA DOCUMENTO
 * - Body: context → facts → breach → demand → deadline → warning
 * - Footer: place, date, signature
 *
 * Intentionally excludes contract-style clauses (foro de competencia,
 * resolución de disputas) — those are inappropriate for this document type.
 */

export const legalNoticeTemplate = {
  id: "legal_notice_v1",
  version: "1.1.0",
  content: `{{JURISDICTION}}, {{FECHA_ACTUAL}}

{{PARTIES}}

CARTA DOCUMENTO

{{CLAUSE_CONTEXT}}

{{CLAUSE_FACTS}}

{{CLAUSE_BREACH}}

{{CLAUSE_DEMAND}}

{{CLAUSE_DEADLINE}}

{{CLAUSE_WARNING}}

Sin otro particular, saludo a Ud. atentamente.

_______________________________
{{REMITENTE_NOMBRE}}
Firma y aclaración
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
  ],
};
