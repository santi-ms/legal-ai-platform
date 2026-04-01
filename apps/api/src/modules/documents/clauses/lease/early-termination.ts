/**
 * Lease Clause: Rescisión Anticipada y Causales de Resolución
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseEarlyTerminationClause: ClauseDefinition = {
  id: "rescision_anticipada_locacion",
  name: "Rescisión Anticipada y Causales de Resolución",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: RESCISIÓN ANTICIPADA Y CAUSALES DE RESOLUCIÓN

RESCISIÓN ANTICIPADA POR EL LOCATARIO: El LOCATARIO podrá resolver anticipadamente el presente contrato abonando al LOCADOR, en concepto de indemnización, el equivalente al DIEZ POR CIENTO (10%) del canon locativo adeudado por el plazo restante del contrato. No corresponderá indemnización alguna si el LOCATARIO notifica fehacientemente su voluntad de resolver el contrato con una anticipación mínima de TRES (3) meses y dicho preaviso opera durante el último año de vigencia del contrato, conforme lo establecido en el artículo 1.221 del Código Civil y Comercial de la Nación.

CAUSALES DE RESOLUCIÓN POR EL LOCADOR: Conforme lo establecido por el Decreto de Necesidad y Urgencia N° 70/2023, que modificó el artículo 1.219 del Código Civil y Comercial de la Nación, el LOCADOR podrá resolver el presente contrato cuando el LOCATARIO adeude el equivalente a UN (1) mes de canon locativo. La resolución operará de pleno derecho previa intimación fehaciente al deudor para que pague o cumpla, otorgándole un plazo de QUINCE (15) días corridos para regularizar su situación.

Asimismo, son causales de resolución del contrato: (a) el uso del inmueble para fines distintos al pactado; (b) la cesión o sublocación total o parcial no autorizada expresamente por escrito; (c) la realización de obras, reformas o modificaciones no autorizadas; (d) cualquier otro incumplimiento grave de las obligaciones del LOCATARIO que haga imposible la continuación del vínculo.`,
};
