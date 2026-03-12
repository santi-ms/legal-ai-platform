/**
 * Legal Notice Clause: Breach
 */

import type { ClauseDefinition } from "../../domain/generation-engine";

export const legalNoticeBreachClause: ClauseDefinition = {
  id: "incumplimiento",
  name: "Descripción del Incumplimiento",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: INCUMPLIMIENTO

Como consecuencia de los hechos narrados, se ha producido el siguiente incumplimiento:

{{BREACH}}

Este incumplimiento genera responsabilidad y obliga a la parte incumplidora a reparar los daños causados.`,
};

