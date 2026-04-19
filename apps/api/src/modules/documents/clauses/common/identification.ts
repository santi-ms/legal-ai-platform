/**
 * Common Clause: Identification of Parties
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";
import type { StructuredDocumentData } from "../../domain/document-types.js";

export const identificationClause: ClauseDefinition = {
  id: "identificacion_partes",
  name: "Identificación de Partes",
  category: "common",
  required: true,
  content: `{{CLAUSE_NUMBER}}: IDENTIFICACIÓN DE PARTES

{{PARTIES}}

Las partes se reconocen mutuamente capacidad legal para contratar y se obligan a cumplir las estipulaciones del presente contrato.`,
};

