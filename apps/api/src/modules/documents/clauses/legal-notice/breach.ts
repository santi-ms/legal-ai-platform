/**
 * Legal Notice Clause: Breach
 *
 * Describes the specific failure or non-compliance.
 * States facts, not legal conclusions — conclusions belong in the demand clause.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeBreachClause: ClauseDefinition = {
  id: "incumplimiento",
  name: "Incumplimiento",
  category: "type_specific",
  required: true,
  content: `III. INCUMPLIMIENTO

{{BREACH}}`,
};
