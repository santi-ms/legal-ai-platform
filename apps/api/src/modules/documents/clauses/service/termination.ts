/**
 * Service Contract Clause: Termination
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";
import type { StructuredDocumentData } from "../../domain/document-types.js";

export const serviceTerminationClause: ClauseDefinition = {
  id: "penalizacion_rescision",
  name: "Penalización por Rescisión",
  category: "type_specific",
  required: false,
  content: `{{CLAUSE_NUMBER}}: RESCISIÓN ANTICIPADA

En caso de rescisión anticipada del presente contrato por parte del CLIENTE, antes del vencimiento del plazo mínimo establecido, el CLIENTE deberá abonar al PROVEEDOR una penalización equivalente a {{PENALIZACION_MONTO}}, como compensación por los servicios no prestados.

La rescisión anticipada deberá ser comunicada con {{PREAVISO_RESCISION}} días de anticipación.`,
  condition: (data: StructuredDocumentData) => Boolean(data.penalizacion_rescision && data.penalizacion_monto),
};

