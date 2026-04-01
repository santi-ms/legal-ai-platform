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

{{PREAVISO_RESCISION}}

CONSTITUCIÓN DE DOMICILIOS: Las partes constituyen domicilios en los indicados al inicio del presente contrato, donde serán válidas todas las notificaciones, intimaciones y comunicaciones judiciales o extrajudiciales.`,
};
