/**
 * Common Clause: Jurisdiction and Applicable Law
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const jurisdictionClause: ClauseDefinition = {
  id: "foro_competencia",
  name: "Foro de Competencia",
  category: "common",
  required: true,
  content: `{{CLAUSE_NUMBER}}: FORO DE COMPETENCIA Y LEY APLICABLE

Las partes renuncian expresamente a cualquier otro fuero que pudiera corresponderles y se someten a la jurisdicción y competencia de los tribunales ordinarios de {{JURISDICTION}}, con exclusión de cualquier otro.

El presente contrato se rige por las leyes de la República Argentina, en especial por el Código Civil y Comercial de la Nación y el Código de Comercio.`,
};

