/**
 * Lease Clause: Property (Objeto de la Locación)
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leasePropertyClause: ClauseDefinition = {
  id: "objeto_locacion",
  name: "Objeto de la Locación",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: OBJETO DE LA LOCACIÓN

El LOCADOR da en locación al LOCATARIO el siguiente bien:

Descripción: {{PROPERTY_DESC}}
Dirección: {{PROPERTY_ADDRESS}}
Destino de uso: {{PROPERTY_USE}}`,
};
