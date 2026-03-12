/**
 * NDA Template
 * 
 * Base template for Non-Disclosure Agreements with placeholders.
 */

export const ndaTemplate = {
  id: "nda_v1",
  version: "1.0.0",
  content: `{{PARTIES}}

ACUERDO DE CONFIDENCIALIDAD (NDA)

{{CLAUSE_IDENTIFICATION}}

{{CLAUSE_DEFINITION}}

{{CLAUSE_PURPOSE}}

{{CLAUSE_OBLIGATIONS}}

{{CLAUSE_TERM}}

{{CLAUSE_RETURN}}

{{CLAUSE_BREACH}}

{{CLAUSE_JURISDICTION}}

{{CLAUSE_DISPUTES}}

FIRMAS

___________________________
{{REVELADOR_NOMBRE}}
Firma y aclaración / DNI

___________________________
{{RECEPTOR_NOMBRE}}
Firma y aclaración / DNI

Lugar: {{JURISDICTION}}
Fecha: {{FECHA_ACTUAL}}
`,
  variablePlaceholders: [
    "{{PARTIES}}",
    "{{REVELADOR_NOMBRE}}",
    "{{RECEPTOR_NOMBRE}}",
    "{{JURISDICTION}}",
    "{{FECHA_ACTUAL}}",
  ],
  clauseSlots: [
    "{{CLAUSE_IDENTIFICATION}}",
    "{{CLAUSE_DEFINITION}}",
    "{{CLAUSE_PURPOSE}}",
    "{{CLAUSE_OBLIGATIONS}}",
    "{{CLAUSE_TERM}}",
    "{{CLAUSE_RETURN}}",
    "{{CLAUSE_BREACH}}",
    "{{CLAUSE_JURISDICTION}}",
    "{{CLAUSE_DISPUTES}}",
  ],
};

