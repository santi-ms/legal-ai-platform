/**
 * Legal Notice Clause: Demand / Intimation
 *
 * The core of the carta documento: a clear, specific, enforceable demand.
 * Uses "INTIMA FEHACIENTEMENTE" — the standard Argentine legal phrase
 * that signals formal notice with legal consequences.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeDemandClause: ClauseDefinition = {
  id: "intimacion",
  name: "Intimación",
  category: "type_specific",
  required: true,
  content: `IV. INTIMACIÓN

Por la presente se INTIMA FEHACIENTEMENTE a {{DESTINATARIO_NOMBRE}} a:

{{DEMAND}}`,
};
