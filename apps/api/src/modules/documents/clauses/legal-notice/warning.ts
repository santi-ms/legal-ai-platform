/**
 * Legal Notice Clause: Warning/Apercibimiento
 */

import type { ClauseDefinition } from "../../domain/generation-engine";

export const legalNoticeWarningClause: ClauseDefinition = {
  id: "apercibimiento",
  name: "Apercibimiento",
  category: "type_specific",
  required: false,
  content: `{{CLAUSE_NUMBER}}: APERCIBIMIENTO

En caso de incumplimiento de la intimación formulada dentro del plazo establecido, se procederá a:

{{WARNING}}

Sin perjuicio de lo anterior, se reserva el derecho de reclamar daños y perjuicios, intereses y costas del proceso.`,
  condition: (data) => Boolean(data.apercibimiento),
};

