/**
 * Legal Notice Clause: Context/Previous Relationship
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeContextClause: ClauseDefinition = {
  id: "contexto_relacion",
  name: "Contexto de Relación Previa",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: CONTEXTO Y RELACIÓN PREVIA

{{CONTEXT}}

En virtud de la relación establecida, se han producido los hechos que se detallan a continuación.`,
};

