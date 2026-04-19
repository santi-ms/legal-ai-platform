/**
 * Debt Recognition Clause: Forma de Pago
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const debtRecognitionPaymentClause: ClauseDefinition = {
  id: "forma_pago_deuda",
  name: "Forma de Pago",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: FORMA DE PAGO

{{PAYMENT_PLAN}}

{{INTEREST_CLAUSE}}`,
};
