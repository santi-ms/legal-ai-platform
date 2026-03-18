/**
 * Lease Clause: Depósito, Servicios y Rescisión
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseConditionsClause: ClauseDefinition = {
  id: "condiciones_locacion",
  name: "Condiciones Adicionales",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: CONDICIONES ADICIONALES

{{DEPOSITO}}

{{SERVICIOS_LOCATARIO}}

{{PREAVISO_RESCISION}}`,
};
