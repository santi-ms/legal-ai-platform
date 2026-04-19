/**
 * Debt Recognition Template (Reconocimiento de Deuda)
 */

export const debtRecognitionTemplate = {
  id: "debt_recognition_v1",
  version: "1.0.0",
  content: `{{JURISDICTION}}, {{FECHA_ACTUAL}}

{{PARTIES}}

RECONOCIMIENTO DE DEUDA

{{CLAUSE_DEBT}}

{{CLAUSE_PAYMENT}}

{{CLAUSE_DEFAULT}}

{{CLAUSE_JURISDICTION}}

{{CLAUSE_DISPUTES}}

___________________________        ___________________________
{{ACREEDOR_NOMBRE}}                 {{DEUDOR_NOMBRE}}
Acreedor - Firma y aclaración      Deudor - Firma y aclaración
`,
  variablePlaceholders: [
    "{{PARTIES}}",
    "{{ACREEDOR_NOMBRE}}",
    "{{DEUDOR_NOMBRE}}",
    "{{JURISDICTION}}",
    "{{FECHA_ACTUAL}}",
  ],
  clauseSlots: [
    "{{CLAUSE_DEBT}}",
    "{{CLAUSE_PAYMENT}}",
    "{{CLAUSE_DEFAULT}}",
    "{{CLAUSE_JURISDICTION}}",
    "{{CLAUSE_DISPUTES}}",
  ],
};
