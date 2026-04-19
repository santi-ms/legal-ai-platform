/**
 * NDA (Non-Disclosure Agreement) Document Schema
 * 
 * Schema definition for "Acuerdo de Confidencialidad" (NDA).
 */

import type {
  DocumentSchemaDefinition,
} from "../core/types";
import { registerDocumentSchema } from "../core/registry";
import { additionalClausesSection } from "./common-fields";

export const ndaSchema: DocumentSchemaDefinition = {
  id: "nda",
  label: "Acuerdo de Confidencialidad (NDA)",
  description: "Acuerdo para proteger información confidencial compartida entre partes.",
  
  useCases: [
    "Protección de información comercial sensible",
    "Protección de secretos comerciales o industriales",
    "Protección de información técnica o de desarrollo",
    "Acuerdos previos a negociaciones comerciales",
  ],
  
  noUseCases: [
    "Contratos de servicios (usar Contrato de Servicios)",
    "Contratos de suministro (usar Contrato de Suministro)",
  ],
  
  jurisdictionSupport: [
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
            { value: "corrientes_capital", label: "Corrientes Capital" },
            { value: "posadas_misiones", label: "Posadas, Misiones" },
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
          id: "revelador_nombre",
          label: "Nombre / Razón Social del Revelador",
          type: "text",
          required: true,
          placeholder: "Ej: Empresa Innovadora SRL",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "revelador_doc",
          label: "CUIT / Documento del Revelador",
          type: "cuit",
          required: true,
          placeholder: "Ej: 20-12345678-9",
        },
        {
          id: "revelador_domicilio",
          label: "Domicilio del Revelador",
          type: "address",
          required: true,
          validation: { minLength: 10, maxLength: 300 },
        },
        {
          id: "receptor_nombre",
          label: "Nombre / Razón Social del Receptor",
          type: "text",
          required: true,
          placeholder: "Ej: Consultora Externa SRL",
          validation: { minLength: 3, maxLength: 200 },
        },
        {
          id: "receptor_doc",
          label: "CUIT / Documento del Receptor",
          type: "cuit",
          required: true,
        },
        {
          id: "receptor_domicilio",
          label: "Domicilio del Receptor",
          type: "address",
          required: true,
          validation: { minLength: 10, maxLength: 300 },
        },
      ],
    },
    {
      id: "confidential_information",
      title: "Información Confidencial",
      order: 3,
      fields: [
        {
          id: "definicion_informacion",
          label: "Definición de Información Confidencial",
          type: "textarea",
          required: true,
          placeholder: "Ej: Información técnica sobre el producto X, listas de clientes, estrategias comerciales, códigos fuente...",
          helpText: "Define claramente qué información se considera confidencial",
          validation: { minLength: 20, maxLength: 2000 },
        },
        {
          id: "finalidad_permitida",
          label: "Finalidad Permitida",
          type: "textarea",
          required: true,
          placeholder: "Ej: Evaluación de una posible asociación comercial, desarrollo de un proyecto conjunto...",
          helpText: "Para qué propósito se comparte la información confidencial",
          validation: { minLength: 20, maxLength: 1000 },
        },
        {
          id: "exclusiones",
          label: "Exclusiones (Opcional)",
          type: "textarea",
          required: false,
          placeholder: "Ej: Información que ya es de dominio público, información recibida de terceros sin restricciones...",
          helpText: "Información que NO está sujeta a confidencialidad",
          validation: { maxLength: 1000 },
        },
      ],
    },
    {
      id: "term",
      title: "Plazo de Confidencialidad",
      order: 4,
      fields: [
        {
          id: "plazo_confidencialidad",
          label: "Plazo de Confidencialidad (años)",
          type: "number",
          required: true,
          helpText: "Duración de la obligación de confidencialidad",
          validation: { min: 1, max: 10 },
        },
        {
          id: "inicio_vigencia",
          label: "Inicio de Vigencia",
          type: "date",
          required: true,
        },
      ],
    },
    {
      id: "obligations",
      title: "Obligaciones",
      order: 5,
      fields: [
        {
          id: "devolucion_destruccion",
          label: "Obligación de Devolución/Destrucción",
          type: "switch",
          required: false,
          helpText: "El receptor debe devolver o destruir la información al finalizar",
        },
        {
          id: "plazo_devolucion",
          label: "Plazo para Devolución/Destrucción (días)",
          type: "number",
          required: false,
          visibleWhen: ["devolucion_destruccion"],
          validation: { min: 1, max: 365 },
        },
      ],
    },
    {
      id: "breach",
      title: "Incumplimiento",
      order: 6,
      fields: [
        {
          id: "penalidad_incumplimiento",
          label: "Penalidad por Incumplimiento",
          type: "text",
          required: false,
          placeholder: "Ej: ARS 1000000 o daños y perjuicios",
          helpText: "Opcional: Define la penalidad por violación del acuerdo",
        },
      ],
    },
    additionalClausesSection,
  ],
  
  semanticValidations: [
    {
      id: "definicion_requerida",
      name: "Definición de información confidencial requerida",
      description: "Debe definirse claramente qué información es confidencial",
      check: (data) => {
        if (!data.definicion_informacion || String(data.definicion_informacion).length < 20) {
          return "Debes definir claramente qué información se considera confidencial";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "finalidad_requerida",
      name: "Finalidad permitida requerida",
      description: "Debe especificarse para qué propósito se comparte la información",
      check: (data) => {
        if (!data.finalidad_permitida || String(data.finalidad_permitida).length < 20) {
          return "Debes especificar la finalidad para la cual se comparte la información confidencial";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "devolucion_requiere_plazo",
      name: "Devolución requiere plazo",
      description: "Si se activa devolución/destrucción, debe definirse el plazo",
      check: (data) => {
        if (data.devolucion_destruccion && !data.plazo_devolucion) {
          return "Si activas la obligación de devolución/destrucción, debes especificar el plazo";
        }
        return true;
      },
      severity: "error",
    },
  ],
  
  warningRules: [
    {
      id: "plazo_muy_corto",
      name: "Plazo de confidencialidad muy corto",
      description: "El plazo de confidencialidad es muy corto",
      check: (data) => {
        const años = Number(data.plazo_confidencialidad) || 0;
        return años < 2;
      },
      message: "El plazo de confidencialidad es menor a 2 años. Considera extenderlo para mayor protección.",
      suggestion: "Para información sensible, se recomienda un plazo de al menos 3-5 años.",
    },
    {
      id: "sin_devolucion",
      name: "Falta obligación de devolución",
      description: "No se definió obligación de devolución/destrucción",
      check: (data) => !data.devolucion_destruccion,
      message: "No se incluyó una obligación de devolución o destrucción de la información al finalizar el acuerdo.",
      suggestion: "Considera incluir esta obligación para mayor protección de la información confidencial.",
    },
    {
      id: "exclusiones_poco_claras",
      name: "Exclusiones poco claras",
      description: "Las exclusiones no están bien definidas",
      check: (data) => {
        const exclusiones = String(data.exclusiones || "");
        return exclusiones.length > 0 && exclusiones.length < 30;
      },
      message: "Las exclusiones podrían estar más claramente definidas.",
      suggestion: "Especifica claramente qué información NO está sujeta a confidencialidad.",
    },
  ],
  
  requiredClauses: [
    {
      id: "identificacion_partes",
      name: "Identificación de Partes",
      description: "Datos completos de revelador y receptor",
      category: "common",
    },
    {
      id: "definicion_informacion",
      name: "Definición de Información Confidencial",
      description: "Qué información está sujeta a confidencialidad",
      category: "type_specific",
    },
    {
      id: "finalidad_permitida",
      name: "Finalidad Permitida",
      description: "Para qué propósito se comparte la información",
      category: "type_specific",
    },
    {
      id: "obligaciones_receptor",
      name: "Obligaciones del Receptor",
      description: "Qué debe y no debe hacer el receptor con la información",
      category: "type_specific",
    },
    {
      id: "plazo_confidencialidad",
      name: "Plazo de Confidencialidad",
      description: "Duración de la obligación",
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
      id: "exclusiones",
      name: "Exclusiones",
      description: "Información que NO es confidencial",
      condition: (data) => Boolean(data.exclusiones && String(data.exclusiones).length > 0),
      category: "type_specific",
    },
    {
      id: "devolucion_destruccion",
      name: "Devolución/Destrucción",
      description: "Obligación de devolver o destruir información",
      condition: (data) => Boolean(data.devolucion_destruccion),
      category: "type_specific",
    },
    {
      id: "penalidad_incumplimiento",
      name: "Penalidad por Incumplimiento",
      description: "Consecuencias de violar el acuerdo",
      condition: (data) => Boolean(data.penalidad_incumplimiento),
      category: "type_specific",
    },
  ],
  
  promptConfig: {
    systemMessage: "Eres un abogado senior argentino especializado en derecho comercial y protección de información confidencial. Generas acuerdos de confidencialidad (NDA) válidos y completos según la normativa argentina vigente.",
    
    baseInstructions: [
      "El documento debe ser legalmente válido y ejecutable en Argentina",
      "Usar los datos concretos proporcionados",
      "Incluir cláusulas obligatorias para acuerdos de confidencialidad",
      "Estructura: Encabezado con datos completos de partes, luego cláusulas numeradas",
    ],
    
    toneInstructions: {
      formal_technical: "Formal y técnico legal. Terminología jurídica precisa.",
      commercial_clear: "Comercial y claro. Lenguaje entendible sin sacrificar validez legal.",
      balanced_professional: "Balanceado: profesional pero accesible.",
    },
    
    requiredClausesInstructions: [
      "Identificación completa de revelador y receptor",
      "Definición clara de información confidencial",
      "Finalidad permitida para el uso de la información",
      "Obligaciones del receptor",
      "Plazo de confidencialidad",
      "Foro de competencia",
      "Ley aplicable",
    ],
    
    formatInstructions: "SOLO el texto del acuerdo. SIN explicaciones. Numeración de cláusulas en mayúsculas. Sección final para FIRMAS.",
  },
  
  templateConfig: {
    templateId: "nda_v1",
    version: "1.0.0",
    variablePlaceholders: [
      "{{PARTIES}}",
      "{{DEFINITION}}",
      "{{PURPOSE}}",
      "{{TERM}}",
      "{{OBLIGATIONS}}",
      "{{RETURN}}",
      "{{BREACH}}",
      "{{JURISDICTION}}",
    ],
    clauseSlots: [
      "{{CLAUSE_IDENTIFICATION}}",
      "{{CLAUSE_DEFINITION}}",
      "{{CLAUSE_PURPOSE}}",
      "{{CLAUSE_OBLIGATIONS}}",
      "{{CLAUSE_TERM}}",
      "{{CLAUSE_RETURN}}",
      "{{CLAUSE_BREACH}}",
      "{{CLAUSE_JURISDICTION}}",
    ],
  },
};

registerDocumentSchema(ndaSchema);

