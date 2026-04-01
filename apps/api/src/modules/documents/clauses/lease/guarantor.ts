/**
 * Lease Clause: Fiador y Garante
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseGuarantorClause: ClauseDefinition = {
  id: "fiador_garante_locacion",
  name: "Fiador y Garante",
  category: "type_specific",
  required: false,
  content: `{{CLAUSE_NUMBER}}: FIADOR Y GARANTE

{{FIADOR_INFO}}

El FIADOR declara constituirse en fiador, liso, llano y principal pagador del LOCATARIO, con renuncia expresa a los beneficios de excusión y división, garantizando el fiel cumplimiento de todas las obligaciones asumidas por el LOCATARIO en el presente contrato, incluyendo el pago del canon locativo, reparaciones, daños y perjuicios, y cualquier otra obligación que surja del mismo.

El FIADOR renuncia expresamente al beneficio de interpelación previa al LOCATARIO, pudiendo el LOCADOR reclamarle directamente el cumplimiento de las obligaciones garantizadas.

La garantía subsistirá hasta la restitución efectiva del inmueble y la cancelación de todas las obligaciones emergentes del presente contrato.`,
};
