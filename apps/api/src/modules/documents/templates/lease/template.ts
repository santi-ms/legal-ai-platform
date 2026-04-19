/**
 * Lease Agreement Template (Contrato de Locación)
 *
 * Clause order mirrors standard Argentine lease practice:
 * 1.  Objeto          6.  Obligaciones
 * 2.  Destino/Uso     7.  Reparaciones y Mejoras
 * 3.  Plazo           8.  Impuestos y Gastos
 * 4.  Precio/Canon    9.  Usuarios del Inmueble
 * 5.  Intereses Mora  10. Fianza / Depósito
 *                     11. Causales de Resolución
 *                     12. Rescisión Anticipada
 *                     13. Constitución de Domicilios
 *                     14. Jurisdicción y Litigios
 */

export const leaseTemplate = {
  id: "lease_v2",
  version: "2.0.0",
  content: `CONTRATO DE LOCACIÓN

{{PARTIES}}

{{CLAUSE_PROPERTY}}

{{CLAUSE_TERM}}

{{CLAUSE_AMOUNT}}

{{CLAUSE_CONDITIONS}}

{{CLAUSE_OBLIGATIONS}}

{{CLAUSE_GUARANTOR}}

{{CLAUSE_LEASE_TERMINATION}}

{{CLAUSE_JURISDICTION}}

{{CLAUSE_DISPUTES}}

Se suscriben DOS (2) juegos de ejemplares de igual tenor y a un solo efecto. Celebrado en {{JURISDICTION}}, el día {{FECHA_DIA}} del mes de {{FECHA_MES}} del año {{FECHA_ANIO}}.

___________________________        ___________________________
{{LOCADOR_NOMBRE}}                  {{LOCATARIO_NOMBRE}}
LOCADOR — Firma y aclaración        LOCATARIO — Firma y aclaración

{{FIADOR_FIRMA}}`,
  variablePlaceholders: [
    "{{PARTIES}}",
    "{{LOCADOR_NOMBRE}}",
    "{{LOCATARIO_NOMBRE}}",
    "{{JURISDICTION}}",
    "{{FECHA_DIA}}",
    "{{FECHA_MES}}",
    "{{FECHA_ANIO}}",
    "{{FIADOR_FIRMA}}",
  ],
  clauseSlots: [
    "{{CLAUSE_PROPERTY}}",
    "{{CLAUSE_TERM}}",
    "{{CLAUSE_AMOUNT}}",
    "{{CLAUSE_CONDITIONS}}",
    "{{CLAUSE_OBLIGATIONS}}",
    "{{CLAUSE_GUARANTOR}}",
    "{{CLAUSE_LEASE_TERMINATION}}",
    "{{CLAUSE_JURISDICTION}}",
    "{{CLAUSE_DISPUTES}}",
  ],
};
