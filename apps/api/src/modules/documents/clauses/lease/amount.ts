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
  content: `{{CLAUSE_NUMBER}}. PRECIO Y FORMA DE PAGO:

1- Las partes convienen un canon locativo mensual de {{RENT_AMOUNT}}.

2- El pago se realizará mediante {{PAYMENT_TERMS}}, con vencimiento el {{DIA_PAGO}} de cada mes.

3- {{AJUSTE_CANON}}

4- MORA: El incumplimiento en el pago del canon locativo devengará intereses moratorios a la tasa activa del Banco de la Nación Argentina para operaciones de descuento a treinta días, desde el vencimiento hasta el efectivo pago, sin necesidad de interpelación previa.`,
};
