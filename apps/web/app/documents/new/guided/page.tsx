/**
 * Guided Document Creation Flow
 * 
 * New guided flow based on document schemas.
 * Replaces the generic wizard with type-specific forms.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/app/components/DashboardShell";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { DynamicForm } from "@/src/features/documents/ui/forms/DynamicForm";
import { LegalSummary } from "@/src/features/documents/ui/summaries/LegalSummary";
import { WarningsPanel } from "@/src/features/documents/ui/warnings/WarningsPanel";
import { getDocumentSchema, getAllDocumentSchemas } from "@/src/features/documents/core/registry";
import type { DocumentTypeId, StructuredDocumentData, GenerationWarning } from "@/src/features/documents/core/types";
import { validateFormData } from "@/src/features/documents/core/validation";
import { evaluateWarningRules } from "@/src/features/documents/core/warnings";
import confetti from "canvas-confetti";
import { FileText, CheckCircle, AlertTriangle, Loader2, ArrowLeft, HelpCircle } from "lucide-react";
import { AutosaveIndicator } from "@/src/features/documents/ui/autosave/AutosaveIndicator";
import { ValidationErrorPanel } from "@/src/features/documents/ui/errors/ValidationErrorPanel";
import {
  trackFlowEntry,
  trackDocumentTypeSelected,
  trackFormSubmitted,
  trackGenerationStart,
  trackGenerationSuccess,
  trackValidationError,
  trackUnexpectedError,
  trackStepNavigation,
  trackDraftSaved,
  trackDraftDiscarded,
} from "@/src/features/documents/utils/analytics";

// Initialize schemas
import "@/src/features/documents/schemas/service-contract";
import "@/src/features/documents/schemas/nda";
import "@/src/features/documents/schemas/legal-notice";

type FlowStep = "selection" | "form" | "summary" | "result";

interface GenerationResult {
  documentId: string;
  contrato: string;
  pdfUrl?: string | null;
  warnings?: GenerationWarning[];
  metadata?: {
    documentType: string;
    templateVersion: string;
    aiModel?: string;
    aiCostUsd?: number;
  };
}

export default function GuidedDocumentCreationPage() {
  const router = useRouter();
  const { success, error: showError } = useToast();
  
  const [currentStep, setCurrentStep] = useState<FlowStep>("selection");
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentTypeId | null>(null);
  const [formData, setFormData] = useState<StructuredDocumentData>({});
  const [warnings, setWarnings] = useState<GenerationWarning[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Array<{ fieldId?: string; ruleId?: string; message: string }>>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track flow entry
  useEffect(() => {
    trackFlowEntry();
  }, []);

  // Autosave with documentType separation
  useEffect(() => {
    if (selectedDocumentType) {
      const draftKey = `document-draft-${selectedDocumentType}`;
      const saved = localStorage.getItem(draftKey);
      if (saved && !result) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(parsed);
          setHasUnsavedChanges(false);
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  }, [selectedDocumentType, result]);

  useEffect(() => {
    if (selectedDocumentType && !result && !loading && Object.keys(formData).length > 0) {
      const draftKey = `document-draft-${selectedDocumentType}`;
      setIsSaving(true);
      const timeout = setTimeout(() => {
        localStorage.setItem(draftKey, JSON.stringify(formData));
        setLastSaved(new Date());
        setIsSaving(false);
        setHasUnsavedChanges(false);
        trackDraftSaved(selectedDocumentType);
      }, 2000);
      return () => clearTimeout(timeout);
    } else {
      setIsSaving(false);
    }
  }, [formData, selectedDocumentType, result, loading]);

  // Track unsaved changes
  useEffect(() => {
    if (selectedDocumentType && Object.keys(formData).length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [formData, selectedDocumentType]);

  useEffect(() => {
    if (result && selectedDocumentType) {
      const draftKey = `document-draft-${selectedDocumentType}`;
      localStorage.removeItem(draftKey);
    }
  }, [result, selectedDocumentType]);

  // Evaluate warnings when form data changes
  useEffect(() => {
    if (selectedDocumentType && Object.keys(formData).length > 0) {
      const schema = getDocumentSchema(selectedDocumentType);
      if (schema) {
        const evaluatedWarnings = evaluateWarningRules(formData, schema.warningRules);
        setWarnings(evaluatedWarnings);
      }
    }
  }, [formData, selectedDocumentType]);

  const handleDocumentTypeSelect = (documentType: DocumentTypeId) => {
    trackDocumentTypeSelected(documentType);
    trackStepNavigation("selection", "form", documentType);
    
    setSelectedDocumentType(documentType);
    setFormData({});
    setWarnings([]);
    setError(null);
    setValidationErrors([]);
    setHasUnsavedChanges(false);
    setCurrentStep("form");
  };

  const handleFormSubmit = useCallback(async (data: StructuredDocumentData) => {
    if (!selectedDocumentType) return;

    const schema = getDocumentSchema(selectedDocumentType);
    if (!schema) {
      showError("Schema no encontrado para este tipo de documento");
      trackUnexpectedError(selectedDocumentType, "Schema no encontrado", "form");
      return;
    }

    // Validate form data
    const validationResult = validateFormData(data, schema);
    if (!validationResult.valid) {
      setValidationErrors(validationResult.errors);
      
      const fieldErrors = validationResult.errors.filter(e => e.fieldId);
      const semanticErrors = validationResult.errors.filter(e => e.ruleId);
      
      if (fieldErrors.length > 0) {
        trackValidationError(selectedDocumentType, "field", fieldErrors.length);
      }
      if (semanticErrors.length > 0) {
        trackValidationError(selectedDocumentType, "semantic", semanticErrors.length);
      }
      
      // Scroll to top to show errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Clear validation errors
    setValidationErrors([]);

    // Evaluate warnings
    const evaluatedWarnings = evaluateWarningRules(data, schema.warningRules);
    setWarnings(evaluatedWarnings);

    trackFormSubmitted(selectedDocumentType, evaluatedWarnings.length > 0);
    trackStepNavigation("form", "summary", selectedDocumentType);

    // Show summary step
    setFormData(data);
    setCurrentStep("summary");
  }, [selectedDocumentType, showError]);

  const handleGenerate = async () => {
    if (!selectedDocumentType) return;

    trackGenerationStart(selectedDocumentType);

    setLoading(true);
    setError(null);
    setValidationErrors([]);
    setLoadingProgress(0);
    setLoadingStep("Validando datos...");

    try {
      const schema = getDocumentSchema(selectedDocumentType);
      if (!schema) {
        throw new Error("Schema no encontrado");
      }

      // Build request payload according to CONTRATO_API_DOCUMENTOS.md
      const requestPayload = {
        documentType: selectedDocumentType,
        jurisdiction: formData.jurisdiccion,
        tone: formData.tono,
        ...formData,
      };

      setLoadingProgress(25);
      setLoadingStep("Generando contenido con IA...");

      const res = await fetch(`/api/_proxy/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      setLoadingProgress(70);
      setLoadingStep("Procesando respuesta...");

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("[guided] Respuesta no es JSON:", text.substring(0, 200));
        throw new Error("El servidor devolvió una respuesta inválida");
      }

      const json = await res.json();

      setLoadingProgress(90);
      setLoadingStep("Finalizando...");

      if (!res.ok || !json.ok) {
        // Handle validation errors (400)
        if (res.status === 400) {
          const errorMessage = json.message || json.error || "Error de validación";
          const details = json.details || [];
          throw new Error(`${errorMessage}${details.length > 0 ? `: ${details.join(", ")}` : ""}`);
        }
        throw new Error(json.message || json.error || "Error al generar el documento");
      }

      setLoadingProgress(100);
      setLoadingStep("¡Completado!");

      await new Promise(resolve => setTimeout(resolve, 500));

      const generationResult: GenerationResult = {
        documentId: json.documentId,
        contrato: json.contrato,
        pdfUrl: json.pdfUrl,
        warnings: json.warnings || [],
        metadata: json.metadata,
      };

      setResult(generationResult);
      setCurrentStep("result");
      setHasUnsavedChanges(false);
      
      trackGenerationSuccess(
        selectedDocumentType,
        generationResult.documentId,
        (generationResult.warnings?.length || 0) > 0
      );
      trackStepNavigation("summary", "result", selectedDocumentType);
      
      success("¡Documento generado exitosamente!");

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#059669", "#047857"],
      });
    } catch (err: any) {
      const errorMsg = err.message || "Error desconocido";
      setError(errorMsg);
      
      trackUnexpectedError(selectedDocumentType, errorMsg, "summary");
      
      showError(`No se pudo generar el documento: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToForm = () => {
    trackStepNavigation("summary", "form", selectedDocumentType);
    setCurrentStep("form");
    setError(null);
    setValidationErrors([]);
  };

  const handleBackToSelection = () => {
    if (hasUnsavedChanges && selectedDocumentType) {
      const confirmed = window.confirm(
        "Tenés cambios sin guardar. ¿Estás seguro de que querés cambiar el tipo de documento? Se perderán los datos ingresados."
      );
      if (!confirmed) {
        return;
      }
      trackDraftDiscarded(selectedDocumentType);
    }
    
    trackStepNavigation(currentStep, "selection", selectedDocumentType);
    setCurrentStep("selection");
    setSelectedDocumentType(null);
    setFormData({});
    setWarnings([]);
    setError(null);
    setValidationErrors([]);
    setHasUnsavedChanges(false);
  };

  const renderSelectionStep = () => {
    const schemas = getAllDocumentSchemas();
    const availableSchemas = schemas.filter(s => 
      ["service_contract", "nda", "legal_notice"].includes(s.id)
    );

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">¿Qué documento necesitás crear?</h2>
          <p className="text-gray-300">Seleccioná el tipo de documento que mejor se adapte a tu necesidad</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availableSchemas.map((schema) => (
            <button
              key={schema.id}
              onClick={() => handleDocumentTypeSelect(schema.id)}
              className="p-6 border-2 border-gray-700 rounded-lg hover:border-blue-500 hover:bg-gray-900/50 hover:shadow-lg transition-all text-left group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-blue-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-blue-400 transition-colors">
                    {schema.label}
                  </h3>
                  <p className="text-sm text-gray-300 mb-3">
                    {schema.description}
                  </p>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-gray-200">Cuándo usarlo:</p>
                    <ul className="text-xs text-gray-400 space-y-1">
                      {schema.useCases.slice(0, 2).map((useCase, i) => (
                        <li key={i} className="flex items-start">
                          <span className="mr-1 text-gray-500">•</span>
                          <span>{useCase}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderFormStep = () => {
    if (!selectedDocumentType) return null;

    const schema = getDocumentSchema(selectedDocumentType);
    if (!schema) {
      return <div>Schema no encontrado</div>;
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToSelection}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{schema.label}</h2>
            <p className="text-gray-600">{schema.description}</p>
          </div>
          <div className="flex items-center space-x-4">
            <AutosaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
            <Button
              variant="outline"
              onClick={handleBackToSelection}
            >
              Cambiar tipo
            </Button>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <ValidationErrorPanel
            errors={validationErrors}
            onDismiss={() => setValidationErrors([])}
            onFieldClick={(fieldId) => {
              // Scroll to field
              const fieldElement = document.querySelector(`[data-field-id="${fieldId}"]`);
              if (fieldElement) {
                fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
                (fieldElement as HTMLElement).focus();
              }
            }}
          />
        )}

        <DynamicForm
          schema={schema}
          initialData={formData}
          onSubmit={handleFormSubmit}
          onChange={(data) => setFormData(data)}
          disabled={loading}
        />
      </div>
    );
  };

  const renderSummaryStep = () => {
    if (!selectedDocumentType) return null;

    const schema = getDocumentSchema(selectedDocumentType);
    if (!schema) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBackToForm}
                disabled={loading}
                className="text-gray-600"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Resumen y Confirmación</h2>
            <p className="text-gray-600">Revisá los datos antes de generar el documento</p>
          </div>
          <Button
            variant="outline"
            onClick={handleBackToForm}
            disabled={loading}
          >
            Editar
          </Button>
        </div>

        <LegalSummary
          documentType={selectedDocumentType}
          data={formData}
          onEdit={() => setCurrentStep("form")}
        />

        {warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
              Advertencias
            </h3>
            <WarningsPanel warnings={warnings} />
            <p className="text-sm text-gray-500">
              Estas advertencias no bloquean la generación, pero te recomendamos revisarlas.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <HelpCircle className="h-4 w-4" />
            <span>Podés volver atrás para editar los datos antes de generar</span>
          </div>
          <div className="flex space-x-4">
            <Button
              variant="outline"
              onClick={handleBackToForm}
              disabled={loading}
            >
              Volver
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="min-w-[150px]"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {loadingStep}
                </>
              ) : (
                "Generar Documento"
              )}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 text-center">{loadingStep}</p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-red-900 mb-1">Error al generar documento</h4>
                <p className="text-sm text-red-800">{error}</p>
                <p className="text-xs text-red-700 mt-2">
                  Podés volver atrás para revisar y corregir los datos, o intentar nuevamente.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResultStep = () => {
    if (!result) return null;

    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
          <h2 className="text-2xl font-bold text-gray-900">¡Documento generado exitosamente!</h2>
          <p className="text-gray-600">Tu documento está listo para descargar o revisar</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Contenido Generado</h3>
            <div className="space-x-2">
              <Button
                onClick={async () => {
                  if (result.pdfUrl) {
                    window.open(result.pdfUrl, "_blank");
                  } else if (result.contrato) {
                    try {
                      const { generatePdfFromText } = await import("@/app/lib/pdfGenerator");
                      const schema = getDocumentSchema(selectedDocumentType || "service_contract");
                      const documentTitle = schema?.label || "Documento";
                      const fileName = result.documentId 
                        ? `documento-${result.documentId}.pdf`
                        : "documento.pdf";
                      generatePdfFromText(documentTitle, result.contrato, fileName);
                    } catch (err) {
                      console.error("Error generating PDF:", err);
                      showError("Error al generar el PDF. Intentá descargarlo desde el detalle del documento.");
                    }
                  }
                }}
              >
                Descargar PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/documents/${result.documentId}`)}
              >
                Ver Detalle
              </Button>
            </div>
          </div>

          <div className="prose max-w-none">
            <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded border">
              {result.contrato}
            </pre>
          </div>
        </div>

        {result.warnings && result.warnings.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900">Advertencias del Documento</h3>
            <WarningsPanel warnings={result.warnings} />
          </div>
        )}

        <div className="flex justify-center space-x-4 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              trackStepNavigation("result", "selection", selectedDocumentType);
              setCurrentStep("selection");
              setSelectedDocumentType(null);
              setFormData({});
              setResult(null);
              setError(null);
              setValidationErrors([]);
              setHasUnsavedChanges(false);
            }}
          >
            Crear Otro Documento
          </Button>
          <Button
            onClick={() => router.push("/documents")}
          >
            Ir al Dashboard
          </Button>
        </div>
      </div>
    );
  };

  return (
    <DashboardShell
      title="Crear documento legal"
      description="Generá documentos profesionales con IA usando nuestro flujo guiado."
      action={null}
    >
      <div className="flex justify-center">
        <div className="w-full max-w-4xl space-y-8">
          {currentStep === "selection" && renderSelectionStep()}
          {currentStep === "form" && renderFormStep()}
          {currentStep === "summary" && renderSummaryStep()}
          {currentStep === "result" && renderResultStep()}
        </div>
      </div>
    </DashboardShell>
  );
}

