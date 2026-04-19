/**
 * NDA Clause: Confidentiality Term
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const ndaTermClause: ClauseDefinition = {
  id: "plazo_confidencialidad",
  name: "Plazo de Confidencialidad",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: PLAZO DE CONFIDENCIALIDAD

La obligación de confidencialidad establecida en el presente acuerdo se extenderá por un plazo de {{PLAZO_CONFIDENCIALIDAD}} años, contados desde la fecha de finalización del acuerdo o desde la última comunicación de Información Confidencial, la que sea posterior.

Esta obligación subsistirá independientemente de la finalización del presente acuerdo por cualquier causa.`,
};

