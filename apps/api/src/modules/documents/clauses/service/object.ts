/**
 * Service Contract Clause: Object
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const serviceObjectClause: ClauseDefinition = {
  id: "objeto_contrato",
  name: "Objeto del Contrato",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: OBJETO DEL CONTRATO

El objeto del presente contrato es la prestación de los siguientes servicios:

{{OBJECT}}

{{SCOPE}}

{{DELIVERABLES}}

El PROVEEDOR se compromete a prestar los servicios mencionados con la diligencia y profesionalismo propios de su actividad, y el CLIENTE se obliga a recibirlos y pagar la contraprestación convenida.`,
};

