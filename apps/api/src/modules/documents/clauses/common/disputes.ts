/**
 * Common Clause: Dispute Resolution
 */

import type { ClauseDefinition } from "../../domain/generation-engine";

export const disputesClause: ClauseDefinition = {
  id: "resolucion_disputas",
  name: "Resolución de Disputas",
  category: "common",
  required: true,
  content: `{{CLAUSE_NUMBER}}: RESOLUCIÓN DE DISPUTAS

En caso de controversias derivadas del presente contrato, las partes se comprometen a intentar resolverlas mediante negociación directa. Si no se alcanza un acuerdo en un plazo de treinta (30) días, las partes podrán recurrir a mediación o iniciar acciones judiciales ante los tribunales competentes.`,
};

