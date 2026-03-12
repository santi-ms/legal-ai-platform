/**
 * Validation Rules for Document Types
 * 
 * Defines semantic validation rules and warning rules for each document type.
 */

import type {
  StructuredDocumentData,
} from "./document-types.js";
import type {
  SemanticValidationRule,
  WarningRule,
} from "./validation-engine.js";

/**
 * Get semantic validation rules for service_contract
 */
export function getServiceContractSemanticRules(): SemanticValidationRule[] {
  return [
    {
      id: "penalizacion_requiere_rescision",
      name: "Penalización requiere rescisión anticipada",
      description: "Si se define un monto de penalización, debe estar activada la opción de penalización por rescisión",
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
        if (data.confidencialidad && !data.plazo_confidencialidad) {
          return "Si activas confidencialidad, debes especificar el plazo en años";
        }
        return true;
      },
      severity: "error",
    },
  ];
}

/**
 * Get warning rules for service_contract
 */
export function getServiceContractWarningRules(): WarningRule[] {
  return [
    {
      id: "sin_confidencialidad",
      name: "Falta cláusula de confidencialidad",
      description: "No se definió confidencialidad en contrato de servicios",
      check: (data: StructuredDocumentData) => !data.confidencialidad,
      message: "No se incluyó una cláusula de confidencialidad. Esto puede ser importante si se compartirá información sensible.",
      suggestion: "Considera activar la opción de confidencialidad si se compartirá información comercial o técnica sensible.",
    },
    {
      id: "sin_propiedad_intelectual",
      name: "Falta cláusula de propiedad intelectual",
      description: "No se definió propiedad intelectual en servicios",
      check: (data: StructuredDocumentData) => !data.propiedad_intelectual,
      message: "No se incluyó una cláusula de propiedad intelectual. Esto puede ser relevante si se crearán trabajos, códigos o diseños.",
      suggestion: "Si el servicio implica creación de trabajos intelectuales, considera definir los derechos de propiedad.",
    },
    {
      id: "precio_sin_impuestos",
      name: "Precio sin aclaración de impuestos",
      description: "No se aclaró si el precio incluye impuestos",
      check: (data: StructuredDocumentData) => data.precio_incluye_impuestos === undefined || data.precio_incluye_impuestos === null,
      message: "No se aclaró si el precio incluye impuestos. Esto puede generar confusiones en la facturación.",
      suggestion: "Especifica claramente si el monto incluye o no incluye impuestos.",
    },
    {
      id: "sin_ajuste_precio",
      name: "Sin ajuste de precio definido",
      description: "No se definió ajuste de precio para contratos de largo plazo",
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
        const descripcion = String(data.descripcion_servicio || "").length;
        const alcance = String(data.alcance || "").length;
        return descripcion < 50 && alcance < 20;
      },
      message: "El alcance del servicio podría estar más detallado. Esto ayuda a evitar malentendidos.",
      suggestion: "Considera agregar más detalles sobre qué incluye y qué no incluye el servicio.",
    },
  ];
}

/**
 * Get semantic validation rules for nda
 */
export function getNDASemanticRules(): SemanticValidationRule[] {
  return [
    {
      id: "definicion_requerida",
      name: "Definición de información confidencial requerida",
      description: "Debe definirse claramente qué información es confidencial",
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
        if (data.devolucion_destruccion && !data.plazo_devolucion) {
          return "Si activas la obligación de devolución/destrucción, debes especificar el plazo";
        }
        return true;
      },
      severity: "error",
    },
  ];
}

/**
 * Get warning rules for nda
 */
export function getNDAWarningRules(): WarningRule[] {
  return [
    {
      id: "plazo_muy_corto",
      name: "Plazo de confidencialidad muy corto",
      description: "El plazo de confidencialidad es muy corto",
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => !data.devolucion_destruccion,
      message: "No se incluyó una obligación de devolución o destrucción de la información al finalizar el acuerdo.",
      suggestion: "Considera incluir esta obligación para mayor protección de la información confidencial.",
    },
    {
      id: "exclusiones_poco_claras",
      name: "Exclusiones poco claras",
      description: "Las exclusiones no están bien definidas",
      check: (data: StructuredDocumentData) => {
        const exclusiones = String(data.exclusiones || "");
        return exclusiones.length > 0 && exclusiones.length < 30;
      },
      message: "Las exclusiones podrían estar más claramente definidas.",
      suggestion: "Especifica claramente qué información NO está sujeta a confidencialidad.",
    },
  ];
}

/**
 * Get semantic validation rules for legal_notice
 */
export function getLegalNoticeSemanticRules(): SemanticValidationRule[] {
  return [
    {
      id: "intimacion_requerida",
      name: "Intimación concreta requerida",
      description: "Debe existir una intimación clara y específica",
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
        if (!data.incumplimiento || String(data.incumplimiento).length < 20) {
          return "Debes describir el incumplimiento o situación que motiva la carta documento";
        }
        return true;
      },
      severity: "error",
    },
  ];
}

/**
 * Get warning rules for legal_notice
 */
export function getLegalNoticeWarningRules(): WarningRule[] {
  return [
    {
      id: "intimacion_ambigua",
      name: "Intimación ambigua o genérica",
      description: "La intimación parece ambigua o demasiado genérica",
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
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
      check: (data: StructuredDocumentData) => {
        const apercibimiento = String(data.apercibimiento || "");
        return apercibimiento.length < 40;
      },
      message: "El apercibimiento podría ser más específico sobre las consecuencias legales.",
      suggestion: "Especifica qué acciones legales se iniciarán: demanda, ejecución, etc.",
    },
  ];
}

/**
 * Get validation rules for a document type
 */
export function getValidationRulesForType(
  documentType: string
): {
  semantic: SemanticValidationRule[];
  warnings: WarningRule[];
} {
  switch (documentType) {
    case "service_contract":
      return {
        semantic: getServiceContractSemanticRules(),
        warnings: getServiceContractWarningRules(),
      };
    case "nda":
      return {
        semantic: getNDASemanticRules(),
        warnings: getNDAWarningRules(),
      };
    case "legal_notice":
      return {
        semantic: getLegalNoticeSemanticRules(),
        warnings: getLegalNoticeWarningRules(),
      };
    default:
      return {
        semantic: [],
        warnings: [],
      };
  }
}

