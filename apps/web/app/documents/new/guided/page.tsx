/**
 * Guided Document Creation Flow
 * 
 * New guided flow based on document schemas.
 * Replaces the generic wizard with type-specific forms.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { CheckCircle, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { AutosaveIndicator } from "@/src/features/documents/ui/autosave/AutosaveIndicator";
import { ValidationErrorPanel } from "@/src/features/documents/ui/errors/ValidationErrorPanel";
import { darkModeClasses, darkBorderColors } from "@/src/features/documents/ui/styles/dark-mode";
import { DocumentCreationPageHeader } from "@/components/documents/DocumentCreationPageHeader";
import { DocumentCreationFooter } from "@/components/documents/DocumentCreationFooter";
import { DocumentTypeCard } from "@/components/documents/DocumentTypeCard";
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
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 px-6 md:px-20 py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
                Crear documento legal
              </h1>
              <p className="text-lg text-slate-400">
                Generá documentos profesionales con IA usando nuestro flujo guiado.
              </p>
            </div>

            {/* Selection Section */}
            <div className="space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white">
                  ¿Qué documento necesitás crear?
                </h2>
                <p className="text-slate-400">
                  Seleccioná el tipo de documento que mejor se adapte a tu necesidad
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {availableSchemas.map((schema) => (
                  <DocumentTypeCard
                    key={schema.id}
                    schema={schema}
                    onSelect={() => handleDocumentTypeSelect(schema.id)}
                  />
                ))}
              </div>
            </div>
          </div>
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
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 px-6 md:px-20 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSelection}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ← Volver
                </Button>
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    {schema.label}
                  </h1>
                  <p className="text-slate-400">
                    {schema.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <AutosaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
                  <Button
                    variant="outline"
                    onClick={handleBackToSelection}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Cambiar tipo
                  </Button>
                </div>
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
        </div>
      </div>
    );
  };

  const renderSummaryStep = () => {
    if (!selectedDocumentType) return null;

    const schema = getDocumentSchema(selectedDocumentType);
    if (!schema) return null;

    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 px-6 md:px-20 py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToForm}
                  disabled={loading}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ← Volver
                </Button>
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Resumen y Confirmación
                  </h1>
                  <p className="text-slate-400">
                    Revisá los datos antes de generar el documento
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleBackToForm}
                  disabled={loading}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Editar
                </Button>
              </div>
            </div>

        <LegalSummary
          documentType={selectedDocumentType}
          data={formData}
          onEdit={() => setCurrentStep("form")}
        />

            {warnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center text-white">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-400" />
                  Advertencias
                </h3>
                <WarningsPanel warnings={warnings} />
                <p className="text-sm text-slate-400">
                  Estas advertencias no bloquean la generación, pero te recomendamos revisarlas.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-slate-800">
              <div className="flex items-center space-x-2 text-sm text-slate-400">
                <span>Podés volver atrás para editar los datos antes de generar</span>
              </div>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={handleBackToForm}
                  disabled={loading}
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  Volver
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="min-w-[150px] bg-primary hover:bg-primary/90 text-white"
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
                <div className="w-full rounded-full h-2 bg-slate-800">
                  <div
                    className="h-2 rounded-full transition-all duration-300 bg-primary"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-center text-slate-400">{loadingStep}</p>
              </div>
            )}

            {error && (
              <div className={`p-4 rounded-lg ${darkModeClasses.errorPanel}`}>
                <div className="flex items-start space-x-2">
                  <AlertTriangle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${darkModeClasses.errorText}`} />
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 text-red-300`}>Error al generar documento</h4>
                    <p className={`text-sm text-red-300`}>{error}</p>
                    <p className={`text-xs mt-2 ${darkModeClasses.errorText}`}>
                      Podés volver atrás para revisar y corregir los datos, o intentar nuevamente.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResultStep = () => {
    if (!result) return null;

    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex-1 px-6 md:px-20 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Success Header */}
            <div className="text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto" />
              <h1 className="text-3xl font-bold text-white">
                ¡Documento generado exitosamente!
              </h1>
              <p className="text-slate-400">
                Tu documento está listo para descargar o revisar
              </p>
            </div>

            {/* Document Content */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Contenido Generado</h2>
                <div className="flex gap-3">
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
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    Descargar PDF
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/documents/${result.documentId}`)}
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    Ver Detalle
                  </Button>
                </div>
              </div>

              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm p-6 rounded-lg bg-slate-950 text-slate-200 border border-slate-800 font-mono overflow-x-auto">
                  {result.contrato}
                </pre>
              </div>
            </div>

            {/* Warnings */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Advertencias del Documento</h3>
                <WarningsPanel warnings={result.warnings} />
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-6 border-t border-slate-800">
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
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                Crear Otro Documento
              </Button>
              <Button
                onClick={() => router.push("/documents")}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                Ir al Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background-dark text-white">
      <DocumentCreationPageHeader />
      
      <main className="flex-1">
        {currentStep === "selection" && renderSelectionStep()}
        {currentStep === "form" && renderFormStep()}
        {currentStep === "summary" && renderSummaryStep()}
        {currentStep === "result" && renderResultStep()}
      </main>

      <DocumentCreationFooter />
    </div>
  );
}

