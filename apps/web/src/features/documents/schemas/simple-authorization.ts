/**
 * Simple Authorization (Poder / Autorización Simple) Document Schema
 *
 * Schema definition for "Poder / Autorización Simple".
 * Covers limited-scope authorizations for specific acts or procedures.
 */

import type { DocumentSchemaDefinition } from "../core/types";
import { registerDocumentSchema } from "../core/registry";
import { additionalClausesSection } from "./common-fields";

export const simpleAuthorizationSchema: DocumentSchemaDefinition = {
  id: "simple_authorization",
  label: "Poder / Autorización",
  description:
    "Documento para autorizar a otra persona a realizar una gestión, trámite o actuación específica.",

  useCases: [
    "Autorización para realizar trámites o gestiones puntuales",
    "Representación limitada para un acto determinado",
    "Poder para cobro, firma o retiro de documentación",
    "Autorización para gestiones ante organismos públicos",
  ],

  noUseCases: [
    "Poder general amplio o poder notarial (requiere escritura pública)",
    "Representación societaria permanente",
    "Poderes con alcance irrevocable o de disposición de bienes inmuebles",
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
          helpText: "Jurisdicción donde se otorga la autorización y será competente el fuero",
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
        {
          id: "tono",
          label: "Tono del Documento",
          type: "select",
          required: true,
          helpText: "Estilo de redacción del documento",
          options: [
            { value: "formal_technical", label: "Formal y técnico legal" },
            { value: "commercial_clear", label: "Comercial y claro" },
            { value: "balanced_professional", label: "Balanceado profesional" },
          ],
        },
      ],
    },
    {
      id: "parties",
      title: "Datos de las Partes",
      description: "Información completa del autorizante y del autorizado",
      order: 2,
      fields: [
        {
          id: "autorizante_nombre",
          label: "Nombre / Razón Social del Autorizante",
          type: "text",
          required: true,
          placeholder: "Ej: María López",
          helpText: "Quien otorga la autorización (poderdante)",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "autorizante_doc",
          label: "CUIT / DNI del Autorizante",
          type: "cuit",
          required: true,
          placeholder: "Ej: 27-12345678-4",
        },
        {
          id: "autorizante_domicilio",
          label: "Domicilio del Autorizante",
          type: "address",
          required: true,
          placeholder: "Ej: San Martín 123, Córdoba Capital",
          validation: { minLength: 10, maxLength: 300 },
        },
        {
          id: "autorizado_nombre",
          label: "Nombre del Autorizado",
          type: "text",
          required: true,
          placeholder: "Ej: Carlos Rodríguez",
          helpText: "Quien recibe la autorización para actuar",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "autorizado_doc",
          label: "CUIT / DNI del Autorizado",
          type: "cuit",
          required: true,
          placeholder: "Ej: 20-87654321-1",
        },
        {
          id: "autorizado_domicilio",
          label: "Domicilio del Autorizado",
          type: "address",
          required: false,
          placeholder: "Ej: Av. Colón 200, Mendoza",
          helpText: "Opcional pero recomendado para mayor validez formal",
          validation: { maxLength: 300 },
        },
      ],
    },
    {
      id: "scope",
      title: "Alcance de la Autorización",
      description: "Qué puede y qué no puede hacer el autorizado",
      order: 3,
      fields: [
        {
          id: "tramite_autorizado",
          label: "Trámite / Gestión o Acto Autorizado",
          type: "text",
          required: true,
          placeholder: "Ej: Retiro de documentación en AFIP, cobro de cheque N° 12345, firma de contrato de alquiler...",
          helpText: "Describí de forma concisa el acto específico que se autoriza",
          validation: { minLength: 5, maxLength: 300 },
        },
        {
          id: "descripcion_alcance",
          label: "Descripción Detallada del Alcance",
          type: "textarea",
          required: true,
          placeholder: "Ej: El autorizado queda facultado para presentarse ante la Administración Federal de Ingresos Públicos (AFIP) y retirar la documentación correspondiente al CUIT 20-12345678-9, firmar recibos y cualquier documento necesario para completar el trámite...",
          helpText: "Describí con detalle suficiente qué puede hacer el autorizado",
          validation: { minLength: 20, maxLength: 1500 },
        },
        {
          id: "limitaciones",
          label: "Límites o Restricciones",
          type: "textarea",
          required: false,
          placeholder: "Ej: La presente autorización no faculta para comprometer obligaciones dinerarias, ni para actuar en nombre del autorizante en actos distintos al indicado...",
          helpText: "Opcional: especificá qué queda expresamente excluido del alcance",
          validation: { maxLength: 1000 },
        },
      ],
    },
    {
      id: "validity",
      title: "Vigencia",
      description: "Período de validez de la autorización",
      order: 4,
      fields: [
        {
          id: "fecha_autorizacion",
          label: "Fecha de Otorgamiento",
          type: "date",
          required: true,
          helpText: "Fecha en que se suscribe esta autorización",
        },
        {
          id: "acto_unico",
          label: "Autorización por acto único",
          type: "switch",
          required: false,
          helpText: "La autorización pierde vigencia una vez realizado el acto autorizado",
        },
        {
          id: "vigencia_hasta",
          label: "Vigencia hasta",
          type: "date",
          required: false,
          helpText: "Opcional: fecha de vencimiento de la autorización",
        },
      ],
    },
    {
      id: "observations",
      title: "Observaciones",
      description: "Condiciones especiales y documentación asociada",
      order: 5,
      fields: [
        {
          id: "condiciones_especiales",
          label: "Condiciones Especiales",
          type: "textarea",
          required: false,
          placeholder: "Ej: Esta autorización solo podrá ejercerse en días hábiles administrativos y durante el horario de atención al público...",
          helpText: "Opcional: condiciones o restricciones adicionales de uso",
          validation: { maxLength: 500 },
        },
        {
          id: "documentacion_asociada",
          label: "Documentación Asociada",
          type: "textarea",
          required: false,
          placeholder: "Ej: Se adjunta copia del DNI del autorizante, poder de la empresa...",
          helpText: "Opcional: documentación que acompaña o se referencia en esta autorización",
          validation: { maxLength: 300 },
        },
      ],
    },
    additionalClausesSection,
  ],

  semanticValidations: [
    {
      id: "alcance_requerido",
      name: "Alcance de la autorización requerido",
      description: "Debe describirse claramente qué se autoriza",
      check: (data) => {
        if (!data.descripcion_alcance || String(data.descripcion_alcance).length < 20) {
          return "Debés describir con detalle suficiente el alcance de la autorización (mínimo 20 caracteres)";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "tramite_requerido",
      name: "Trámite o acto autorizado requerido",
      description: "Debe especificarse el acto o gestión que se autoriza",
      check: (data) => {
        if (!data.tramite_autorizado || String(data.tramite_autorizado).length < 5) {
          return "Debés especificar el trámite, gestión o acto autorizado";
        }
        return true;
      },
      severity: "error",
    },
  ],

  warningRules: [
    {
      id: "sin_vigencia_definida",
      name: "Sin vigencia definida",
      description: "No se estableció un plazo de vigencia ni acto único",
      check: (data) => !data.acto_unico && !data.vigencia_hasta,
      message: "No se definió la vigencia de la autorización. Una autorización sin plazo puede generar confusión.",
      suggestion: "Considerá indicar que es por acto único o establecer una fecha de vencimiento.",
    },
    {
      id: "sin_limitaciones",
      name: "Sin restricciones explícitas",
      description: "No se especificaron limitaciones del alcance",
      check: (data) => !data.limitaciones,
      message: "No se definieron restricciones o límites al alcance de la autorización.",
      suggestion: "Agregar limitaciones explícitas reduce el riesgo de un uso más amplio del previsto.",
    },
  ],

  requiredClauses: [
    {
      id: "identificacion_partes",
      name: "Identificación de Partes",
      description: "Datos completos del autorizante y del autorizado",
      category: "common",
    },
    {
      id: "objeto_autorizacion",
      name: "Objeto de la Autorización",
      description: "Descripción del acto o gestión autorizado",
      category: "type_specific",
    },
    {
      id: "alcance_limite",
      name: "Alcance y Límites",
      description: "Qué puede y qué no puede hacer el autorizado",
      category: "type_specific",
    },
    {
      id: "vigencia",
      name: "Vigencia",
      description: "Duración o condición de extinción de la autorización",
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
      id: "limitaciones",
      name: "Limitaciones Expresas",
      description: "Restricciones explícitas al alcance",
      condition: (data) => Boolean(data.limitaciones),
      category: "type_specific",
    },
    {
      id: "condiciones_especiales",
      name: "Condiciones Especiales",
      description: "Condiciones adicionales de uso",
      condition: (data) => Boolean(data.condiciones_especiales),
      category: "type_specific",
    },
    {
      id: "documentacion_asociada",
      name: "Documentación Asociada",
      description: "Documentos que acompañan la autorización",
      condition: (data) => Boolean(data.documentacion_asociada),
      category: "type_specific",
    },
  ],

  promptConfig: {
    systemMessage:
      "Eres un abogado senior argentino especializado en derecho civil y representación. Generás poderes y autorizaciones simples válidos y claros según el Código Civil y Comercial argentino, con alcance limitado al acto específicamente indicado.",

    baseInstructions: [
      "El documento debe ser legalmente válido y claro en Argentina",
      "Usar los datos concretos proporcionados (nombres, domicilios, actos autorizados)",
      "El alcance de la autorización debe ser preciso y limitado al acto indicado",
      "Estructura: identificación del autorizante, identificación del autorizado, objeto, alcance, vigencia, firmas",
      "Si se incluye 'additionalClauses', incorporarlas como cláusulas adicionales con numeración correlativa, respetando su contenido",
    ],

    toneInstructions: {
      formal_technical: "Formal y técnico legal. Terminología precisa del derecho civil y la representación.",
      commercial_clear: "Comercial y claro. Lenguaje directo y entendible.",
      balanced_professional: "Balanceado: formal pero accesible.",
    },

    requiredClausesInstructions: [
      "Identificación completa del autorizante con CUIT/DNI y domicilio",
      "Identificación completa del autorizado con CUIT/DNI",
      "Descripción precisa del acto, trámite o gestión autorizada",
      "Alcance específico: qué puede hacer el autorizado",
      "Limitaciones: qué queda expresamente excluido",
      "Vigencia: plazo o condición de extinción",
      "Declaración de que la autorización es personal e intransferible",
      "Foro de competencia en la jurisdicción especificada",
    ],

    formatInstructions:
      "SOLO el texto de la autorización. SIN explicaciones ni comentarios. Numeración de cláusulas en mayúsculas cuando corresponda. Sección final para FIRMA del autorizante, con lugar y fecha.",
  },

  templateConfig: {
    templateId: "simple_authorization_v1",
    version: "1.0.0",
    variablePlaceholders: [
      "{{PARTIES}}",
      "{{OBJECT}}",
      "{{SCOPE}}",
      "{{LIMITATIONS}}",
      "{{VALIDITY}}",
      "{{CONDITIONS}}",
      "{{JURISDICTION}}",
    ],
    clauseSlots: [
      "{{CLAUSE_IDENTIFICATION}}",
      "{{CLAUSE_OBJECT}}",
      "{{CLAUSE_SCOPE}}",
      "{{CLAUSE_LIMITATIONS}}",
      "{{CLAUSE_VALIDITY}}",
      "{{CLAUSE_JURISDICTION}}",
    ],
  },
};

registerDocumentSchema(simpleAuthorizationSchema);


