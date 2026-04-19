/**
 * Lease Clause: Rescisión Anticipada y Causales de Resolución
 *
 * Uses the exact CCCN art. 1221 formula (as amended by DNU 70/2023):
 * - After 6 months: 1.5 months' rent if in first year; 1 month if after first year.
 * - No hardcoded "10% del plazo restante" — that formula has no legal basis.
 * Resolution by locador follows art. 1219 CCCN + DNU 70/2023 (1 month owed → 15-day cure).
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseEarlyTerminationClause: ClauseDefinition = {
  id: "rescision_anticipada_locacion",
  name: "Rescisión Anticipada y Causales de Resolución",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}. CAUSALES DE RESOLUCIÓN:

1- El LOCADOR podrá resolver el presente «CONTRATO» cuando el LOCATARIO adeude el equivalente a UN (1) mes de canon locativo, previa intimación fehaciente otorgando un plazo de QUINCE (15) días corridos para regularizar la situación.

2- Son también causales de resolución imputable al LOCATARIO: a) el uso del inmueble para fines distintos al pactado; b) la cesión o sublocación no autorizada expresamente por escrito; c) la realización de obras o modificaciones no autorizadas; d) cualquier otro incumplimiento grave de las obligaciones contraídas en el presente «CONTRATO».

3- RESCISIÓN ANTICIPADA POR EL LOCATARIO: Transcurridos SEIS (6) meses de contrato, el LOCATARIO podrá resolverlo anticipadamente mediante notificación fehaciente al LOCADOR con una anticipación mínima de TREINTA (30) días corridos. Si ejerce esta opción dentro del primer año de vigencia, abonará en concepto de indemnización la suma equivalente a UN MES Y MEDIO (1,5) de alquiler vigente al momento de la desocupación. Si la resolución se produce transcurrido el primer año, la indemnización será de UN (1) mes de alquiler.`,
};
