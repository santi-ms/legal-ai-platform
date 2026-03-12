/**
 * Analytics/Tracking Utilities
 * 
 * Simple event tracking for the document creation flow.
 * Can be extended to integrate with analytics services (Google Analytics, Mixpanel, etc.)
 */

/**
 * Track document creation flow events
 */
export function trackDocumentFlowEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Analytics] ${event}`, properties);
  }
  
  // In production, you could send to analytics service
  // Example:
  // if (typeof window !== "undefined" && (window as any).gtag) {
  //   (window as any).gtag("event", event, properties);
  // }
  
  // Or use a custom analytics endpoint
  // fetch("/api/analytics", {
  //   method: "POST",
  //   body: JSON.stringify({ event, properties }),
  // }).catch(() => {});
}

/**
 * Track flow entry
 */
export function trackFlowEntry(): void {
  trackDocumentFlowEvent("document_flow_entry", {
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track document type selection
 */
export function trackDocumentTypeSelected(documentType: string): void {
  trackDocumentFlowEvent("document_type_selected", {
    documentType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track form submission
 */
export function trackFormSubmitted(documentType: string, hasWarnings: boolean): void {
  trackDocumentFlowEvent("document_form_submitted", {
    documentType,
    hasWarnings,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track generation start
 */
export function trackGenerationStart(documentType: string): void {
  trackDocumentFlowEvent("document_generation_start", {
    documentType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track generation success
 */
export function trackGenerationSuccess(
  documentType: string,
  documentId: string,
  hasWarnings: boolean
): void {
  trackDocumentFlowEvent("document_generation_success", {
    documentType,
    documentId,
    hasWarnings,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track validation error
 */
export function trackValidationError(
  documentType: string,
  errorType: "field" | "semantic",
  errorCount: number
): void {
  trackDocumentFlowEvent("document_validation_error", {
    documentType,
    errorType,
    errorCount,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track unexpected error
 */
export function trackUnexpectedError(
  documentType: string | null,
  errorMessage: string,
  step: string
): void {
  trackDocumentFlowEvent("document_unexpected_error", {
    documentType,
    errorMessage: errorMessage.substring(0, 200), // Truncate long messages
    step,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track step navigation
 */
export function trackStepNavigation(from: string, to: string, documentType?: string | null): void {
  trackDocumentFlowEvent("document_step_navigation", {
    from,
    to,
    documentType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track draft saved
 */
export function trackDraftSaved(documentType: string): void {
  trackDocumentFlowEvent("document_draft_saved", {
    documentType,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Track draft discarded
 */
export function trackDraftDiscarded(documentType: string): void {
  trackDocumentFlowEvent("document_draft_discarded", {
    documentType,
    timestamp: new Date().toISOString(),
  });
}

