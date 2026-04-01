/**
 * Lease Clause: Canon Locativo y Forma de Pago
 */
import type { ClauseDefinition } from "../../domain/generation-engine.js";

export const leaseAmountClause: ClauseDefinition = {
  id: "canon_locativo",
  name: "Canon Locativo y Forma de Pago",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: CANON LOCATIVO Y FORMA DE PAGO

El canon locativo mensual se fija en la suma de {{RENT_AMOUNT}}, que el LOCATARIO abonará al LOCADOR los días {{DIA_PAGO}} de cada mes mediante {{PAYMENT_TERMS}}.

{{AJUSTE_CANON}}

MORA EN EL PAGO: El incumplimiento en el pago del canon locativo en los términos pactados devengará un interés punitorio equivalente al DOS POR CIENTO (2%) diario sobre el monto adeudado, desde el vencimiento hasta el efectivo pago, sin necesidad de interpelación judicial o extrajudicial alguna. Dicho interés punitorio opera de pleno derecho por el solo vencimiento del plazo.

PENALIDAD POR NO RESTITUCIÓN: En caso de que el LOCATARIO no restituya el inmueble a la fecha de vencimiento del contrato o de su rescisión, quedará obligado a abonar en concepto de daños y perjuicios preestablecidos la suma equivalente al DIEZ POR CIENTO (10%) del canon mensual vigente por cada día de demora en la restitución, sin perjuicio de las demás acciones que le asisten al LOCADOR.`,
};
