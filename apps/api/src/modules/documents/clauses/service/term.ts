/**
 * Service Contract Clause: Term and Duration
 */

import type { ClauseDefinition } from "../../domain/generation-engine";

export const serviceTermClause: ClauseDefinition = {
  id: "vigencia_plazo",
  name: "Vigencia y Plazo",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: VIGENCIA Y PLAZO

El presente contrato entrará en vigencia el día {{INICIO_VIGENCIA}} y tendrá una duración mínima de {{PLAZO_MINIMO_MESES}} meses.

{{RENEWAL_CLAUSE}}

Cualquiera de las partes podrá dar por terminado el contrato al vencimiento del plazo mínimo, previo aviso con {{PREAVISO_RENOVACION}} días de anticipación.`,
};

