/**
 * Legal Notice Clause: Warning / Apercibimiento
 *
 * Optional clause: only included when data.apercibimiento is present.
 * States the consequences of non-compliance and reserves all legal rights.
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";
import type { StructuredDocumentData } from "../../domain/document-types.js";

export const legalNoticeWarningClause: ClauseDefinition = {
  id: "apercibimiento",
  name: "Apercibimiento y Reserva de Acciones",
  category: "type_specific",
  required: false,
  content: `VI. APERCIBIMIENTO Y RESERVA DE ACCIONES

Vencido el plazo indicado sin que se acredite el cumplimiento de lo intimado:

{{WARNING}}

Sin perjuicio de lo expuesto, se reservan expresamente todas las acciones legales, civiles y/o penales que pudieran corresponder, con más los intereses, daños, costas y honorarios profesionales que se devenguen.`,
  condition: (data: StructuredDocumentData) => Boolean(data.apercibimiento),
};
