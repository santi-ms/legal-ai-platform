/**
 * Lease Clause: Plazo del Contrato
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseTermClause: ClauseDefinition = {
  id: "plazo_locacion",
  name: "Plazo del Contrato",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}. PLAZO:

1- El plazo total del presente CONTRATO será de {{LEASE_TERM}}.

2- Al vencimiento del plazo el LOCATARIO restituirá el inmueble sin necesidad de interpelación previa.

{{LEASE_RENEWAL}}`,
};
