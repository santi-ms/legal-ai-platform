/**
 * Lease Clause: Canon Locativo y Forma de Pago
 *
 * NO hardcoded interest rates or penalty percentages.
 * Mora interest defaults to tasa activa BNA (legal default in Argentina).
 * No automatic non-restitution penalty — only included if user requests it.
 * Specific rates or additional penalties must come from user input via the AI context.
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseAmountClause: ClauseDefinition = {
  id: "canon_locativo",
  name: "Canon Locativo y Forma de Pago",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: CANON LOCATIVO Y FORMA DE PAGO

El canon locativo mensual se fija en la suma de {{RENT_AMOUNT}}, que el LOCATARIO abonará al LOCADOR los días {{DIA_PAGO}} de cada mes mediante {{PAYMENT_TERMS}}.

{{AJUSTE_CANON}}

MORA EN EL PAGO: El incumplimiento en el pago del canon locativo en los plazos pactados devengará intereses moratorios a la tasa activa del Banco de la Nación Argentina para operaciones de descuento a treinta días, desde el vencimiento hasta el efectivo pago.`,
};
