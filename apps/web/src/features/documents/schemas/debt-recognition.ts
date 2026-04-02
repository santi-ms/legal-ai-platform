/**
 * Debt Recognition (Reconocimiento de Deuda) Document Schema
 *
 * Schema definition for "Reconocimiento de Deuda".
 * Covers formal acknowledgment of an existing debt, with or without a payment plan.
 */

import type { DocumentSchemaDefinition } from "../core/types";
import { registerDocumentSchema } from "../core/registry";
import { additionalClausesSection } from "./common-fields";

export const debtRecognitionSchema: DocumentSchemaDefinition = {
  id: "debt_recognition",
  label: "Reconocimiento de Deuda",
  description:
    "Documento para dejar constancia de una deuda existente y, si corresponde, establecer un plan de pagos.",

  useCases: [
    "Reconocimiento formal de una suma adeudada",
    "Acuerdo de pago en cuotas o con vencimientos definidos",
    "Formalización de una deuda preexistente entre partes",
    "Instrumento ejecutivo ante incumplimiento de pago",
  ],

  noUseCases: [
    "Contratos de servicios nuevos (usar Contrato de Servicios)",
    "Garantías reales sobre bienes (usar instrumento específico)",
    "Contratos de mutuo con desembolso de dinero nuevo",
  ],

  jurisdictionSupport: [
    "caba",
    "buenos_aires",
    "cordoba",
    "santa_fe",
    "mendoza",
    "corrientes_capital",
    "posadas_misiones",
  ],

  sections: [
    {
      id: "legal_config",
      title: "Configuración Legal",
      description: "Configuración básica del documento",
      order: 1,
      fields: [
        {
          id: "jurisdiccion",
          label: "Jurisdicción",
          type: "select",
          required: true,
          helpText: "Jurisdicción donde se celebra el reconocimiento y será competente el fuero",
          options: [
            { value: "caba", label: "Ciudad Autónoma de Buenos Aires" },
            { value: "buenos_aires", label: "Buenos Aires" },
            { value: "cordoba", label: "Córdoba" },
            { value: "santa_fe", label: "Santa Fe" },
            { value: "mendoza", label: "Mendoza" },
            { value: "corrientes_capital", label: "Corrientes Capital" },
            { value: "posadas_misiones", label: "Posadas, Misiones" },
          ],
        },
      ],
    },
    {
      id: "parties",
      title: "Datos de las Partes",
      description: "Información completa del acreedor y del deudor",
      order: 2,
      fields: [
        {
          id: "acreedor_nombre",
          label: "Nombre / Razón Social del Acreedor",
          type: "text",
          required: true,
          placeholder: "Ej: Empresa Proveedora SRL",
          helpText: "Quien es titular del crédito",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "acreedor_doc",
          label: "CUIT / DNI del Acreedor",
          type: "cuit",
          required: true,
          placeholder: "Ej: 20-12345678-9",
        },
        {
          id: "acreedor_domicilio",
          label: "Domicilio del Acreedor",
          type: "address",
          required: true,
          placeholder: "Ej: San Martín 123, Córdoba Capital",
          validation: { minLength: 10, maxLength: 300 },
        },
        {
          id: "deudor_nombre",
          label: "Nombre / Razón Social del Deudor",
          type: "text",
          required: true,
          placeholder: "Ej: Juan García",
          helpText: "Quien reconoce y asume la deuda",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "deudor_doc",
          label: "CUIT / DNI del Deudor",
          type: "cuit",
          required: true,
          placeholder: "Ej: 30-99999999-7",
        },
        {
          id: "deudor_domicilio",
          label: "Domicilio del Deudor",
          type: "address",
          required: true,
          placeholder: "Ej: Av. Costanera 500, Posadas, Misiones",
          validation: { minLength: 10, maxLength: 300 },
        },
      ],
    },
    {
      id: "debt_details",
      title: "Datos de la Deuda",
      description: "Monto, origen y fecha del reconocimiento",
      order: 3,
      fields: [
        {
          id: "monto_deuda",
          label: "Monto Total de la Deuda",
          type: "currency",
          required: true,
          placeholder: "Ej: 500000",
          helpText: "Importe total reconocido como adeudado (sin símbolos ni comas)",
          validation: { min: 1 },
        },
        {
          id: "moneda",
          label: "Moneda",
          type: "select",
          required: true,
          options: [
            { value: "ARS", label: "Pesos Argentinos (ARS)" },
            { value: "USD", label: "Dólares Estadounidenses (USD)" },
          ],
        },
        {
          id: "causa_deuda",
          label: "Origen o Causa de la Deuda",
          type: "textarea",
          required: true,
          placeholder: "Ej: Saldo impago de factura N° 0001-00000123 por servicios de mantenimiento prestados en enero 2024...",
          helpText: "Describí el origen o causa que generó la deuda reconocida",
          validation: { minLength: 20, maxLength: 1000 },
        },
        {
          id: "fecha_reconocimiento",
          label: "Fecha de Reconocimiento",
          type: "date",
          required: true,
          helpText: "Fecha en que se suscribe este reconocimiento",
        },
      ],
    },
    {
      id: "payment",
      title: "Forma de Pago",
      description: "Modalidad de cancelación de la deuda",
      order: 4,
      fields: [
        {
          id: "pago_en_cuotas",
          label: "Pago en cuotas",
          type: "switch",
          required: false,
          helpText: "Activá si la deuda se cancelará en cuotas. Si no, se entenderá como pago único.",
        },
        {
          id: "cantidad_cuotas",
          label: "Cantidad de Cuotas",
          type: "number",
          required: false,
          visibleWhen: ["pago_en_cuotas"],
          helpText: "Número de cuotas pactadas",
          validation: { min: 2, max: 120 },
        },
        {
          id: "monto_cuota",
          label: "Monto por Cuota",
          type: "currency",
          required: false,
          visibleWhen: ["pago_en_cuotas"],
          placeholder: "Ej: 50000",
          helpText: "Importe de cada cuota",
        },
        {
          id: "fecha_primer_vencimiento",
          label: "Fecha del Primer Vencimiento",
          type: "date",
          required: true,
          helpText: "Fecha de pago del primer vencimiento (o del pago único)",
        },
        {
          id: "forma_pago",
          label: "Forma de Pago",
          type: "select",
          required: true,
          options: [
            { value: "transferencia_bancaria", label: "Transferencia Bancaria" },
            { value: "efectivo", label: "Efectivo" },
            { value: "cheque", label: "Cheque" },
            { value: "mercado_pago", label: "Mercado Pago" },
            { value: "otro", label: "Otro" },
          ],
        },
        {
          id: "incluye_intereses",
          label: "Incluir intereses",
          type: "switch",
          required: false,
          helpText: "¿Se pactan intereses sobre el monto adeudado?",
        },
        {
          id: "tasa_interes",
          label: "Tasa de Interés",
          type: "text",
          required: false,
          visibleWhen: ["incluye_intereses"],
          placeholder: "Ej: 3% mensual, o tasa pasiva del BCRA",
          helpText: "Especificá el tipo y tasa de interés acordada",
        },
      ],
    },
    {
      id: "default",
      title: "Incumplimiento",
      description: "Consecuencias ante la falta de pago",
      order: 5,
      fields: [
        {
          id: "clausula_aceleracion",
          label: "Incluir cláusula de aceleración",
          type: "switch",
          required: false,
          helpText: "Al incumplir una cuota, el total adeudado se vuelve exigible de inmediato",
        },
        {
          id: "consecuencias_mora",
          label: "Consecuencias por mora",
          type: "textarea",
          required: false,
          placeholder: "Ej: Interés punitorio del 5% mensual sobre el saldo impago, más los gastos de cobranza...",
          helpText: "Opcional: describí las consecuencias específicas por incumplimiento en el pago",
          validation: { maxLength: 500 },
        },
      ],
    },
    additionalClausesSection,
  ],

  semanticValidations: [
    {
      id: "monto_requerido",
      name: "Monto de la deuda requerido",
      description: "Debe especificarse el monto total reconocido",
      check: (data) => {
        if (!data.monto_deuda || Number(data.monto_deuda) <= 0) {
          return "Debes especificar el monto total de la deuda reconocida";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "causa_requerida",
      name: "Causa de la deuda requerida",
      description: "Debe describirse el origen de la deuda",
      check: (data) => {
        if (!data.causa_deuda || String(data.causa_deuda).length < 20) {
          return "Debes describir el origen o causa de la deuda (mínimo 20 caracteres)";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "cuotas_requieren_monto",
      name: "Plan de cuotas requiere monto por cuota",
      description: "Si se paga en cuotas, debe especificarse el monto por cuota",
      check: (data) => {
        if (data.pago_en_cuotas && (!data.monto_cuota || Number(data.monto_cuota) <= 0)) {
          return "Si el pago es en cuotas, debés especificar el monto de cada cuota";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "interes_requiere_tasa",
      name: "Intereses requieren tasa especificada",
      description: "Si se incluyen intereses, debe indicarse la tasa",
      check: (data) => {
        if (data.incluye_intereses && !data.tasa_interes) {
          return "Si incluís intereses, debés especificar la tasa acordada";
        }
        return true;
      },
      severity: "error",
    },
  ],

  warningRules: [
    {
      id: "sin_intereses",
      name: "Sin intereses especificados",
      description: "No se establecieron intereses sobre la deuda",
      check: (data) => !data.incluye_intereses,
      message: "No se establecieron intereses sobre el monto adeudado.",
      suggestion: "Considerá incluir una tasa de interés para mantener el valor real del crédito.",
    },
    {
      id: "cuotas_sin_aceleracion",
      name: "Pago en cuotas sin cláusula de aceleración",
      description: "No se definió aceleración para el plan de cuotas",
      check: (data) => Boolean(data.pago_en_cuotas) && !data.clausula_aceleracion,
      message: "No se incluyó cláusula de aceleración en el plan de cuotas.",
      suggestion: "La cláusula de aceleración es recomendable: permite exigir el total ante la falta de pago de una cuota.",
    },
  ],

  requiredClauses: [
    {
      id: "identificacion_partes",
      name: "Identificación de Partes",
      description: "Datos completos de acreedor y deudor",
      category: "common",
    },
    {
      id: "reconocimiento_deuda",
      name: "Reconocimiento de la Deuda",
      description: "Declaración formal del deudor reconociendo la deuda",
      category: "type_specific",
    },
    {
      id: "monto_causa",
      name: "Monto y Causa",
      description: "Importe total y origen de la deuda",
      category: "type_specific",
    },
    {
      id: "forma_pago",
      name: "Forma y Plan de Pago",
      description: "Modalidad de cancelación (único o cuotas)",
      category: "type_specific",
    },
    {
      id: "foro_competencia",
      name: "Foro de Competencia",
      description: "Jurisdicción competente",
      category: "common",
    },
  ],

  optionalClauses: [
    {
      id: "plan_cuotas",
      name: "Plan de Cuotas",
      description: "Detalle de cuotas, vencimientos y montos",
      condition: (data) => Boolean(data.pago_en_cuotas),
      category: "type_specific",
    },
    {
      id: "intereses",
      name: "Intereses",
      description: "Tasa y modalidad de intereses pactados",
      condition: (data) => Boolean(data.incluye_intereses),
      category: "type_specific",
    },
    {
      id: "clausula_aceleracion",
      name: "Cláusula de Aceleración",
      description: "Exigibilidad total ante incumplimiento parcial",
      condition: (data) => Boolean(data.clausula_aceleracion),
      category: "type_specific",
    },
    {
      id: "mora",
      name: "Mora e Incumplimiento",
      description: "Consecuencias por falta de pago",
      condition: (data) => Boolean(data.consecuencias_mora),
      category: "type_specific",
    },
  ],

  promptConfig: {
    systemMessage:
      "Eres un abogado senior argentino especializado en derecho contractual y cobro de créditos. Generás instrumentos de reconocimiento de deuda válidos y ejecutables según el Código Civil y Comercial argentino.",

    baseInstructions: [
      "El documento debe ser legalmente válido y ejecutable en Argentina",
      "Usar los datos concretos proporcionados (montos, fechas, domicilios)",
      "El deudor debe reconocer expresamente la deuda en forma clara e inequívoca",
      "Estructura: encabezado con identificación completa, reconocimiento expreso, plan de pago, consecuencias, firmas",
      "Si se incluye 'additionalClauses', incorporarlas como cláusulas adicionales numeradas, redactadas en tono legal coherente con el resto del documento",
    ],

    toneInstructions: {
      formal_technical: "Formal y técnico legal. Terminología jurídica precisa, con referencias al Código Civil y Comercial.",
      commercial_clear: "Comercial y claro. Lenguaje entendible sin sacrificar ejecutabilidad.",
      balanced_professional: "Balanceado: profesional pero accesible.",
    },

    requiredClausesInstructions: [
      "Identificación completa de acreedor y deudor con CUIT/DNI y domicilios",
      "Reconocimiento expreso e irrevocable de la deuda por el deudor",
      "Monto total reconocido, moneda y origen/causa de la deuda",
      "Fecha del reconocimiento",
      "Plan de pago: fechas, montos y forma (único o cuotas)",
      "Intereses (si se pactaron)",
      "Consecuencias por mora o incumplimiento",
      "Cláusula de aceleración (si se incluyó)",
      "Foro de competencia en la jurisdicción especificada",
    ],

    formatInstructions:
      "SOLO el texto del reconocimiento de deuda. SIN explicaciones ni comentarios. Numeración de cláusulas en mayúsculas (PRIMERA, SEGUNDA, etc.). Sección final para FIRMAS: Firma y aclaración del Acreedor, Firma y aclaración del Deudor, Lugar y fecha.",
  },

  templateConfig: {
    templateId: "debt_recognition_v1",
    version: "1.0.0",
    variablePlaceholders: [
      "{{PARTIES}}",
      "{{DEBT_DETAILS}}",
      "{{PAYMENT_PLAN}}",
      "{{INTEREST}}",
      "{{DEFAULT}}",
      "{{JURISDICTION}}",
    ],
    clauseSlots: [
      "{{CLAUSE_IDENTIFICATION}}",
      "{{CLAUSE_RECOGNITION}}",
      "{{CLAUSE_AMOUNT}}",
      "{{CLAUSE_PAYMENT}}",
      "{{CLAUSE_INTEREST}}",
      "{{CLAUSE_DEFAULT}}",
      "{{CLAUSE_JURISDICTION}}",
    ],
  },
};

registerDocumentSchema(debtRecognitionSchema);



