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

// ---------------------------------------------------------------------------
// lease
// ---------------------------------------------------------------------------

export function getLeaseSemanticRules(): SemanticValidationRule[] {
  return [
    {
      id: "canon_requerido",
      name: "Canon locativo requerido",
      description: "El monto del alquiler mensual debe ser mayor a 0",
      check: (data: StructuredDocumentData) => {
        const monto = Number(data.monto_alquiler) || 0;
        if (monto <= 0) {
          return "El canon locativo mensual debe ser un valor mayor a 0";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "moneda_requerida_locacion",
      name: "Moneda requerida",
      description: "Debe especificarse la moneda del canon",
      check: (data: StructuredDocumentData) => {
        if (!data.moneda) {
          return "Debes especificar la moneda del canon locativo";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "fecha_inicio_requerida",
      name: "Fecha de inicio requerida",
      description: "Debe indicarse la fecha desde la cual rige la locación",
      check: (data: StructuredDocumentData) => {
        if (!data.fecha_inicio) {
          return "Debes indicar la fecha de inicio de la locación";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "duracion_requerida",
      name: "Duración del contrato requerida",
      description: "La duración en meses debe ser al menos 1",
      check: (data: StructuredDocumentData) => {
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
      description: "Si se activa depósito, debe especificarse la cantidad de meses",
      check: (data: StructuredDocumentData) => {
        if (data.deposito && (!data.deposito_meses || Number(data.deposito_meses) < 1)) {
          return "Si incluís depósito de garantía, especificá la cantidad de meses (mínimo 1)";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "ajuste_valido",
      name: "Mecanismo de ajuste válido",
      description: "El mecanismo de ajuste debe ser uno de los soportados",
      check: (data: StructuredDocumentData) => {
        const validos = ["ninguno", "icl", "inflacion", "dolar", "acuerdo"];
        if (data.ajuste_precio && !validos.includes(String(data.ajuste_precio))) {
          return `El mecanismo de ajuste '${data.ajuste_precio}' no es válido. Opciones: ${validos.join(", ")}`;
        }
        return true;
      },
      severity: "error",
    },
  ];
}

export function getLeaseWarningRules(): WarningRule[] {
  return [
    {
      id: "sin_ajuste_largo_plazo",
      name: "Sin mecanismo de ajuste para contrato largo",
      description: "Contratos de 12+ meses sin ajuste de precio quedan expuestos a inflación",
      check: (data: StructuredDocumentData) => {
        const meses = Number(data.duracion_meses) || 0;
        return meses >= 12 && (!data.ajuste_precio || data.ajuste_precio === "ninguno");
      },
      message: "Para contratos de 12 meses o más se recomienda incluir un mecanismo de actualización del canon.",
      suggestion: "Considera el Índice Casa Propia (ICL - BCRA) o el IPC como referencia de ajuste.",
    },
    {
      id: "sin_deposito_garantia",
      name: "Sin depósito de garantía",
      description: "No se estableció un depósito de garantía",
      check: (data: StructuredDocumentData) => !data.deposito,
      message: "No se estableció un depósito de garantía. Es una protección habitual para el locador ante daños o falta de pago.",
      suggestion: "Considerá incluir al menos 1 mes de alquiler como depósito.",
    },
    {
      id: "descripcion_inmueble_escasa",
      name: "Descripción del inmueble poco detallada",
      description: "La descripción del bien no tiene suficiente detalle para identificarlo claramente",
      check: (data: StructuredDocumentData) => {
        return String(data.descripcion_inmueble || "").length < 30;
      },
      message: "La descripción del bien podría ser más detallada para evitar disputas sobre su estado o características.",
      suggestion: "Incluí superficie, ambientes, estado general y cualquier característica relevante del inmueble.",
    },
    {
      id: "sin_destino_uso",
      name: "Destino de uso no especificado",
      description: "No se indicó el destino o finalidad de uso del bien",
      check: (data: StructuredDocumentData) => !data.destino_uso,
      message: "No se especificó el destino de uso. El uso no autorizado puede ser causal de rescisión.",
      suggestion: "Indicá si es vivienda, local comercial, oficina u otro uso.",
    },
  ];
}

// ---------------------------------------------------------------------------
// debt_recognition
// ---------------------------------------------------------------------------

export function getDebtRecognitionSemanticRules(): SemanticValidationRule[] {
  return [
    {
      id: "monto_deuda_requerido",
      name: "Monto de la deuda requerido",
      description: "El monto total reconocido debe ser mayor a 0",
      check: (data: StructuredDocumentData) => {
        const monto = Number(data.monto_deuda) || 0;
        if (monto <= 0) {
          return "El monto total de la deuda reconocida debe ser mayor a 0";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "moneda_requerida_deuda",
      name: "Moneda requerida",
      description: "Debe especificarse la moneda de la deuda",
      check: (data: StructuredDocumentData) => {
        if (!data.moneda) {
          return "Debes especificar la moneda de la deuda reconocida";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "causa_deuda_requerida",
      name: "Causa de la deuda requerida",
      description: "Debe describirse el origen de la deuda con suficiente detalle",
      check: (data: StructuredDocumentData) => {
        if (!data.causa_deuda || String(data.causa_deuda).length < 20) {
          return "Debes describir el origen o causa de la deuda (mínimo 20 caracteres)";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "fecha_reconocimiento_requerida",
      name: "Fecha de reconocimiento requerida",
      description: "Debe indicarse la fecha en que se suscribe el reconocimiento",
      check: (data: StructuredDocumentData) => {
        if (!data.fecha_reconocimiento) {
          return "Debes indicar la fecha de reconocimiento de la deuda";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "cuotas_requieren_datos_completos",
      name: "Plan de cuotas incompleto",
      description: "Si se paga en cuotas, deben estar completos cantidad, monto y fecha",
      check: (data: StructuredDocumentData) => {
        if (!data.pago_en_cuotas) return true;
        if (!data.cantidad_cuotas || Number(data.cantidad_cuotas) < 2) {
          return "Si el pago es en cuotas, debés indicar la cantidad (mínimo 2 cuotas)";
        }
        if (!data.fecha_primer_vencimiento) {
          return "Si el pago es en cuotas, debés indicar la fecha del primer vencimiento";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "intereses_requieren_tasa",
      name: "Intereses requieren tasa especificada",
      description: "Si se pactan intereses, debe indicarse la tasa",
      check: (data: StructuredDocumentData) => {
        if (data.incluye_intereses && !data.tasa_interes) {
          return "Si incluís intereses, debés especificar la tasa o referencia (ej: tasa activa BCRA, 3% mensual)";
        }
        return true;
      },
      severity: "error",
    },
  ];
}

export function getDebtRecognitionWarningRules(): WarningRule[] {
  return [
    {
      id: "inconsistencia_cuotas_monto",
      name: "Posible inconsistencia entre cuotas y monto total",
      description: "El total de las cuotas difiere significativamente del monto reconocido",
      check: (data: StructuredDocumentData) => {
        if (!data.pago_en_cuotas || !data.monto_cuota || !data.cantidad_cuotas || !data.monto_deuda) {
          return false;
        }
        const totalCuotas = Number(data.monto_cuota) * Number(data.cantidad_cuotas);
        const montoDeuda = Number(data.monto_deuda);
        if (montoDeuda <= 0 || totalCuotas <= 0) return false;
        const diferencia = Math.abs(totalCuotas - montoDeuda) / montoDeuda;
        return diferencia > 0.05; // más del 5% de diferencia
      },
      message: "El total de cuotas no coincide con el monto de la deuda reconocida. Revisá los importes.",
      suggestion: "Verificá que cantidad_cuotas × monto_cuota ≈ monto_deuda (podés incluir diferencia por intereses pero conviene aclararlo).",
    },
    {
      id: "sin_forma_pago_deuda",
      name: "Sin forma de pago especificada",
      description: "No se indicó el medio de pago de la deuda",
      check: (data: StructuredDocumentData) => !data.forma_pago,
      message: "No se especificó la forma de pago. Esto puede generar disputas sobre el cumplimiento.",
      suggestion: "Indicá si el pago se realizará por transferencia bancaria, efectivo, cheque u otro medio.",
    },
    {
      id: "sin_consecuencias_mora",
      name: "Sin consecuencias por incumplimiento",
      description: "No se definieron consecuencias ante la falta de pago",
      check: (data: StructuredDocumentData) =>
        !data.clausula_aceleracion && !data.consecuencias_mora,
      message: "No se definieron consecuencias por mora o incumplimiento. El instrumento pierde fuerza ejecutiva.",
      suggestion: "Considerá incluir intereses punitorios y/o cláusula de aceleración ante incumplimiento.",
    },
    {
      id: "causa_deuda_escasa",
      name: "Causa de la deuda poco detallada",
      description: "La descripción del origen de la deuda es muy breve",
      check: (data: StructuredDocumentData) => {
        return String(data.causa_deuda || "").length < 50;
      },
      message: "La causa de la deuda podría estar más detallada para mayor validez ejecutiva.",
      suggestion: "Incluí referencia a facturas, contratos, fechas o cualquier elemento que identifique el origen de la obligación.",
    },
  ];
}

// ---------------------------------------------------------------------------
// simple_authorization
// ---------------------------------------------------------------------------

export function getSimpleAuthorizationSemanticRules(): SemanticValidationRule[] {
  return [
    {
      id: "tramite_autorizado_requerido",
      name: "Trámite autorizado requerido",
      description: "Debe especificarse el acto o gestión que se autoriza",
      check: (data: StructuredDocumentData) => {
        if (!data.tramite_autorizado || String(data.tramite_autorizado).length < 5) {
          return "Debés especificar el trámite, gestión o acto que se autoriza (mínimo 5 caracteres)";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "alcance_autorizacion_requerido",
      name: "Alcance de la autorización requerido",
      description: "Debe describirse el alcance con suficiente detalle",
      check: (data: StructuredDocumentData) => {
        if (!data.descripcion_alcance || String(data.descripcion_alcance).length < 20) {
          return "Debés describir el alcance de la autorización con suficiente detalle (mínimo 20 caracteres)";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "autorizante_completo",
      name: "Datos del autorizante completos",
      description: "Nombre y documento del autorizante son obligatorios",
      check: (data: StructuredDocumentData) => {
        if (!data.autorizante_nombre || !data.autorizante_doc) {
          return "Debés completar el nombre y CUIT/DNI del autorizante";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "autorizado_completo",
      name: "Datos del autorizado completos",
      description: "Nombre y documento del autorizado son obligatorios",
      check: (data: StructuredDocumentData) => {
        if (!data.autorizado_nombre || !data.autorizado_doc) {
          return "Debés completar el nombre y CUIT/DNI del autorizado";
        }
        return true;
      },
      severity: "error",
    },
    {
      id: "vigencia_definida",
      name: "Vigencia indefinida requiere acto único",
      description: "Si no es acto único, debe definirse la vigencia de la autorización",
      check: (data: StructuredDocumentData) => {
        if (!data.acto_unico && !data.vigencia_hasta) {
          return "Si la autorización no es por acto único, debés establecer una fecha de vigencia (vigencia_hasta)";
        }
        return true;
      },
      severity: "error",
    },
  ];
}

export function getSimpleAuthorizationWarningRules(): WarningRule[] {
  return [
    {
      id: "sin_limitaciones_autorizacion",
      name: "Sin restricciones al alcance",
      description: "No se especificaron limitaciones ni exclusiones del alcance",
      check: (data: StructuredDocumentData) => !data.limitaciones,
      message: "No se definieron restricciones al alcance de la autorización. Esto puede dar lugar a un uso más amplio del previsto.",
      suggestion: "Agregá límites explícitos: qué NO puede hacer el autorizado, qué actos quedan excluidos.",
    },
    {
      id: "alcance_demasiado_breve",
      name: "Alcance demasiado breve para ser concreto",
      description: "La descripción del alcance es muy corta para ser jurídicamente precisa",
      check: (data: StructuredDocumentData) => {
        return String(data.descripcion_alcance || "").length < 50;
      },
      message: "El alcance de la autorización parece demasiado breve. Una descripción vaga puede dar lugar a abusos o disputas.",
      suggestion: "Describí con precisión las facultades conferidas: ante qué organismo, para qué acto específico, con qué documentación.",
    },
    {
      id: "acto_amplio_sin_limites",
      name: "Descripción amplia sin restricciones",
      description: "El alcance descrito parece amplio pero no hay limitaciones definidas",
      check: (data: StructuredDocumentData) => {
        const alcance = String(data.descripcion_alcance || "");
        return alcance.length > 100 && !data.limitaciones;
      },
      message: "El alcance de la autorización es extenso pero no tiene restricciones definidas.",
      suggestion: "Cuando la descripción del acto autorizado es amplia, es especialmente importante delimitar qué queda excluido.",
    },
    {
      id: "sin_fecha_autorizacion",
      name: "Sin fecha de otorgamiento",
      description: "No se indicó la fecha en que se suscribe la autorización",
      check: (data: StructuredDocumentData) => !data.fecha_autorizacion,
      message: "No se indicó la fecha de otorgamiento de la autorización. Sin fecha, el instrumento puede carecer de validez temporal.",
      suggestion: "Especificá la fecha en que se firma y otorga la autorización.",
    },
  ];
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

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
    case "lease":
      return {
        semantic: getLeaseSemanticRules(),
        warnings: getLeaseWarningRules(),
      };
    case "debt_recognition":
      return {
        semantic: getDebtRecognitionSemanticRules(),
        warnings: getDebtRecognitionWarningRules(),
      };
    case "simple_authorization":
      return {
        semantic: getSimpleAuthorizationSemanticRules(),
        warnings: getSimpleAuthorizationWarningRules(),
      };
    default:
      return {
        semantic: [],
        warnings: [],
      };
  }
}

