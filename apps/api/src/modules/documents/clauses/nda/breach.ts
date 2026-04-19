/**
 * NDA Clause: Breach and Penalties
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";
import type { StructuredDocumentData } from "../../domain/document-types.js";

export const ndaBreachClause: ClauseDefinition = {
  id: "penalidad_incumplimiento",
  name: "Penalidad por Incumplimiento",
  category: "type_specific",
  required: false,
  content: `{{CLAUSE_NUMBER}}: INCUMPLIMIENTO Y PENALIDADES

En caso de incumplimiento de las obligaciones establecidas en el presente acuerdo por parte del RECEPTOR, este deberá pagar al REVELADOR:

{{PENALIDAD_INCUMPLIMIENTO}}

Sin perjuicio de lo anterior, el REVELADOR se reserva el derecho de reclamar daños y perjuicios adicionales que puedan derivarse del incumplimiento.

El RECEPTOR reconoce que el incumplimiento de este acuerdo causará un daño irreparable al REVELADOR, por lo que el REVELADOR podrá solicitar medidas cautelares y/o definitivas ante los tribunales competentes.`,
  condition: (data: StructuredDocumentData) => Boolean(data.penalidad_incumplimiento),
};

