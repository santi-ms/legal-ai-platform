/**
 * NDA Clause: Permitted Purpose
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const ndaPurposeClause: ClauseDefinition = {
  id: "finalidad_permitida",
  name: "Finalidad Permitida",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: FINALIDAD PERMITIDA

El RECEPTOR únicamente podrá utilizar la Información Confidencial para la siguiente finalidad específica:

{{PURPOSE}}

El RECEPTOR se compromete a no utilizar la Información Confidencial para ningún otro propósito que no sea el expresamente autorizado en la presente cláusula.`,
};

