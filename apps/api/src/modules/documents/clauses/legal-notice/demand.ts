/**
 * Legal Notice Clause: Demand/Intimation
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeDemandClause: ClauseDefinition = {
  id: "intimacion",
  name: "Intimación",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: INTIMACIÓN

Por la presente, se INTIMA a {{DESTINATARIO_NOMBRE}} a:

{{DEMAND}}

Esta intimación es clara, concreta y específica, y debe ser cumplida en los términos establecidos.`,
};

