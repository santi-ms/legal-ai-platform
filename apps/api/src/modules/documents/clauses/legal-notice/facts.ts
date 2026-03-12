/**
 * Legal Notice Clause: Facts
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeFactsClause: ClauseDefinition = {
  id: "hechos",
  name: "Narración de Hechos",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: HECHOS

Los hechos que dan origen a la presente comunicación son los siguientes:

{{FACTS}}

Estos hechos constituyen la base fáctica de la presente intimación.`,
};

