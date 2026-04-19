/**
 * Simple Authorization Clause: Vigencia y Observaciones
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const authValidityClause: ClauseDefinition = {
  id: "vigencia_autorizacion",
  name: "Vigencia",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: VIGENCIA

{{AUTH_VALIDITY}}`,
};

export const authObservationsClause: ClauseDefinition = {
  id: "observaciones_autorizacion",
  name: "Observaciones y Condiciones Especiales",
  category: "type_specific",
  required: false,
  content: `{{CLAUSE_NUMBER}}: OBSERVACIONES

{{SPECIAL_CONDITIONS}}`,
  condition: (data) =>
    Boolean(data.condiciones_especiales || data.documentacion_asociada),
};
