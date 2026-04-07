/**
 * Lease Clause: Obligaciones Especiales del Locatario
 *
 * This clause contains ONLY the minimal universal obligations.
 * User-specific restrictions (pets, modifications, etc.) are passed
 * via the data context and the AI will include them as stated.
 * NO hardcoded pet bans, appliance restrictions, or inspection rights.
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseObligationsClause: ClauseDefinition = {
  id: "obligaciones_especiales_locacion",
  name: "Obligaciones Especiales del Locatario",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}. OBLIGACIONES DEL LOCATARIO:

1- El LOCATARIO se obliga especialmente a:
a) Destinar el inmueble exclusivamente al uso pactado.
b) No subalquilar, ceder ni transferir el contrato sin autorización escrita del LOCADOR.
c) Mantener el inmueble en buen estado de conservación; las reparaciones locativas de mero mantenimiento serán exclusivamente a su cargo, sin derecho a reembolso.
d) No efectuar modificaciones, reformas ni mejoras sin autorización escrita previa del LOCADOR. Las realizadas sin autorización quedarán en beneficio del inmueble sin indemnización y facultarán al LOCADOR a resolver el contrato.
e) Devolver el inmueble al vencimiento desocupado, limpio y en el mismo estado en que lo recibió.

2- {{RESTRICCIONES_ADICIONALES}}`,
};
