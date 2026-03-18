/**
 * Legal Notice Clause: Context / Previous Relationship
 *
 * Presents the factual background that gives rise to the notice.
 * Written in first-person narrative, not as a contract recital.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeContextClause: ClauseDefinition = {
  id: "contexto_relacion",
  name: "Relación Previa y Contexto",
  category: "type_specific",
  required: true,
  content: `I. RELACIÓN PREVIA Y CONTEXTO

{{CONTEXT}}`,
};
