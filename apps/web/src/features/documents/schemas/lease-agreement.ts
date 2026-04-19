/**
 * Lease Agreement (Contrato de Locación) Document Schema
 *
 * Schema definition for "Contrato de Locación".
 * Covers residential, commercial, and general property/asset leases.
 */

import type { DocumentSchemaDefinition } from "../core/types";
import { registerDocumentSchema } from "../core/registry";
import { additionalClausesSection } from "./common-fields";

export const leaseAgreementSchema: DocumentSchemaDefinition = {
  id: "lease",
  label: "Contrato de Locación",
  description:
    "Contrato para regular el alquiler o locación de un inmueble, espacio o bien entre partes.",

  useCases: [
    "Alquiler de local comercial, oficina o consultorio",
    "Locación de inmueble o espacio con plazo y condiciones definidas",
    "Alquiler de vivienda o departamento",
    "Locación de equipos o bienes muebles",
  ],

  noUseCases: [
    "Contratos de servicios (usar Contrato de Servicios)",
    "Transferencia de propiedad (usar otro instrumento)",
    "Comodato o préstamo sin contraprestación",
  ],

  jurisdictionSupport: [
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
          helpText: "Jurisdicción donde se ubica el bien y será competente el fuero",
          options: [
            { value: "corrientes_capital", label: "Corrientes Capital" },
            { value: "posadas_misiones", label: "Posadas, Misiones" },
          ],
        },
      ],
    },
    {
      id: "parties",
      title: "Datos de las Partes",
      description: "Información completa del locador y del locatario",
      order: 2,
      fields: [
        {
          id: "locador_nombre",
          label: "Nombre / Razón Social del Locador",
          type: "text",
          required: true,
          placeholder: "Ej: Juan García",
          helpText: "Propietario o titular del bien que se da en locación",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "locador_doc",
          label: "CUIT / DNI del Locador",
          type: "cuit",
          required: true,
          placeholder: "Ej: 20-12345678-9",
        },
        {
          id: "locador_domicilio",
          label: "Domicilio del Locador",
          type: "address",
          required: true,
          placeholder: "Ej: San Martín 123, Córdoba Capital",
          validation: { minLength: 10, maxLength: 300 },
        },
        {
          id: "locatario_nombre",
          label: "Nombre / Razón Social del Locatario",
          type: "text",
          required: true,
          placeholder: "Ej: Comercial López SRL",
          helpText: "Quien toma en locación el bien",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "locatario_doc",
          label: "CUIT / DNI del Locatario",
          type: "cuit",
          required: true,
          placeholder: "Ej: 30-99999999-7",
        },
        {
          id: "locatario_domicilio",
          label: "Domicilio del Locatario",
          type: "address",
          required: true,
          placeholder: "Ej: Av. Costanera 500, Posadas, Misiones",
          validation: { minLength: 10, maxLength: 300 },
        },
      ],
    },
    {
      id: "property",
      title: "Objeto de la Locación",
      description: "Descripción y características del bien que se arrienda",
      order: 3,
      fields: [
        {
          id: "descripcion_inmueble",
          label: "Descripción del Bien / Inmueble",
          type: "textarea",
          required: true,
          placeholder: "Ej: Local comercial de 80 m², planta baja, con salón principal y baño, ubicado en el primer piso del edificio...",
          helpText: "Describí el bien con suficiente detalle para identificarlo claramente",
          validation: { minLength: 15, maxLength: 1000 },
        },
        {
          id: "domicilio_inmueble",
          label: "Dirección / Ubicación del Bien",
          type: "address",
          required: true,
          placeholder: "Ej: Av. Corrientes 1234, Piso 2, CABA",
        },
        {
          id: "destino_uso",
          label: "Destino de Uso",
          type: "select",
          required: true,
          helpText: "Finalidad para la que se arrienda el bien",
          options: [
            { value: "vivienda", label: "Vivienda familiar" },
            { value: "comercial", label: "Local / comercio" },
            { value: "oficina", label: "Oficina / consultorio" },
            { value: "deposito", label: "Depósito / galpón" },
            { value: "otro", label: "Otro uso permitido" },
          ],
        },
      ],
    },
    {
      id: "economic_terms",
      title: "Condiciones Económicas",
      description: "Canon locativo, moneda y forma de pago",
      order: 4,
      fields: [
        {
          id: "monto_alquiler",
          label: "Canon Locativo (Alquiler Mensual)",
          type: "currency",
          required: true,
          placeholder: "Ej: 250000",
          helpText: "Monto del alquiler mensual (sin símbolos ni comas)",
          validation: { min: 0 },
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
          id: "dia_pago",
          label: "Día de Pago (del mes)",
          type: "select",
          required: true,
          helpText: "Día del mes en que vence el pago",
          options: [
            { value: "1", label: "Día 1" },
            { value: "5", label: "Día 5" },
            { value: "10", label: "Día 10" },
            { value: "15", label: "Día 15" },
          ],
        },
        {
          id: "ajuste_precio",
          label: "Índice de Ajuste del Canon",
          type: "select",
          required: false,
          helpText: "Opcional: índice que se usará para actualizar el alquiler",
          options: [
            { value: "ninguno", label: "Sin ajuste" },
            { value: "icl", label: "ICL - Índice Casa Propia (BCRA)" },
            { value: "ipc", label: "IPC - Índice de Precios al Consumidor (INDEC)" },
            { value: "ipcba", label: "IPC-BA - Índice CABA (DGEyC)" },
            { value: "ripte", label: "RIPTE (remuneraciones)" },
            { value: "acuerdo", label: "Por acuerdo entre partes" },
          ],
        },
        {
          id: "ajuste_periodo",
          label: "Periodicidad del Ajuste",
          type: "select",
          required: false,
          visibleWhen: ["ajuste_precio"],
          helpText: "Con qué frecuencia se aplica el ajuste",
          options: [
            { value: "trimestral", label: "Trimestral (cada 3 meses)" },
            { value: "cuatrimestral", label: "Cuatrimestral (cada 4 meses)" },
            { value: "semestral", label: "Semestral (cada 6 meses)" },
            { value: "anual", label: "Anual" },
          ],
        },
        {
          id: "cbu_locador",
          label: "CBU / Alias de la cuenta del Locador",
          type: "text",
          required: false,
          helpText: "Opcional: CBU o alias al que el locatario debe transferir el canon",
          placeholder: "Ej: 0720169720000004512893 o nombre.apellido.banco",
        },
      ],
    },
    {
      id: "term",
      title: "Plazo del Contrato",
      description: "Fecha de inicio y duración de la locación",
      order: 5,
      fields: [
        {
          id: "fecha_inicio",
          label: "Fecha de Inicio",
          type: "date",
          required: true,
          helpText: "Fecha desde la cual el locatario toma posesión del bien",
        },
        {
          id: "duracion_meses",
          label: "Duración del Contrato (meses)",
          type: "number",
          required: true,
          helpText: "Duración total del contrato en meses",
          validation: { min: 1, max: 120 },
        },
        {
          id: "renovacion_automatica",
          label: "Renovación Automática",
          type: "switch",
          required: false,
          helpText: "El contrato se renueva automáticamente al vencer el plazo",
        },
      ],
    },
    {
      id: "conditions",
      title: "Condiciones Adicionales",
      description: "Depósito, servicios y condiciones de rescisión",
      order: 6,
      fields: [
        {
          id: "deposito",
          label: "Incluir depósito de garantía",
          type: "switch",
          required: false,
          helpText: "¿Se establece un depósito de garantía?",
        },
        {
          id: "deposito_meses",
          label: "Meses de Depósito",
          type: "number",
          required: false,
          visibleWhen: ["deposito"],
          helpText: "Cantidad de meses de alquiler como depósito",
          validation: { min: 1, max: 6 },
        },
        {
          id: "servicios_cargo_locatario",
          label: "Servicios a cargo del Locatario",
          type: "textarea",
          required: false,
          placeholder: "Ej: Electricidad, gas, internet, expensas ordinarias...",
          helpText: "Opcional: detallá qué servicios paga el locatario",
          validation: { maxLength: 500 },
        },
        {
          id: "impuestos_cargo_locador",
          label: "Impuestos/tasas a cargo del Locador",
          type: "text",
          required: false,
          helpText: "Opcional: impuestos extraordinarios, tasa inmobiliaria, etc.",
          placeholder: "Ej: Impuestos extraordinarios y tasa inmobiliaria",
        },
        {
          id: "preaviso_rescision",
          label: "Preaviso para Rescisión (días)",
          type: "number",
          required: false,
          helpText: "Días de anticipación para rescisión anticipada",
          validation: { min: 0, max: 365 },
        },
      ],
    },
    {
      id: "property_state",
      title: "Estado del Inmueble e Inventario",
      description: "Condición actual del inmueble y bienes incluidos",
      order: 7,
      fields: [
        {
          id: "estado_inmueble",
          label: "Estado del Inmueble",
          type: "textarea",
          required: false,
          helpText: "Descripción del estado actual del inmueble al momento de la entrega",
          placeholder: "Ej: Buen estado general, recién pintado, instalaciones funcionando correctamente",
          validation: { maxLength: 500 },
        },
        {
          id: "inventario",
          label: "Inventario incluido",
          type: "textarea",
          required: false,
          helpText: "Bienes muebles o equipos que se entregan con el inmueble",
          placeholder: "Ej: 2 juegos de llaves, calefón, cocina con horno, extractor",
          validation: { maxLength: 500 },
        },
        {
          id: "restricciones_uso",
          label: "Restricciones de uso específicas",
          type: "textarea",
          required: false,
          helpText: "Restricciones particulares pactadas (mascotas, modificaciones, uso comercial, etc.)",
          placeholder: "Ej: Se permite una mascota pequeña. Prohibido uso comercial o profesional.",
          validation: { maxLength: 500 },
        },
      ],
    },
    {
      id: "guarantor",
      title: "Fiador / Garante",
      description: "Datos del fiador si corresponde",
      order: 8,
      fields: [
        {
          id: "tiene_fiador",
          label: "Incluir fiador",
          type: "switch",
          required: false,
          helpText: "¿El contrato incluye fiador solidario?",
        },
        {
          id: "fiador_nombre",
          label: "Nombre completo del Fiador",
          type: "text",
          required: false,
          visibleWhen: ["tiene_fiador"],
          placeholder: "Ej: Pablo Esteban Ledesma",
        },
        {
          id: "fiador_doc",
          label: "DNI / CUIT del Fiador",
          type: "text",
          required: false,
          visibleWhen: ["tiene_fiador"],
          placeholder: "Ej: 20-27663114-2",
        },
        {
          id: "fiador_domicilio",
          label: "Domicilio del Fiador",
          type: "text",
          required: false,
          visibleWhen: ["tiene_fiador"],
          placeholder: "Ej: Bv. San Juan 935, Córdoba Capital",
        },
      ],
    },
    additionalClausesSection,
  ],

  semanticValidations: [
    {
      id: "duracion_minima",
      name: "Duración mínima",
      description: "La duración del contrato debe ser al menos 1 mes",
      check: (data) => {
        const meses = Number(data.duracion_meses) || 0;
        if (meses < 1) {
          return "La duración del contrato debe ser de al menos 1 mes";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "deposito_requiere_meses",
      name: "Depósito requiere cantidad de meses",
      description: "Si se activa depósito, debe especificarse cuántos meses",
      check: (data) => {
        if (data.deposito && !data.deposito_meses) {
          return "Si incluís depósito de garantía, especificá la cantidad de meses";
        }
        return true;
      },
      severity: "error",
    },
  ],

  warningRules: [
    {
      id: "sin_ajuste_precio",
      name: "Sin mecanismo de ajuste definido",
      description: "Para contratos largos se recomienda definir ajuste",
      check: (data) => {
        const meses = Number(data.duracion_meses) || 0;
        return meses >= 12 && (!data.ajuste_precio || data.ajuste_precio === "ninguno");
      },
      message: "Para contratos de 12 meses o más, se recomienda definir un mecanismo de ajuste del canon.",
      suggestion: "Considerá incluir el ICL del BCRA o el IPC para proteger el valor real del alquiler.",
    },
    {
      id: "sin_deposito",
      name: "Sin depósito de garantía",
      description: "No se estableció depósito de garantía",
      check: (data) => !data.deposito,
      message: "No se estableció un depósito de garantía. Es una protección habitual en contratos de locación.",
      suggestion: "Considerá incluir un depósito de 1 a 2 meses como garantía.",
    },
  ],

  requiredClauses: [
    {
      id: "identificacion_partes",
      name: "Identificación de Partes",
      description: "Datos completos de locador y locatario",
      category: "common",
    },
    {
      id: "objeto_locacion",
      name: "Objeto de la Locación",
      description: "Descripción y ubicación del bien arrendado",
      category: "type_specific",
    },
    {
      id: "canon_locativo",
      name: "Canon y Forma de Pago",
      description: "Monto, moneda y periodicidad del pago",
      category: "type_specific",
    },
    {
      id: "plazo_contrato",
      name: "Plazo del Contrato",
      description: "Duración y fecha de inicio",
      category: "type_specific",
    },
    {
      id: "obligaciones_partes",
      name: "Obligaciones de las Partes",
      description: "Derechos y obligaciones de locador y locatario",
      category: "type_specific",
    },
    {
      id: "foro_competencia",
      name: "Foro de Competencia",
      description: "Jurisdicción competente para resolver disputas",
      category: "common",
    },
  ],

  optionalClauses: [
    {
      id: "deposito_garantia",
      name: "Depósito de Garantía",
      description: "Monto y condiciones de devolución del depósito",
      condition: (data) => Boolean(data.deposito),
      category: "type_specific",
    },
    {
      id: "ajuste_canon",
      name: "Ajuste del Canon",
      description: "Mecanismo de actualización del valor del alquiler",
      condition: (data) => Boolean(data.ajuste_precio && data.ajuste_precio !== "ninguno"),
      category: "type_specific",
    },
    {
      id: "renovacion_automatica",
      name: "Renovación Automática",
      description: "Condiciones de renovación al vencer el plazo",
      condition: (data) => Boolean(data.renovacion_automatica),
      category: "type_specific",
    },
  ],

  promptConfig: {
    systemMessage:
      "Eres un abogado senior argentino especializado en derecho inmobiliario y contratos de locación. Generás contratos de locación válidos y completos según la normativa argentina vigente, incluyendo la Ley 27.551 de Alquileres y el Código Civil y Comercial.",

    baseInstructions: [
      "El contrato debe ser legalmente válido según la Ley 27.551 y el Código Civil y Comercial argentino",
      "Usar los datos concretos proporcionados (montos, fechas, domicilios, plazos)",
      "Incluir todas las cláusulas obligatorias para contratos de locación en Argentina",
      "Estructura: encabezado con identificación completa de partes, luego cláusulas numeradas (PRIMERA, SEGUNDA, etc.)",
      "Si se incluye 'additionalClauses', incorporarlas como cláusulas adicionales con el número correlativo correspondiente, respetando su contenido y redactándolas en tono legal coherente con el resto del documento",
    ],

    toneInstructions: {
      formal_technical: "Formal y técnico legal. Terminología jurídica precisa según Código Civil y Comercial.",
      commercial_clear: "Comercial y claro. Lenguaje entendible para personas sin formación jurídica.",
      balanced_professional: "Balanceado: profesional pero accesible, con terminología correcta.",
    },

    requiredClausesInstructions: [
      "Identificación completa de locador y locatario con CUIT/DNI y domicilios",
      "Descripción detallada del objeto de la locación y su ubicación",
      "Destino de uso del inmueble",
      "Monto del canon locativo, moneda y forma de pago",
      "Plazo del contrato y fecha de inicio",
      "Obligaciones del locador y del locatario",
      "Mecanismo de ajuste del canon (si corresponde)",
      "Condiciones de rescisión anticipada y preaviso",
      "Depósito de garantía (si se estableció)",
      "Foro de competencia en la jurisdicción especificada",
    ],

    formatInstructions:
      "SOLO el texto del contrato legal. SIN explicaciones ni comentarios. Numeración en mayúsculas (PRIMERA, SEGUNDA, etc.). Sección final para FIRMAS: Firma y aclaración del Locador, Firma y aclaración del Locatario, Lugar y fecha.",
  },

  templateConfig: {
    templateId: "lease_agreement_v1",
    version: "1.0.0",
    variablePlaceholders: [
      "{{PARTIES}}",
      "{{PROPERTY}}",
      "{{USE}}",
      "{{CANON}}",
      "{{TERM}}",
      "{{DEPOSIT}}",
      "{{SERVICES}}",
      "{{TERMINATION}}",
      "{{JURISDICTION}}",
    ],
    clauseSlots: [
      "{{CLAUSE_IDENTIFICATION}}",
      "{{CLAUSE_PROPERTY}}",
      "{{CLAUSE_CANON}}",
      "{{CLAUSE_TERM}}",
      "{{CLAUSE_DEPOSIT}}",
      "{{CLAUSE_OBLIGATIONS}}",
      "{{CLAUSE_TERMINATION}}",
      "{{CLAUSE_JURISDICTION}}",
    ],
  },
};

registerDocumentSchema(leaseAgreementSchema);



