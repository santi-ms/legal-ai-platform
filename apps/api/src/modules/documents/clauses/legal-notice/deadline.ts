/**
 * Legal Notice Clause: Deadline
 *
 * Standalone deadline clause — used only when deadline needs to appear
 * separately from the demand clause. In most cases, deadline is embedded
 * directly in the demand clause above.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeDeadlineClause: ClauseDefinition = {
  id: "plazo_cumplimiento",
  name: "Plazo para Cumplir",
  category: "type_specific",
  required: false,
  content: `Se otorga el plazo de {{DEADLINE}} a partir de la recepción de la presente para dar cumplimiento a lo intimado.`,
};
