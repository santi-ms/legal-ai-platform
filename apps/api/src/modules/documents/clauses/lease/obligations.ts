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
  content: `{{CLAUSE_NUMBER}}: OBLIGACIONES DEL LOCATARIO

El LOCATARIO se obliga a: (a) destinar el inmueble exclusivamente al uso pactado; (b) no subalquilar, ceder ni transferir el contrato sin autorización escrita del LOCADOR; (c) mantener el inmueble en buen estado de conservación y realizar las reparaciones locativas a su cargo; (d) no efectuar modificaciones ni obras sin autorización escrita previa del LOCADOR.

{{RESTRICCIONES_ADICIONALES}}`,
};
