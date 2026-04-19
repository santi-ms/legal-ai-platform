/**
 * Lease Clause: Jurisdicción y Litigios
 *
 * Establishes the competent courts for any disputes arising from the lease.
 * Both parties waive their right to challenge the jurisdiction without cause.
 * Based on standard Argentine lease practice.
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseJurisdictionClause: ClauseDefinition = {
  id: "jurisdiccion_locacion",
  name: "Jurisdicción y Litigios",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}. JURISDICCIÓN Y LITIGIOS:

1- Para cualquier controversia o litigio que se suscite en razón del presente «CONTRATO», ambas partes y el FIADOR se someten a la competencia de los Tribunales Ordinarios en lo Civil y Comercial de {{JURISDICTION}}, con renuncia expresa a todo otro fuero o jurisdicción que pudiera corresponderles.

2- Los gastos provenientes del sellado de ley del presente «CONTRATO», así como las certificaciones de firmas y demás gastos de instrumentación, serán soportados por LAS PARTES en partes iguales.`,
};
