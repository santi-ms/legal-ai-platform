/**
 * Lease Clause: Canon Locativo y Forma de Pago
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseAmountClause: ClauseDefinition = {
  id: "canon_locativo",
  name: "Canon Locativo y Forma de Pago",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: CANON LOCATIVO Y FORMA DE PAGO

El canon locativo mensual se fija en la suma de {{RENT_AMOUNT}}, que el LOCATARIO abonará al LOCADOR los días {{DIA_PAGO}} de cada mes mediante {{PAYMENT_TERMS}}.

{{AJUSTE_CANON}}`,
};
