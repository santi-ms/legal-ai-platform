/**
 * Clauses Index
 *
 * Central export for all document clauses.
 */

import type { ClauseDefinition } from "../domain/generation-engine.js";

// Common
import { identificationClause } from "./common/identification.js";
import { jurisdictionClause } from "./common/jurisdiction.js";
import { disputesClause } from "./common/disputes.js";

// Service contract
import { serviceObjectClause } from "./service/object.js";
import { serviceAmountClause } from "./service/amount.js";
import { serviceTermClause } from "./service/term.js";
import { serviceTerminationClause } from "./service/termination.js";
import { serviceConfidentialityClause } from "./service/confidentiality.js";
import { serviceIntellectualPropertyClause } from "./service/intellectual-property.js";

// NDA
import { ndaDefinitionClause } from "./nda/definition.js";
import { ndaPurposeClause } from "./nda/purpose.js";
import { ndaObligationsClause } from "./nda/obligations.js";
import { ndaTermClause } from "./nda/term.js";
import { ndaReturnClause } from "./nda/return.js";
import { ndaBreachClause } from "./nda/breach.js";

// Legal notice
import { legalNoticeContextClause } from "./legal-notice/context.js";
import { legalNoticeFactsClause } from "./legal-notice/facts.js";
import { legalNoticeBreachClause } from "./legal-notice/breach.js";
import { legalNoticeDemandClause } from "./legal-notice/demand.js";
import { legalNoticeDeadlineClause } from "./legal-notice/deadline.js";
import { legalNoticeWarningClause } from "./legal-notice/warning.js";

// Lease
import { leasePropertyClause } from "./lease/property.js";
import { leaseAmountClause } from "./lease/amount.js";
import { leaseTermClause } from "./lease/term.js";
import { leaseConditionsClause } from "./lease/conditions.js";
import { leaseObligationsClause } from "./lease/obligations.js";
import { leaseGuarantorClause } from "./lease/guarantor.js";
import { leaseEarlyTerminationClause } from "./lease/early-termination.js";
import { leaseDomiciliosClause } from "./lease/domicilios.js";
import { leaseJurisdictionClause } from "./lease/jurisdiction.js";

// Debt recognition
import { debtRecognitionDebtClause } from "./debt-recognition/debt.js";
import { debtRecognitionPaymentClause } from "./debt-recognition/payment.js";
import { debtRecognitionDefaultClause } from "./debt-recognition/default.js";

// Simple authorization
import { authScopeClause } from "./simple-authorization/scope.js";
import { authValidityClause, authObservationsClause } from "./simple-authorization/validity.js";

// ---------------------------------------------------------------------------

export function getClausesForType(documentType: string): Map<string, ClauseDefinition> {
  const clauses = new Map<string, ClauseDefinition>();

  // Contract-style common clauses: not used in legal_notice or lease
  // (lease uses its own jurisdiction/domicilios clauses)
  if (documentType !== "legal_notice" && documentType !== "lease") {
    clauses.set(identificationClause.id, identificationClause);
    clauses.set(jurisdictionClause.id, jurisdictionClause);
    clauses.set(disputesClause.id, disputesClause);
  }

  if (documentType === "service_contract") {
    clauses.set(serviceObjectClause.id, serviceObjectClause);
    clauses.set(serviceAmountClause.id, serviceAmountClause);
    clauses.set(serviceTermClause.id, serviceTermClause);
    clauses.set(serviceTerminationClause.id, serviceTerminationClause);
    clauses.set(serviceConfidentialityClause.id, serviceConfidentialityClause);
    clauses.set(serviceIntellectualPropertyClause.id, serviceIntellectualPropertyClause);
  }

  if (documentType === "nda") {
    clauses.set(ndaDefinitionClause.id, ndaDefinitionClause);
    clauses.set(ndaPurposeClause.id, ndaPurposeClause);
    clauses.set(ndaObligationsClause.id, ndaObligationsClause);
    clauses.set(ndaTermClause.id, ndaTermClause);
    clauses.set(ndaReturnClause.id, ndaReturnClause);
    clauses.set(ndaBreachClause.id, ndaBreachClause);
  }

  if (documentType === "legal_notice") {
    clauses.set(legalNoticeContextClause.id, legalNoticeContextClause);
    clauses.set(legalNoticeFactsClause.id, legalNoticeFactsClause);
    clauses.set(legalNoticeBreachClause.id, legalNoticeBreachClause);
    clauses.set(legalNoticeDemandClause.id, legalNoticeDemandClause);
    clauses.set(legalNoticeDeadlineClause.id, legalNoticeDeadlineClause);
    clauses.set(legalNoticeWarningClause.id, legalNoticeWarningClause);
  }

  if (documentType === "lease") {
    clauses.set(leasePropertyClause.id, leasePropertyClause);
    clauses.set(leaseTermClause.id, leaseTermClause);
    clauses.set(leaseAmountClause.id, leaseAmountClause);
    clauses.set(leaseConditionsClause.id, leaseConditionsClause);
    clauses.set(leaseObligationsClause.id, leaseObligationsClause);
    clauses.set(leaseGuarantorClause.id, leaseGuarantorClause);
    clauses.set(leaseEarlyTerminationClause.id, leaseEarlyTerminationClause);
    clauses.set(leaseDomiciliosClause.id, leaseDomiciliosClause);
    clauses.set(leaseJurisdictionClause.id, leaseJurisdictionClause);
  }

  if (documentType === "debt_recognition") {
    clauses.set(debtRecognitionDebtClause.id, debtRecognitionDebtClause);
    clauses.set(debtRecognitionPaymentClause.id, debtRecognitionPaymentClause);
    clauses.set(debtRecognitionDefaultClause.id, debtRecognitionDefaultClause);
  }

  if (documentType === "simple_authorization") {
    clauses.set(authScopeClause.id, authScopeClause);
    clauses.set(authValidityClause.id, authValidityClause);
    clauses.set(authObservationsClause.id, authObservationsClause);
  }

  return clauses;
}

// ---------------------------------------------------------------------------

export function getRequiredClauseIds(documentType: string): string[] {
  // Legal notice: own structure, no contract-style clauses
  if (documentType === "legal_notice") {
    return [
      "contexto_relacion",
      "hechos",
      "incumplimiento",
      "intimacion",
      "plazo_cumplimiento",
    ];
  }

  // Lease
  if (documentType === "lease") {
    return [
      "identificacion_partes",
      "objeto_locacion",
      "canon_locativo",
      "plazo_locacion",
      "condiciones_locacion",
      "obligaciones_especiales_locacion",
      "rescision_anticipada_locacion",
      "foro_competencia",
      "resolucion_disputas",
    ];
  }

  // Debt recognition
  if (documentType === "debt_recognition") {
    return [
      "identificacion_partes",
      "reconocimiento_deuda",
      "forma_pago_deuda",
      "incumplimiento_deuda",
      "foro_competencia",
      "resolucion_disputas",
    ];
  }

  // Simple authorization
  if (documentType === "simple_authorization") {
    return [
      "identificacion_partes",
      "alcance_autorizacion",
      "vigencia_autorizacion",
      "foro_competencia",
    ];
  }

  // Default: contract-style required clauses (service_contract, nda)
  const required: string[] = [
    "identificacion_partes",
    "foro_competencia",
    "resolucion_disputas",
  ];

  if (documentType === "service_contract") {
    required.push("objeto_contrato", "monto_pago", "vigencia_plazo");
  }

  if (documentType === "nda") {
    required.push(
      "definicion_informacion",
      "finalidad_permitida",
      "obligaciones_receptor",
      "plazo_confidencialidad"
    );
  }

  return required;
}

// ---------------------------------------------------------------------------

export function getOptionalClauseIds(documentType: string): Array<{
  id: string;
  condition?: (data: Record<string, unknown>) => boolean;
}> {
  if (documentType === "service_contract") {
    return [
      { id: "penalizacion_rescision", condition: (d) => Boolean(d.penalizacion_rescision && d.penalizacion_monto) },
      { id: "confidencialidad",       condition: (d) => Boolean(d.confidencialidad && d.plazo_confidencialidad) },
      { id: "propiedad_intelectual",  condition: (d) => Boolean(d.propiedad_intelectual && d.tipo_propiedad_intelectual) },
    ];
  }

  if (documentType === "nda") {
    return [
      { id: "devolucion_destruccion",   condition: (d) => Boolean(d.devolucion_destruccion && d.plazo_devolucion) },
      { id: "penalidad_incumplimiento", condition: (d) => Boolean(d.penalidad_incumplimiento) },
    ];
  }

  if (documentType === "legal_notice") {
    return [
      { id: "apercibimiento", condition: (d) => Boolean(d.apercibimiento) },
    ];
  }

  if (documentType === "simple_authorization") {
    return [
      { id: "observaciones_autorizacion", condition: (d) => Boolean(d.condiciones_especiales || d.documentacion_asociada) },
    ];
  }

  if (documentType === "lease") {
    return [
      { id: "fiador_garante_locacion", condition: (d) => Boolean(d.fiador_nombre) },
    ];
  }

  return [];
}
