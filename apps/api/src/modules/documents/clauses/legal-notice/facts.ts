/**
 * Legal Notice Clause: Facts
 *
 * Brief factual statement of what happened and what is owed.
 * No section header — flows as plain paragraph.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeFactsClause: ClauseDefinition = {
  id: "hechos",
  name: "Hechos",
  category: "type_specific",
  required: true,
  content: `{{FACTS}}`,
};
