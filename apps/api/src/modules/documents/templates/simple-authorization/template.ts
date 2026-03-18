/**
 * Simple Authorization Template (Poder / Autorización)
 */

export const simpleAuthorizationTemplate = {
  id: "simple_authorization_v1",
  version: "1.0.0",
  content: `{{JURISDICTION}}, {{FECHA_ACTUAL}}

{{PARTIES}}

AUTORIZACIÓN / PODER ESPECIAL

{{CLAUSE_SCOPE}}

{{CLAUSE_VALIDITY}}

{{CLAUSE_OBSERVATIONS}}

{{CLAUSE_JURISDICTION}}

___________________________
{{AUTORIZANTE_NOMBRE}}
Autorizante - Firma y aclaración
`,
  variablePlaceholders: [
    "{{PARTIES}}",
    "{{AUTORIZANTE_NOMBRE}}",
    "{{JURISDICTION}}",
    "{{FECHA_ACTUAL}}",
  ],
  clauseSlots: [
    "{{CLAUSE_SCOPE}}",
    "{{CLAUSE_VALIDITY}}",
    "{{CLAUSE_OBSERVATIONS}}",
    "{{CLAUSE_JURISDICTION}}",
  ],
};
