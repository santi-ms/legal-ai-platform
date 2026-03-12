/**
 * Service Contract Clause: Confidentiality
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";
import type { StructuredDocumentData } from "../../domain/document-types.js";

export const serviceConfidentialityClause: ClauseDefinition = {
  id: "confidencialidad",
  name: "Confidencialidad",
  category: "type_specific",
  required: false,
  content: `{{CLAUSE_NUMBER}}: CONFIDENCIALIDAD

Las partes se comprometen a mantener absoluta confidencialidad sobre toda la información que se intercambie en el marco de la prestación de servicios, ya sea de carácter comercial, técnico, financiero o de cualquier otra naturaleza.

Esta obligación de confidencialidad se extenderá por un plazo de {{PLAZO_CONFIDENCIALIDAD}} años contados desde la finalización del contrato.`,
  condition: (data: StructuredDocumentData) => Boolean(data.confidencialidad && data.plazo_confidencialidad),
};

