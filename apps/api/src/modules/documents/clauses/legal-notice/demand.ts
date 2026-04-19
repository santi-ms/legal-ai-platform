/**
 * Legal Notice Clause: Demand / Intimation
 *
 * The core of the carta documento: a clear, specific, enforceable demand
 * with deadline embedded. No section header — flows as plain paragraph.
 * Uses "INTIMA FEHACIENTEMENTE" — the standard Argentine legal phrase.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeDemandClause: ClauseDefinition = {
  id: "intimacion",
  name: "Intimación",
  category: "type_specific",
  required: true,
  content: `Por la presente INTIMA FEHACIENTEMENTE a {{DESTINATARIO_NOMBRE}} a {{DEMAND}}, dentro del plazo de {{DEADLINE}} contados desde la recepción de la presente${
    ""
  }. En caso de tratarse de una obligación dineraria, el pago deberá efectuarse mediante transferencia bancaria a la cuenta que se le indicará fehacientemente, o en el domicilio del suscripto.`,
};
