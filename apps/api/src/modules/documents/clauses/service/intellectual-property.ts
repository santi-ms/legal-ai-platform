/**
 * Service Contract Clause: Intellectual Property
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";
import type { StructuredDocumentData } from "../../domain/document-types.js";

export const serviceIntellectualPropertyClause: ClauseDefinition = {
  id: "propiedad_intelectual",
  name: "Propiedad Intelectual",
  category: "type_specific",
  required: false,
  content: `{{CLAUSE_NUMBER}}: PROPIEDAD INTELECTUAL

{{IP_TYPE_TEXT}}

Todos los derechos de propiedad intelectual sobre los trabajos, creaciones, desarrollos o materiales generados en el marco de la prestación de servicios serán {{IP_DISPOSITION}} conforme a lo establecido en la presente cláusula.`,
  condition: (data: StructuredDocumentData) => Boolean(data.propiedad_intelectual && data.tipo_propiedad_intelectual),
};

