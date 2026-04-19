/**
 * Simple Authorization Clause: Alcance de la Autorización
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const authScopeClause: ClauseDefinition = {
  id: "alcance_autorizacion",
  name: "Objeto y Alcance de la Autorización",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: OBJETO Y ALCANCE DE LA AUTORIZACIÓN

Por la presente, el/la AUTORIZANTE {{AUTORIZANTE_NOMBRE}} autoriza expresamente a {{AUTORIZADO_NOMBRE}} para:

Trámite autorizado: {{TRAMITE}}

Alcance detallado: {{SCOPE_DESC}}

{{LIMITATIONS}}`,
};
