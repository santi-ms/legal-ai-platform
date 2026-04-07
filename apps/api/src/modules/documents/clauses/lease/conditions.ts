/**
 * Lease Clause: Depósito, Servicios y Rescisión
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseConditionsClause: ClauseDefinition = {
  id: "condiciones_locacion",
  name: "Condiciones Adicionales",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}. CONDICIONES ECONÓMICAS Y GASTOS:

1- DEPÓSITO EN GARANTÍA: {{DEPOSITO}}

2- GASTOS Y SERVICIOS: {{SERVICIOS_LOCATARIO}}

3- IMPUESTOS Y TASAS: Los tributos, contribuciones de mejoras e impuestos municipales que graven el inmueble locado seguirán a cargo del LOCADOR. Las expensas ordinarias y los servicios que contratare el LOCATARIO (electricidad, gas, agua, internet, telefonía, etc.) estarán a cargo exclusivo del LOCATARIO.

4- Todas las cargas a cargo del LOCATARIO subsistirán hasta la restitución efectiva del inmueble con conformidad del LOCADOR. El LOCATARIO entregará los comprobantes de pago junto con cada canon mensual.`,
};
