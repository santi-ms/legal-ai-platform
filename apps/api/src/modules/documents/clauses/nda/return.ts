/**
 * NDA Clause: Return/Destruction of Information
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";
import type { StructuredDocumentData } from "../../domain/document-types.js";

export const ndaReturnClause: ClauseDefinition = {
  id: "devolucion_destruccion",
  name: "Devolución/Destrucción de Información",
  category: "type_specific",
  required: false,
  content: `{{CLAUSE_NUMBER}}: DEVOLUCIÓN O DESTRUCCIÓN DE INFORMACIÓN

Al finalizar el presente acuerdo o cuando el REVELADOR lo solicite, el RECEPTOR deberá, dentro del plazo de {{PLAZO_DEVOLUCION}} días:

a) Devolver al REVELADOR toda la Información Confidencial en su poder, en cualquier formato;
b) Destruir todas las copias, extractos o resúmenes de la Información Confidencial;
c) Certificar por escrito al REVELADOR el cumplimiento de las obligaciones anteriores.

El RECEPTOR no podrá conservar ninguna copia de la Información Confidencial, salvo que la ley o una orden judicial lo requiera.`,
  condition: (data: StructuredDocumentData) => Boolean(data.devolucion_destruccion && data.plazo_devolucion),
};

