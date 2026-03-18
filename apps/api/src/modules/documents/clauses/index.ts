/**
 * Clauses Index
 * 
 * Central export for all document clauses.
 */

import type { ClauseDefinition } from "../domain/generation-engine.js";
import { identificationClause } from "./common/identification.js";
import { jurisdictionClause } from "./common/jurisdiction.js";
import { disputesClause } from "./common/disputes.js";
import { serviceObjectClause } from "./service/object.js";
import { serviceAmountClause } from "./service/amount.js";
import { serviceTermClause } from "./service/term.js";
import { serviceTerminationClause } from "./service/termination.js";
import { serviceConfidentialityClause } from "./service/confidentiality.js";
import { serviceIntellectualPropertyClause } from "./service/intellectual-property.js";
import { ndaDefinitionClause } from "./nda/definition.js";
import { ndaPurposeClause } from "./nda/purpose.js";
import { ndaObligationsClause } from "./nda/obligations.js";
import { ndaTermClause } from "./nda/term.js";
import { ndaReturnClause } from "./nda/return.js";
import { ndaBreachClause } from "./nda/breach.js";
import { legalNoticeContextClause } from "./legal-notice/context.js";
import { legalNoticeFactsClause } from "./legal-notice/facts.js";
import { legalNoticeBreachClause } from "./legal-notice/breach.js";
import { legalNoticeDemandClause } from "./legal-notice/demand.js";
import { legalNoticeDeadlineClause } from "./legal-notice/deadline.js";
import { legalNoticeWarningClause } from "./legal-notice/warning.js";

/**
 * Get all clauses for a document type
 * 
 * @param documentType - Document type ID
 * @returns Map of clause ID to clause definition
 */
export function getClausesForType(documentType: string): Map<string, ClauseDefinition> {
  const clauses = new Map<string, ClauseDefinition>();

  // Contract-style common clauses: only for document types that are actual contracts.
  // Legal notices (carta documento) use a different structure: parties are in the
  // header, and jurisdiction/disputes clauses are inappropriate for this format.
  if (documentType !== "legal_notice") {
    clauses.set(identificationClause.id, identificationClause);
    clauses.set(jurisdictionClause.id, jurisdictionClause);
    clauses.set(disputesClause.id, disputesClause);
  }

  // Type-specific clauses
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
  
  return clauses;
}

/**
 * Get required clause IDs for a document type
 * 
 * @param documentType - Document type ID
 * @returns Array of required clause IDs
 */
export function getRequiredClauseIds(documentType: string): string[] {
  // Legal notice has its own clause structure — no contract-style required clauses.
  // Parties are identified in the template header via {{PARTIES}}, so
  // "identificacion_partes" is not needed as a numbered clause here.
  if (documentType === "legal_notice") {
    return [
      "contexto_relacion",
      "hechos",
      "incumplimiento",
      "intimacion",
      "plazo_cumplimiento",
    ];
  }

  // Default: contract-style required clauses
  const required: string[] = [
    "identificacion_partes",
    "foro_competencia",
    "resolucion_disputas",
  ];

  if (documentType === "service_contract") {
    required.push(
      "objeto_contrato",
      "monto_pago",
      "vigencia_plazo"
    );
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

/**
 * Get optional clause IDs with conditions for a document type
 * 
 * @param documentType - Document type ID
 * @returns Array of optional clause definitions
 */
export function getOptionalClauseIds(documentType: string): Array<{
  id: string;
  condition?: (data: Record<string, unknown>) => boolean;
}> {
  const optional: Array<{ id: string; condition?: (data: Record<string, unknown>) => boolean }> = [];
  
  if (documentType === "service_contract") {
    optional.push(
      {
        id: "penalizacion_rescision",
        condition: (data) => Boolean(data.penalizacion_rescision && data.penalizacion_monto),
      },
      {
        id: "confidencialidad",
        condition: (data) => Boolean(data.confidencialidad && data.plazo_confidencialidad),
      },
      {
        id: "propiedad_intelectual",
        condition: (data) => Boolean(data.propiedad_intelectual && data.tipo_propiedad_intelectual),
      }
    );
  }
  
  if (documentType === "nda") {
    optional.push(
      {
        id: "devolucion_destruccion",
        condition: (data) => Boolean(data.devolucion_destruccion && data.plazo_devolucion),
      },
      {
        id: "penalidad_incumplimiento",
        condition: (data) => Boolean(data.penalidad_incumplimiento),
      }
    );
  }
  
  if (documentType === "legal_notice") {
    optional.push(
      {
        id: "apercibimiento",
        condition: (data) => Boolean(data.apercibimiento),
      }
    );
  }
  
  return optional;
}

