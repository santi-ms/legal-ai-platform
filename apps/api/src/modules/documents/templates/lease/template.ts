/**
 * Lease Agreement Template (Contrato de Locación)
 */

export const leaseTemplate = {
  id: "lease_v1",
  version: "1.0.0",
  content: `{{PARTIES}}

CONTRATO DE LOCACIÓN

{{CLAUSE_PROPERTY}}

{{CLAUSE_AMOUNT}}

{{CLAUSE_TERM}}

{{CLAUSE_CONDITIONS}}

{{CLAUSE_OBLIGATIONS}}

{{CLAUSE_GUARANTOR}}

{{CLAUSE_LEASE_TERMINATION}}

{{CLAUSE_JURISDICTION}}

{{CLAUSE_DISPUTES}}

Lugar y Fecha: {{JURISDICTION}}, {{FECHA_ACTUAL}}

___________________________        ___________________________
{{LOCADOR_NOMBRE}}                  {{LOCATARIO_NOMBRE}}
Locador - Firma y aclaración       Locatario - Firma y aclaración

{{FIADOR_FIRMA}}`,
  variablePlaceholders: [
    "{{PARTIES}}",
    "{{LOCADOR_NOMBRE}}",
    "{{LOCATARIO_NOMBRE}}",
    "{{JURISDICTION}}",
    "{{FECHA_ACTUAL}}",
    "{{FIADOR_FIRMA}}",
  ],
  clauseSlots: [
    "{{CLAUSE_PROPERTY}}",
    "{{CLAUSE_AMOUNT}}",
    "{{CLAUSE_TERM}}",
    "{{CLAUSE_CONDITIONS}}",
    "{{CLAUSE_OBLIGATIONS}}",
    "{{CLAUSE_GUARANTOR}}",
    "{{CLAUSE_LEASE_TERMINATION}}",
    "{{CLAUSE_JURISDICTION}}",
    "{{CLAUSE_DISPUTES}}",
  ],
};
