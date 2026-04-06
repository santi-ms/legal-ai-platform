/**
 * Legal Notice Clause: Context / Previous Relationship
 *
 * One compact sentence identifying the parties' relationship and origin
 * of the obligation. No section header — flows as plain paragraph.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const legalNoticeContextClause: ClauseDefinition = {
  id: "contexto_relacion",
  name: "Contexto y relación previa",
  category: "type_specific",
  required: true,
  content: `{{CONTEXT}}`,
};
