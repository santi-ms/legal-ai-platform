/**
 * Lease Clause: Property (Objeto de la Locación)
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leasePropertyClause: ClauseDefinition = {
  id: "objeto_locacion",
  name: "Objeto de la Locación",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}. OBJETO DE LA LOCACIÓN:

1- El LOCADOR entrega en locación al LOCATARIO el inmueble ubicado en {{PROPERTY_ADDRESS}}, con destino de uso: {{PROPERTY_USE}}.

2- Descripción del bien: {{PROPERTY_DESC}}.

3- El LOCATARIO toma posesión del inmueble en las condiciones descriptas y se compromete a restituirlo al vencimiento del contrato en idéntico estado de conservación, salvo el deterioro propio del uso normal y el transcurso del tiempo.`,
};
