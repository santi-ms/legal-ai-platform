/**
 * Legal Notice Clause: Breach / Non-compliance
 *
 * States the specific failure. No section header — flows as plain paragraph.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeBreachClause: ClauseDefinition = {
  id: "incumplimiento",
  name: "Incumplimiento",
  category: "type_specific",
  required: true,
  content: `{{BREACH}}`,
};
