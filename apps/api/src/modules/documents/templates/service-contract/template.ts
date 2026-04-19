/**
 * Service Contract Template
 * 
 * Base template for service contracts with placeholders.
 */

export const serviceContractTemplate = {
  id: "service_contract_v1",
  version: "1.0.0",
  content: `{{PARTIES}}

CONTRATO DE SERVICIOS PROFESIONALES

{{CLAUSE_IDENTIFICATION}}

{{CLAUSE_OBJECT}}

{{CLAUSE_AMOUNT}}

{{CLAUSE_TERM}}

{{CLAUSE_TERMINATION}}

{{CLAUSE_CONFIDENTIALITY}}

{{CLAUSE_INTELLECTUAL_PROPERTY}}

{{CLAUSE_JURISDICTION}}

{{CLAUSE_DISPUTES}}

FIRMAS

___________________________
{{PROVEEDOR_NOMBRE}}
Firma y aclaración / DNI

___________________________
{{CLIENTE_NOMBRE}}
Firma y aclaración / DNI

Lugar: {{JURISDICTION}}
Fecha: {{FECHA_ACTUAL}}
`,
  variablePlaceholders: [
    "{{PARTIES}}",
    "{{PROVEEDOR_NOMBRE}}",
    "{{CLIENTE_NOMBRE}}",
    "{{JURISDICTION}}",
    "{{FECHA_ACTUAL}}",
  ],
  clauseSlots: [
    "{{CLAUSE_IDENTIFICATION}}",
    "{{CLAUSE_OBJECT}}",
    "{{CLAUSE_AMOUNT}}",
    "{{CLAUSE_TERM}}",
    "{{CLAUSE_TERMINATION}}",
    "{{CLAUSE_CONFIDENTIALITY}}",
    "{{CLAUSE_INTELLECTUAL_PROPERTY}}",
    "{{CLAUSE_JURISDICTION}}",
    "{{CLAUSE_DISPUTES}}",
  ],
};

