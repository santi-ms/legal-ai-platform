/**
 * NDA Clause: Obligations of the Recipient
 */

import type { ClauseDefinition } from "../../domain/generation-engine";

export const ndaObligationsClause: ClauseDefinition = {
  id: "obligaciones_receptor",
  name: "Obligaciones del Receptor",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: OBLIGACIONES DEL RECEPTOR

El RECEPTOR se compromete a:

a) Mantener absoluta confidencialidad sobre la Información Confidencial;
b) No divulgar, comunicar, publicar o poner a disposición de terceros la Información Confidencial, salvo autorización expresa y por escrito del REVELADOR;
c) No utilizar la Información Confidencial para beneficio propio o de terceros;
d) Adoptar todas las medidas razonables para proteger la Información Confidencial;
e) Notificar inmediatamente al REVELADOR cualquier divulgación no autorizada de la Información Confidencial.`,
};

