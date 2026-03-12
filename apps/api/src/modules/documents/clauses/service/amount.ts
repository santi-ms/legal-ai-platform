/**
 * Service Contract Clause: Amount and Payment
 */

import type { ClauseDefinition } from "../../domain/generation-engine";

export const serviceAmountClause: ClauseDefinition = {
  id: "monto_pago",
  name: "Monto y Forma de Pago",
  category: "type_specific",
  required: true,
  content: `{{CLAUSE_NUMBER}}: MONTO Y FORMA DE PAGO

El CLIENTE se obliga a pagar al PROVEEDOR la suma de {{AMOUNT}} por concepto de prestación de servicios, con periodicidad {{PERIODICIDAD}}.

Forma de pago: {{PAYMENT_TERMS}}

{{TAX_INCLUSION}}

{{PRICE_ADJUSTMENT}}

El pago deberá realizarse dentro del plazo de {{PAYMENT_DEADLINE}} desde la emisión de la factura correspondiente.`,
};

