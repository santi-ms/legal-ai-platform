/**
 * Templates Index
 * 
 * Central export for all document templates.
 */

import type { TemplateBase } from "../domain/generation-engine.js";
import { serviceContractTemplate } from "./service-contract/template.js";
import { ndaTemplate } from "./nda/template.js";
import { legalNoticeTemplate } from "./legal-notice/template.js";

/**
 * Get template for a document type
 * 
 * @param documentType - Document type ID
 * @returns Template base or undefined
 */
export function getTemplate(documentType: string): TemplateBase | undefined {
  switch (documentType) {
    case "service_contract":
      return serviceContractTemplate;
    case "nda":
      return ndaTemplate;
    case "legal_notice":
      return legalNoticeTemplate;
    default:
      return undefined;
  }
}

