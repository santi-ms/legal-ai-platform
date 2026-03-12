/**
 * Service Contract Document Schema
 * 
 * Complete schema definition for "Contrato de Servicios" (Service Contract).
 * This is the most comprehensive document type and serves as a reference for others.
 */

import type {
  DocumentSchemaDefinition,
  DocumentTone,
  JurisdictionId,
} from "../core/types";
import { registerDocumentSchema } from "../core/registry";

/**
 * Service Contract Schema Definition
 */
export const serviceContractSchema: DocumentSchemaDefinition = {
  id: "service_contract",
  label: "Contrato de Servicios",
  description: "Contrato para la prestación de servicios profesionales o comerciales entre dos partes.",
  
  useCases: [
    "Prestación de servicios profesionales (contadores, abogados, consultores)",
    "Servicios comerciales (marketing, diseño, desarrollo de software)",
    "Servicios de mantenimiento o soporte técnico",
    "Servicios de asesoramiento o consultoría",
  ],
  
  noUseCases: [
    "Venta de productos físicos (usar Contrato de Suministro)",
    "Alquiler de inmuebles (usar Contrato de Locación)",
    "Trabajo en relación de dependencia (usar contrato laboral)",
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
          helpText: "Jurisdicción donde se ejecutará el contrato y será competente el fuero",
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
          helpText: "Estilo de redacción del contrato",
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
      description: "Datos completos de ambas partes contratantes",
      order: 2,
      fields: [
        {
          id: "proveedor_nombre",
          label: "Nombre / Razón Social del Proveedor",
          type: "text",
          required: true,
          placeholder: "Ej: Estudio Contable Pérez SRL",
          validation: {
            minLength: 3,
            maxLength: 200,
          },
        },
        {
          id: "proveedor_doc",
          label: "CUIT / Documento del Proveedor",
          type: "cuit",
          required: true,
          placeholder: "Ej: 20-12345678-9",
          helpText: "CUIT para empresas o DNI para personas físicas",
        },
        {
          id: "proveedor_domicilio",
          label: "Domicilio del Proveedor",
          type: "address",
          required: true,
          placeholder: "Ej: San Martín 123, Córdoba Capital",
          validation: {
            minLength: 10,
            maxLength: 300,
          },
        },
        {
          id: "cliente_nombre",
          label: "Nombre / Razón Social del Cliente",
          type: "text",
          required: true,
          placeholder: "Ej: Transporte Gomez SRL",
          validation: {
            minLength: 3,
            maxLength: 200,
          },
        },
        {
          id: "cliente_doc",
          label: "CUIT / Documento del Cliente",
          type: "cuit",
          required: true,
          placeholder: "Ej: 30-99999999-7",
        },
        {
          id: "cliente_domicilio",
          label: "Domicilio del Cliente",
          type: "address",
          required: true,
          placeholder: "Ej: Av. Costanera 500, Posadas, Misiones",
          validation: {
            minLength: 10,
            maxLength: 300,
          },
        },
      ],
    },
    {
      id: "service_definition",
      title: "Definición del Servicio",
      description: "Detalles del servicio a prestar",
      order: 3,
      fields: [
        {
          id: "descripcion_servicio",
          label: "Descripción del Servicio / Objeto del Contrato",
          type: "textarea",
          required: true,
          placeholder: "Ej: Asesoramiento contable mensual, liquidación de impuestos, presentaciones AFIP y Rentas provinciales...",
          helpText: "Describe detalladamente qué servicios se prestarán",
          validation: {
            minLength: 20,
            maxLength: 2000,
          },
        },
        {
          id: "alcance",
          label: "Alcance del Servicio",
          type: "textarea",
          required: false,
          placeholder: "Ej: Incluye hasta 3 consultas mensuales, presentación de declaraciones juradas, asesoramiento telefónico...",
          helpText: "Opcional: Define límites o alcances específicos del servicio",
          validation: {
            maxLength: 1000,
          },
        },
        {
          id: "entregables",
          label: "Entregables",
          type: "textarea",
          required: false,
          placeholder: "Ej: Informes mensuales, declaraciones juradas, certificados...",
          helpText: "Opcional: Lista de productos o documentos que se entregarán",
          validation: {
            maxLength: 1000,
          },
        },
      ],
    },
    {
      id: "commercial_terms",
      title: "Condiciones Comerciales",
      description: "Términos económicos y de pago",
      order: 4,
      fields: [
        {
          id: "monto",
          label: "Monto",
          type: "currency",
          required: true,
          placeholder: "Ej: 180000",
          helpText: "Monto del servicio (sin símbolos ni comas)",
          validation: {
            min: 0,
          },
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
          id: "periodicidad",
          label: "Periodicidad de Pago",
          type: "select",
          required: true,
          options: [
            { value: "mensual", label: "Mensual" },
            { value: "bimestral", label: "Bimestral" },
            { value: "trimestral", label: "Trimestral" },
            { value: "semestral", label: "Semestral" },
            { value: "anual", label: "Anual" },
            { value: "unico", label: "Pago único" },
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
          id: "plazo_pago",
          label: "Plazo de Pago",
          type: "select",
          required: true,
          helpText: "Tiempo para realizar el pago después de la facturación",
          options: [
            { value: "contado", label: "Al contado" },
            { value: "7_dias", label: "7 días" },
            { value: "15_dias", label: "15 días" },
            { value: "30_dias", label: "30 días" },
            { value: "45_dias", label: "45 días" },
            { value: "60_dias", label: "60 días" },
          ],
        },
        {
          id: "precio_incluye_impuestos",
          label: "El precio incluye impuestos",
          type: "switch",
          required: false,
          helpText: "Indica si el monto incluye IVA u otros impuestos",
        },
        {
          id: "ajuste_precio",
          label: "Ajuste de Precio",
          type: "select",
          required: false,
          helpText: "Opcional: Define si el precio se ajustará periódicamente",
          options: [
            { value: "ninguno", label: "Sin ajuste" },
            { value: "inflacion", label: "Ajuste por inflación (IPC)" },
            { value: "dolar", label: "Ajuste por dólar" },
            { value: "acuerdo", label: "Ajuste por acuerdo entre partes" },
          ],
        },
      ],
    },
    {
      id: "billing",
      title: "Facturación",
      description: "Configuración de facturación e impuestos",
      order: 5,
      fields: [
        {
          id: "preferencias_fiscales",
          label: "Modalidad de Facturación",
          type: "select",
          required: true,
          options: [
            { value: "monotributo", label: "Monotributo" },
            { value: "responsable_inscripto", label: "Responsable Inscripto" },
            { value: "exento", label: "Exento" },
            { value: "precio_mas_impuestos", label: "Precio + Impuestos" },
          ],
        },
      ],
    },
    {
      id: "term",
      title: "Vigencia y Plazo",
      description: "Duración del contrato",
      order: 6,
      fields: [
        {
          id: "inicio_vigencia",
          label: "Inicio de Vigencia",
          type: "date",
          required: true,
          helpText: "Fecha desde la cual el contrato entra en vigencia",
        },
        {
          id: "plazo_minimo_meses",
          label: "Plazo Mínimo (meses)",
          type: "number",
          required: true,
          helpText: "Duración mínima del contrato en meses",
          validation: {
            min: 1,
            max: 120,
          },
        },
        {
          id: "renovacion_automatica",
          label: "Renovación Automática",
          type: "switch",
          required: false,
          helpText: "El contrato se renueva automáticamente al finalizar el plazo",
        },
        {
          id: "preaviso_renovacion",
          label: "Preaviso para Renovación (días)",
          type: "number",
          required: false,
          visibleWhen: ["renovacion_automatica"],
          helpText: "Días de anticipación requeridos para evitar renovación automática",
          validation: {
            min: 0,
            max: 365,
          },
        },
      ],
    },
    {
      id: "termination",
      title: "Rescisión",
      description: "Condiciones de finalización del contrato",
      order: 7,
      fields: [
        {
          id: "penalizacion_rescision",
          label: "Penalización por Rescisión Anticipada",
          type: "switch",
          required: false,
          helpText: "¿El contrato incluye multa por finalización antes del plazo mínimo?",
        },
        {
          id: "penalizacion_monto",
          label: "Monto de Penalización",
          type: "text",
          required: false,
          visibleWhen: ["penalizacion_rescision"],
          placeholder: "Ej: ARS 50000 o 2 meses de servicio",
          helpText: "Define el monto o forma de calcular la penalización",
        },
        {
          id: "preaviso_rescision",
          label: "Preaviso para Rescisión (días)",
          type: "number",
          required: false,
          helpText: "Días de anticipación requeridos para rescindir el contrato",
          validation: {
            min: 0,
            max: 365,
          },
        },
      ],
    },
    {
      id: "intellectual_property",
      title: "Propiedad Intelectual",
      description: "Derechos sobre trabajos y creaciones",
      order: 8,
      fields: [
        {
          id: "propiedad_intelectual",
          label: "Incluir cláusula de Propiedad Intelectual",
          type: "switch",
          required: false,
          helpText: "Define quién posee los derechos sobre los trabajos realizados",
        },
        {
          id: "tipo_propiedad_intelectual",
          label: "Tipo de Cesión / Licencia",
          type: "select",
          required: false,
          visibleWhen: ["propiedad_intelectual"],
          options: [
            { value: "cesion_total", label: "Cesión total al cliente" },
            { value: "licencia_exclusiva", label: "Licencia exclusiva al cliente" },
            { value: "licencia_no_exclusiva", label: "Licencia no exclusiva al cliente" },
            { value: "reserva_proveedor", label: "Reserva de derechos al proveedor" },
          ],
        },
      ],
    },
    {
      id: "confidentiality",
      title: "Confidencialidad",
      description: "Protección de información confidencial",
      order: 9,
      fields: [
        {
          id: "confidencialidad",
          label: "Incluir cláusula de Confidencialidad",
          type: "switch",
          required: false,
          helpText: "Obligación de mantener confidencialidad sobre información compartida",
        },
        {
          id: "plazo_confidencialidad",
          label: "Plazo de Confidencialidad (años)",
          type: "number",
          required: false,
          visibleWhen: ["confidencialidad"],
          helpText: "Duración de la obligación de confidencialidad",
          validation: {
            min: 1,
            max: 10,
          },
        },
      ],
    },
    {
      id: "notifications",
      title: "Notificaciones",
      description: "Medios y domicilios para notificaciones",
      order: 10,
      fields: [
        {
          id: "domicilio_notificaciones",
          label: "Domicilio para Notificaciones",
          type: "select",
          required: false,
          helpText: "Domicilio que se usará para notificaciones legales",
          options: [
            { value: "domicilio_contratante", label: "Domicilio del contratante" },
            { value: "domicilio_especial", label: "Domicilio especial (definir abajo)" },
          ],
        },
        {
          id: "domicilio_especial",
          label: "Domicilio Especial",
          type: "address",
          required: false,
          visibleWhen: ["domicilio_notificaciones"],
          placeholder: "Ej: Estudio Legal, Calle Principal 123",
        },
      ],
    },
  ],
  
  semanticValidations: [
    {
      id: "penalizacion_requiere_rescision",
      name: "Penalización requiere rescisión anticipada",
      description: "Si se define un monto de penalización, debe estar activada la opción de penalización por rescisión",
      check: (data) => {
        if (data.penalizacion_monto && !data.penalizacion_rescision) {
          return "Si defines un monto de penalización, debes activar la opción de penalización por rescisión";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "monto_requiere_moneda",
      name: "Monto requiere moneda",
      description: "Si se define un monto, debe especificarse la moneda",
      check: (data) => {
        if (data.monto && !data.moneda) {
          return "Debes especificar la moneda del monto";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "propiedad_intelectual_requiere_tipo",
      name: "Propiedad intelectual requiere tipo",
      description: "Si se activa propiedad intelectual, debe definirse el tipo de cesión/licencia",
      check: (data) => {
        if (data.propiedad_intelectual && !data.tipo_propiedad_intelectual) {
          return "Si activas propiedad intelectual, debes especificar el tipo de cesión o licencia";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "confidencialidad_requiere_plazo",
      name: "Confidencialidad requiere plazo",
      description: "Si se activa confidencialidad, debe definirse el plazo",
      check: (data) => {
        if (data.confidencialidad && !data.plazo_confidencialidad) {
          return "Si activas confidencialidad, debes especificar el plazo en años";
        }
        return true;
      },
      severity: "error",
    },
  ],
  
  warningRules: [
    {
      id: "sin_confidencialidad",
      name: "Falta cláusula de confidencialidad",
      description: "No se definió confidencialidad en contrato de servicios",
      check: (data) => !data.confidencialidad,
      message: "No se incluyó una cláusula de confidencialidad. Esto puede ser importante si se compartirá información sensible.",
      suggestion: "Considera activar la opción de confidencialidad si se compartirá información comercial o técnica sensible.",
    },
    {
      id: "sin_propiedad_intelectual",
      name: "Falta cláusula de propiedad intelectual",
      description: "No se definió propiedad intelectual en servicios",
      check: (data) => !data.propiedad_intelectual,
      message: "No se incluyó una cláusula de propiedad intelectual. Esto puede ser relevante si se crearán trabajos, códigos o diseños.",
      suggestion: "Si el servicio implica creación de trabajos intelectuales, considera definir los derechos de propiedad.",
    },
    {
      id: "precio_sin_impuestos",
      name: "Precio sin aclaración de impuestos",
      description: "No se aclaró si el precio incluye impuestos",
      check: (data) => data.precio_incluye_impuestos === undefined || data.precio_incluye_impuestos === null,
      message: "No se aclaró si el precio incluye impuestos. Esto puede generar confusiones en la facturación.",
      suggestion: "Especifica claramente si el monto incluye o no incluye impuestos.",
    },
    {
      id: "sin_ajuste_precio",
      name: "Sin ajuste de precio definido",
      description: "No se definió ajuste de precio para contratos de largo plazo",
      check: (data) => {
        const meses = Number(data.plazo_minimo_meses) || 0;
        return meses >= 12 && !data.ajuste_precio;
      },
      message: "Para contratos de 12 meses o más, se recomienda definir un mecanismo de ajuste de precio.",
      suggestion: "Considera incluir un ajuste por inflación o acuerdo entre partes para contratos de largo plazo.",
    },
    {
      id: "alcance_poco_detallado",
      name: "Alcance del servicio poco detallado",
      description: "Falta detalle del alcance del servicio",
      check: (data) => {
        const descripcion = String(data.descripcion_servicio || "").length;
        const alcance = String(data.alcance || "").length;
        return descripcion < 50 && alcance < 20;
      },
      message: "El alcance del servicio podría estar más detallado. Esto ayuda a evitar malentendidos.",
      suggestion: "Considera agregar más detalles sobre qué incluye y qué no incluye el servicio.",
    },
  ],
  
  requiredClauses: [
    {
      id: "identificacion_partes",
      name: "Identificación de Partes",
      description: "Datos completos de ambas partes con CUIT/documento y domicilio",
      category: "common",
    },
    {
      id: "objeto_contrato",
      name: "Objeto del Contrato",
      description: "Definición clara del servicio a prestar",
      category: "type_specific",
    },
    {
      id: "foro_competencia",
      name: "Foro de Competencia",
      description: "Jurisdicción competente para resolver disputas",
      category: "common",
    },
    {
      id: "ley_aplicable",
      name: "Ley Aplicable",
      description: "Leyes argentinas aplicables al contrato",
      category: "common",
    },
    {
      id: "vigencia_plazo",
      name: "Vigencia y Plazo",
      description: "Duración del contrato y condiciones de renovación",
      category: "type_specific",
    },
    {
      id: "monto_pago",
      name: "Monto y Forma de Pago",
      description: "Precio, periodicidad y método de pago",
      category: "type_specific",
    },
    {
      id: "resolucion_disputas",
      name: "Resolución de Disputas",
      description: "Medios para resolver conflictos (mediación, arbitraje, etc.)",
      category: "common",
    },
  ],
  
  optionalClauses: [
    {
      id: "confidencialidad",
      name: "Confidencialidad",
      description: "Obligación de mantener confidencialidad",
      condition: (data) => Boolean(data.confidencialidad),
      category: "type_specific",
    },
    {
      id: "propiedad_intelectual",
      name: "Propiedad Intelectual",
      description: "Derechos sobre trabajos y creaciones",
      condition: (data) => Boolean(data.propiedad_intelectual),
      category: "type_specific",
    },
    {
      id: "penalizacion_rescision",
      name: "Penalización por Rescisión",
      description: "Multa por finalización anticipada",
      condition: (data) => Boolean(data.penalizacion_rescision),
      category: "type_specific",
    },
    {
      id: "ajuste_precio",
      name: "Ajuste de Precio",
      description: "Mecanismo de actualización del precio",
      condition: (data) => data.ajuste_precio && data.ajuste_precio !== "ninguno",
      category: "type_specific",
    },
  ],
  
  promptConfig: {
    systemMessage: "Eres un abogado senior argentino especializado en derecho comercial con 20 años de experiencia. Generas documentos legales válidos, profesionales y completos según la normativa argentina vigente.",
    
    baseInstructions: [
      "El documento debe ser legalmente válido y ejecutable en Argentina",
      "Usar los datos concretos proporcionados (montos, fechas, domicilios)",
      "Incluir cláusulas obligatorias según tipo de contrato y normativa argentina",
      "Estructura: Encabezado con datos completos de partes, luego cláusulas numeradas (PRIMERA, SEGUNDA, etc.)",
    ],
    
    toneInstructions: {
      formal_technical: "Formal y técnico legal. Usar terminología jurídica precisa y cláusulas técnicas.",
      commercial_clear: "Comercial y claro. Lenguaje entendible para PyMEs sin sacrificar validez legal.",
      balanced_professional: "Balanceado: profesional pero accesible. Terminología jurídica correcta con explicaciones claras cuando sea necesario.",
    },
    
    requiredClausesInstructions: [
      "Identificación completa de partes con CUIT/documento",
      "Domicilio constituido en la jurisdicción especificada",
      "Foro de competencia exclusivo en la jurisdicción especificada",
      "Ley aplicable (leyes argentinas)",
      "Medios de resolución de disputas",
      "Plazo de vigencia y condiciones de rescisión",
      "Modalidades de pago y facturación",
      "Objeto del contrato claramente definido",
    ],
    
    formatInstructions: "SOLO el texto del contrato legal. SIN explicaciones, comentarios o contexto adicional. Numeración de cláusulas en mayúsculas (PRIMERA, SEGUNDA, etc.). Sección final para FIRMAS con espacios en blanco: Firma y aclaración del Proveedor, Firma y aclaración del Cliente, Lugar y fecha.",
  },
  
  templateConfig: {
    templateId: "service_contract_v1",
    version: "1.0.0",
    variablePlaceholders: [
      "{{PARTIES}}",
      "{{OBJECT}}",
      "{{SCOPE}}",
      "{{AMOUNT}}",
      "{{PAYMENT_TERMS}}",
      "{{TERM}}",
      "{{TERMINATION}}",
      "{{CONFIDENTIALITY}}",
      "{{INTELLECTUAL_PROPERTY}}",
      "{{NOTIFICATIONS}}",
      "{{JURISDICTION}}",
    ],
    clauseSlots: [
      "{{CLAUSE_IDENTIFICATION}}",
      "{{CLAUSE_OBJECT}}",
      "{{CLAUSE_AMOUNT}}",
      "{{CLAUSE_TERM}}",
      "{{CLAUSE_TERMINATION}}",
      "{{CLAUSE_CONFIDENTIALITY}}",
      "{{CLAUSE_INTELLECTUAL_PROPERTY}}",
      "{{CLAUSE_JURISDICTION}}",
      "{{CLAUSE_DISPUTES}}",
    ],
  },
};

// Register the schema
registerDocumentSchema(serviceContractSchema);

