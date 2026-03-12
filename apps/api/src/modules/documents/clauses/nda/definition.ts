/**
 * NDA Clause: Definition of Confidential Information
 */

import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const ndaDefinitionClause: ClauseDefinition = {
  id: "definicion_informacion",
  name: "Definición de Información Confidencial",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL

Se considera "Información Confidencial" toda aquella información, de cualquier naturaleza y en cualquier formato, que el REVELADOR comparta con el RECEPTOR, incluyendo pero no limitándose a:

{{DEFINITION}}

Queda expresamente excluida de la definición de Información Confidencial:

{{EXCLUSIONS}}

El RECEPTOR reconoce que la Información Confidencial es de carácter reservado y de gran valor para el REVELADOR.`,
};

