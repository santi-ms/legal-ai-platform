/**
 * Legal Notice Clause: Warning / Apercibimiento
 *
 * States consequences of non-compliance. No section header — flows as plain
 * paragraph. No automatic penal threat — civil consequences only by default.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";
import type { StructuredDocumentData } from "../../domain/document-types.js";

export const legalNoticeWarningClause: ClauseDefinition = {
  id: "apercibimiento",
  name: "Apercibimiento",
  category: "type_specific",
  required: false,
  content: `Vencido el plazo sin cumplimiento, se iniciarán las acciones judiciales que correspondan, reclamando capital, intereses y costas y honorarios a su exclusivo cargo. Se reservan todas las demás acciones civiles que pudieran corresponder.`,
  condition: (data: StructuredDocumentData) => Boolean(data.apercibimiento),
};
