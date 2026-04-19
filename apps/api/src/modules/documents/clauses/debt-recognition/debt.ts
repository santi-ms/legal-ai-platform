/**
 * Debt Recognition Clause: Reconocimiento de la Deuda
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const debtRecognitionDebtClause: ClauseDefinition = {
  id: "reconocimiento_deuda",
  name: "Reconocimiento de la Deuda",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: RECONOCIMIENTO DE LA DEUDA

Por medio del presente instrumento, el DEUDOR {{DEUDOR_NOMBRE}} reconoce adeudar al ACREEDOR {{ACREEDOR_NOMBRE}} la suma de {{DEBT_AMOUNT}}, en concepto de: {{DEBT_CAUSE}}

Fecha de reconocimiento: {{RECOGNITION_DATE}}

El DEUDOR declara que el importe reconocido es líquido, exigible y de plazo vencido, renunciando a cualquier excepción o defensa que pueda oponer al respecto.`,
};
