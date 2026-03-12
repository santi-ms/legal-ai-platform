/**
 * Legal Notice Clause: Deadline
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeDeadlineClause: ClauseDefinition = {
  id: "plazo_cumplimiento",
  name: "Plazo para Cumplir",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: PLAZO PARA CUMPLIR

Se otorga un plazo de {{DEADLINE}} para cumplir con la intimación formulada en la cláusula anterior, contado desde la recepción de la presente carta documento.

Vencido dicho plazo sin cumplimiento, se procederá conforme a lo establecido en la cláusula de apercibimiento.`,
};

