/**
 * Lease Clause: Plazo del Contrato
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseTermClause: ClauseDefinition = {
  id: "plazo_locacion",
  name: "Plazo del Contrato",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: PLAZO DEL CONTRATO

El presente contrato tendrá una duración de {{LEASE_TERM}}.

{{LEASE_RENEWAL}}`,
};
