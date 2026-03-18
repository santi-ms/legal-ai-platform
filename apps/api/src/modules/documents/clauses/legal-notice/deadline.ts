/**
 * Legal Notice Clause: Deadline
 *
 * States the compliance deadline in plain terms.
 * The deadline value comes from formatDeadline() in generation-engine.ts,
 * which maps enum values like "10_dias" to "10 días hábiles".
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeDeadlineClause: ClauseDefinition = {
  id: "plazo_cumplimiento",
  name: "Plazo para Cumplir",
  category: "type_specific",
  required: true,
  content: `V. PLAZO PARA CUMPLIR

Se otorga el plazo de {{DEADLINE}} a partir de la recepción de la presente para dar cumplimiento a lo intimado.`,
};
