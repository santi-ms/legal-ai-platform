/**
 * Lease Clause: Fiador y Garante
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseGuarantorClause: ClauseDefinition = {
  id: "fiador_garante_locacion",
  name: "Fiador y Garante",
  category: "type_specific",
  required: false,
  content: `{{CLAUSE_NUMBER}}. FIANZA:

1- {{FIADOR_INFO}} se constituye en fiador, liso, llano y principal pagador del LOCATARIO, con renuncia expresa a los beneficios de excusión y división, garantizando el fiel cumplimiento de todas las obligaciones asumidas por el LOCATARIO en el presente «CONTRATO», incluyendo el pago del canon locativo, reparaciones, daños y perjuicios, y cualquier otra obligación emergente.

2- El FIADOR renuncia expresamente al beneficio de interpelación previa al LOCATARIO, pudiendo el LOCADOR reclamarle directamente el cumplimiento de las obligaciones garantizadas.

3- La garantía se extiende al período de uso indebido posterior al vencimiento y subsiste hasta la restitución efectiva del inmueble con conformidad del LOCADOR y la cancelación de todas las obligaciones emergentes.

4- Al vencimiento del plazo original del «CONTRATO», la garantía caducará salvo que el FIADOR suscriba expresamente cada acto de prórroga o renovación.`,
};
