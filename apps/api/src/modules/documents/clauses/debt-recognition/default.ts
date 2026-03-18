/**
 * Debt Recognition Clause: Incumplimiento y Mora
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const debtRecognitionDefaultClause: ClauseDefinition = {
  id: "incumplimiento_deuda",
  name: "Incumplimiento y Mora",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: INCUMPLIMIENTO Y MORA

{{DEFAULT_CLAUSE}}`,
};
