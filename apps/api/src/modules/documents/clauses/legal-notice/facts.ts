/**
 * Legal Notice Clause: Facts
 *
 * Chronological narrative of the relevant events.
 * Plain, direct language — no contract-style closing phrases.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeFactsClause: ClauseDefinition = {
  id: "hechos",
  name: "Hechos",
  category: "type_specific",
  required: true,
  content: `II. HECHOS

{{FACTS}}`,
};
