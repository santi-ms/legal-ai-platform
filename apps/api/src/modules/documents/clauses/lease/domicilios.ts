/**
 * Lease Clause: Constitución de Domicilios
 *
 * Both parties and guarantor (if applicable) establish special domiciles
 * for the purpose of all notices, judicial and extrajudicial communications.
 * Based on standard Argentine lease practice.
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseDomiciliosClause: ClauseDefinition = {
  id: "domicilios_locacion",
  name: "Constitución de Domicilios",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}. CONSTITUCIÓN DE DOMICILIOS:

1- Las partes constituyen domicilios especiales en los individualizados al inicio del presente «CONTRATO», donde serán válidas y plenamente eficaces todas las notificaciones, intimaciones y comunicaciones, sean judiciales o extrajudiciales, derivadas del presente «CONTRATO».

2- LAS PARTES declaran que todos los actos entre ellas únicamente se perfeccionarán por mutuo consentimiento expresado por escrito, sea éste físico o digital en los medios electrónicos indicados, quedando vedadas las prórrogas y modificaciones verbales o de hecho.`,
};
