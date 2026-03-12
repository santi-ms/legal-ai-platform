/**
 * Legal Notice (Carta Documento) Document Schema
 * 
 * Schema definition for "Carta Documento" (Legal Notice/Formal Notice).
 */

import type {
  DocumentSchemaDefinition,
} from "../core/types";
import { registerDocumentSchema } from "../core/registry";

export const legalNoticeSchema: DocumentSchemaDefinition = {
  id: "legal_notice",
  label: "Carta Documento",
  description: "Notificación formal con carácter de documento público para intimar o comunicar algo con efectos legales.",
  
  useCases: [
    "Intimación de pago",
    "Notificación de incumplimiento contractual",
    "Requerimiento de cumplimiento de obligaciones",
    "Comunicación formal con efectos legales",
  ],
  
  noUseCases: [
    "Contratos (usar tipos de contrato específicos)",
    "Acuerdos de confidencialidad (usar NDA)",
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
      order: 1,
      fields: [
        {
          id: "jurisdiccion",
          label: "Jurisdicción",
          type: "select",
          required: true,
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
      title: "Información de las Partes",
      order: 2,
      fields: [
        {
          id: "remitente_nombre",
          label: "Nombre / Razón Social del Remitente",
          type: "text",
          required: true,
          placeholder: "Ej: Empresa Reclamante SRL",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "remitente_doc",
          label: "CUIT / Documento del Remitente",
          type: "cuit",
          required: true,
        },
        {
          id: "remitente_domicilio",
          label: "Domicilio del Remitente",
          type: "address",
          required: true,
          validation: { minLength: 10, maxLength: 300 },
        },
        {
          id: "destinatario_nombre",
          label: "Nombre / Razón Social del Destinatario",
          type: "text",
          required: true,
          placeholder: "Ej: Empresa Deudora SRL",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "destinatario_doc",
          label: "CUIT / Documento del Destinatario",
          type: "cuit",
          required: true,
        },
        {
          id: "destinatario_domicilio",
          label: "Domicilio del Destinatario",
          type: "address",
          required: true,
          validation: { minLength: 10, maxLength: 300 },
        },
      ],
    },
    {
      id: "context",
      title: "Contexto y Relación",
      order: 3,
      fields: [
        {
          id: "relacion_previa",
          label: "Relación Previa / Contexto",
          type: "textarea",
          required: true,
          placeholder: "Ej: Contrato de servicios celebrado el día X, factura N° Y...",
          helpText: "Describe la relación previa o el contexto que da origen a esta carta documento",
          validation: { minLength: 20, maxLength: 1000 },
        },
      ],
    },
    {
      id: "facts",
      title: "Hechos",
      order: 4,
      fields: [
        {
          id: "hechos",
          label: "Hechos",
          type: "textarea",
          required: true,
          placeholder: "Ej: El día X se celebró un contrato, se prestaron servicios, se emitió factura N° Y por el monto de ARS Z...",
          helpText: "Narra los hechos relevantes de manera cronológica y clara",
          validation: { minLength: 30, maxLength: 2000 },
        },
        {
          id: "incumplimiento",
          label: "Incumplimiento",
          type: "textarea",
          required: true,
          placeholder: "Ej: A la fecha, no se ha recibido el pago correspondiente a la factura mencionada...",
          helpText: "Describe el incumplimiento o la situación que motiva la carta documento",
          validation: { minLength: 20, maxLength: 1000 },
        },
      ],
    },
    {
      id: "demand",
      title: "Intimación",
      order: 5,
      fields: [
        {
          id: "intimacion",
          label: "Intimación Concreta",
          type: "textarea",
          required: true,
          placeholder: "Ej: Por la presente se INTIMA al destinatario a que en el plazo de 10 días hábiles proceda al pago del monto adeudado...",
          helpText: "Define claramente qué se está requiriendo o intimando",
          validation: { minLength: 30, maxLength: 1000 },
        },
        {
          id: "plazo_cumplimiento",
          label: "Plazo para Cumplir",
          type: "select",
          required: true,
          options: [
            { value: "3_dias", label: "3 días hábiles" },
            { value: "5_dias", label: "5 días hábiles" },
            { value: "10_dias", label: "10 días hábiles" },
            { value: "15_dias", label: "15 días hábiles" },
            { value: "30_dias", label: "30 días hábiles" },
            { value: "custom", label: "Personalizado" },
          ],
        },
        {
          id: "plazo_custom",
          label: "Plazo Personalizado",
          type: "text",
          required: false,
          visibleWhen: ["plazo_cumplimiento"],
          placeholder: "Ej: 7 días corridos",
        },
        {
          id: "apercibimiento",
          label: "Apercibimiento",
          type: "textarea",
          required: true,
          placeholder: "Ej: Vencido el plazo sin cumplimiento, se iniciarán las acciones legales correspondientes, con más los intereses, costas y honorarios...",
          helpText: "Consecuencias si no se cumple con la intimación",
          validation: { minLength: 20, maxLength: 500 },
        },
      ],
    },
  ],
  
  semanticValidations: [
    {
      id: "intimacion_requerida",
      name: "Intimación concreta requerida",
      description: "Debe existir una intimación clara y específica",
      check: (data) => {
        if (!data.intimacion || String(data.intimacion).length < 30) {
          return "La intimación debe ser clara, concreta y específica (mínimo 30 caracteres)";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "plazo_requerido",
      name: "Plazo para cumplir requerido",
      description: "Debe especificarse un plazo para cumplir con la intimación",
      check: (data) => {
        if (!data.plazo_cumplimiento) {
          return "Debes especificar un plazo para cumplir con la intimación";
        }
        if (data.plazo_cumplimiento === "custom" && !data.plazo_custom) {
          return "Si seleccionas plazo personalizado, debes especificarlo";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "hechos_requeridos",
      name: "Hechos requeridos",
      description: "Deben narrarse los hechos relevantes",
      check: (data) => {
        if (!data.hechos || String(data.hechos).length < 30) {
          return "Debes narrar los hechos relevantes de manera clara (mínimo 30 caracteres)";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "incumplimiento_requerido",
      name: "Incumplimiento requerido",
      description: "Debe describirse el incumplimiento",
      check: (data) => {
        if (!data.incumplimiento || String(data.incumplimiento).length < 20) {
          return "Debes describir el incumplimiento o situación que motiva la carta documento";
        }
        return true;
      },
      severity: "error",
    },
  ],
  
  warningRules: [
    {
      id: "intimacion_ambigua",
      name: "Intimación ambigua o genérica",
      description: "La intimación parece ambigua o demasiado genérica",
      check: (data) => {
        const intimacion = String(data.intimacion || "");
        const palabrasGenericas = ["cumplir", "resolver", "solucionar"];
        const tienePalabrasGenericas = palabrasGenericas.some(p => intimacion.toLowerCase().includes(p));
        const esCorta = intimacion.length < 50;
        return tienePalabrasGenericas && esCorta;
      },
      message: "La intimación podría ser más específica. Una intimación ambigua puede no tener efectos legales adecuados.",
      suggestion: "Especifica exactamente qué se requiere: monto a pagar, acción a realizar, plazo concreto, etc.",
    },
    {
      id: "sin_relacion_previa",
      name: "Falta contexto de relación previa",
      description: "No se definió claramente la relación previa",
      check: (data) => {
        const relacion = String(data.relacion_previa || "");
        return relacion.length < 30;
      },
      message: "El contexto de la relación previa podría estar más detallado.",
      suggestion: "Incluye información sobre contratos previos, facturas, fechas relevantes, etc.",
    },
    {
      id: "apercibimiento_generico",
      name: "Apercibimiento genérico",
      description: "El apercibimiento es muy genérico",
      check: (data) => {
        const apercibimiento = String(data.apercibimiento || "");
        return apercibimiento.length < 40;
      },
      message: "El apercibimiento podría ser más específico sobre las consecuencias legales.",
      suggestion: "Especifica qué acciones legales se iniciarán: demanda, ejecución, etc.",
    },
  ],
  
  requiredClauses: [
    {
      id: "identificacion_partes",
      name: "Identificación de Partes",
      description: "Datos completos de remitente y destinatario",
      category: "common",
    },
    {
      id: "relacion_previa",
      name: "Relación Previa",
      description: "Contexto y relación previa entre las partes",
      category: "type_specific",
    },
    {
      id: "hechos",
      name: "Narración de Hechos",
      description: "Hechos relevantes de manera cronológica",
      category: "type_specific",
    },
    {
      id: "incumplimiento",
      name: "Incumplimiento",
      description: "Descripción del incumplimiento o situación",
      category: "type_specific",
    },
    {
      id: "intimacion",
      name: "Intimación",
      description: "Requerimiento concreto y específico",
      category: "type_specific",
    },
    {
      id: "plazo",
      name: "Plazo para Cumplir",
      description: "Plazo concreto para cumplir con la intimación",
      category: "type_specific",
    },
    {
      id: "apercibimiento",
      name: "Apercibimiento",
      description: "Consecuencias de no cumplir",
      category: "type_specific",
    },
    {
      id: "foro_competencia",
      name: "Foro de Competencia",
      description: "Jurisdicción competente",
      category: "common",
    },
  ],
  
  optionalClauses: [],
  
  promptConfig: {
    systemMessage: "Eres un abogado senior argentino especializado en derecho comercial y notificaciones legales. Generas cartas documento válidas y completas según la normativa argentina vigente.",
    
    baseInstructions: [
      "El documento debe ser legalmente válido y ejecutable en Argentina",
      "Usar los datos concretos proporcionados",
      "La intimación debe ser clara, específica y concreta",
      "Estructura: Encabezado con datos completos, narración de hechos, intimación, apercibimiento",
    ],
    
    toneInstructions: {
      formal_technical: "Formal y técnico legal. Terminología jurídica precisa.",
      commercial_clear: "Comercial y claro. Lenguaje entendible sin sacrificar validez legal.",
      balanced_professional: "Balanceado: profesional pero accesible.",
    },
    
    requiredClausesInstructions: [
      "Identificación completa de remitente y destinatario",
      "Relación previa o contexto",
      "Narración cronológica de hechos",
      "Descripción del incumplimiento",
      "Intimación concreta y específica",
      "Plazo para cumplir",
      "Apercibimiento con consecuencias legales",
      "Foro de competencia",
    ],
    
    formatInstructions: "SOLO el texto de la carta documento. SIN explicaciones. Estructura formal de carta documento. Sección final para FIRMA del remitente.",
  },
  
  templateConfig: {
    templateId: "legal_notice_v1",
    version: "1.0.0",
    variablePlaceholders: [
      "{{PARTIES}}",
      "{{CONTEXT}}",
      "{{FACTS}}",
      "{{BREACH}}",
      "{{DEMAND}}",
      "{{DEADLINE}}",
      "{{WARNING}}",
      "{{JURISDICTION}}",
    ],
    clauseSlots: [
      "{{CLAUSE_IDENTIFICATION}}",
      "{{CLAUSE_CONTEXT}}",
      "{{CLAUSE_FACTS}}",
      "{{CLAUSE_BREACH}}",
      "{{CLAUSE_DEMAND}}",
      "{{CLAUSE_DEADLINE}}",
      "{{CLAUSE_WARNING}}",
      "{{CLAUSE_JURISDICTION}}",
    ],
  },
};

registerDocumentSchema(legalNoticeSchema);

