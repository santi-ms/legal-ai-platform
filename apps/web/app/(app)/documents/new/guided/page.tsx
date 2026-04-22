/**
 * Guided Document Creation Flow
 * 
 * New guided flow based on document schemas.
 * Replaces the generic wizard with type-specific forms.
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { CheckCircle, AlertTriangle, Loader2, ArrowLeft, Search, Brain, FileCheck, Sparkles } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { AutosaveIndicator } from "@/src/features/documents/ui/autosave/AutosaveIndicator";
import { ValidationErrorPanel } from "@/src/features/documents/ui/errors/ValidationErrorPanel";
import { PlainTextDocumentEditor } from "@/src/features/documents/ui/editor/PlainTextDocumentEditor";
import { usePlainTextDocumentEditor } from "@/src/features/documents/ui/editor/usePlainTextDocumentEditor";
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
import {
  listClients,
  listExpedientes,
  listReferenceDocuments,
  patchDocumentClient,
  patchDocumentExpediente,
  type Client,
  type Expediente,
  type ReferenceDocument,
  REFERENCE_DOCUMENT_TYPES,
} from "@/app/lib/webApi";
import { Users, Briefcase, ChevronDown as ChevronDownIcon, BookMarked } from "lucide-react";

// Initialize schemas — all document types
import "@/src/features/documents/schemas/service-contract";
import "@/src/features/documents/schemas/nda";
import "@/src/features/documents/schemas/legal-notice";
import "@/src/features/documents/schemas/lease-agreement";
import "@/src/features/documents/schemas/debt-recognition";
import "@/src/features/documents/schemas/simple-authorization";

type FlowStep = "selection" | "form" | "summary" | "result";

interface OutputWarning {
  code: string;
  message: string;
  match?: string;
  severity: "error" | "warning";
}

interface GenerationResult {
  documentId: string;
  contrato: string;
  pdfUrl?: string | null;
  warnings?: GenerationWarning[];
  /** true when the backend detected placeholders or incomplete content */
  incompleteDocument?: boolean;
  /** list of issues detected by post-generation validation */
  outputWarnings?: OutputWarning[];
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
  const [confirmBackOpen, setConfirmBackOpen] = useState(false);

  // Pre-selection of client and expediente
  const [selectedClientId, setSelectedClientId]         = useState<string>("");
  const [selectedExpedienteId, setSelectedExpedienteId] = useState<string>("");
  const [clientList, setClientList]                     = useState<Client[]>([]);
  const [expedienteList, setExpedienteList]             = useState<Expediente[]>([]);
  const [loadingContext, setLoadingContext]              = useState(false);

  // Reference document selector
  const [selectedReferenceId, setSelectedReferenceId]   = useState<string>("");
  const [referenceDocuments, setReferenceDocuments]     = useState<ReferenceDocument[]>([]);
  const [loadingReferences, setLoadingReferences]       = useState(false);

  // Ref para scroll automático al bloque de error de generación
  const generationErrorRef = useRef<HTMLDivElement>(null);

  const documentEditor = usePlainTextDocumentEditor({
    documentId: result?.documentId,
    initialContent: result?.contrato ?? "",
    originalContent: result?.contrato ?? "",
    enabled: currentStep === "result" && Boolean(result?.documentId),
  });

  useEffect(() => {
    if (error && generationErrorRef.current) {
      generationErrorRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [error]);

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

  // Warn browser on tab/window close when there are unsaved changes
  useEffect(() => {
    if (!hasUnsavedChanges || currentStep === "result") return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, currentStep]);

  // Load clients + expedientes + reference docs when user reaches summary step
  useEffect(() => {
    if (currentStep !== "summary") return;
    if (clientList.length > 0 || loadingContext) return;
    setLoadingContext(true);
    Promise.all([
      listClients({ pageSize: 200, sort: "name:asc" }),
      listExpedientes({ pageSize: 200, sort: "title:asc" }),
    ]).then(([cRes, eRes]) => {
      setClientList(cRes.clients);
      setExpedienteList(eRes.expedientes);
    }).catch(() => { /* ignore — context association is optional */ })
      .finally(() => setLoadingContext(false));
  }, [currentStep, clientList.length, loadingContext]);

  // Load reference documents filtered by selected document type when reaching summary
  useEffect(() => {
    if (currentStep !== "summary" || !selectedDocumentType) return;
    if (referenceDocuments.length > 0 || loadingReferences) return;
    setLoadingReferences(true);
    listReferenceDocuments(selectedDocumentType)
      .then((docs) => setReferenceDocuments(docs))
      .catch(() => { /* ignore — reference is optional */ })
      .finally(() => setLoadingReferences(false));
  }, [currentStep, selectedDocumentType, referenceDocuments.length, loadingReferences]);

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
        tone: "formal_technical",
        ...formData,
        ...(selectedReferenceId ? { referenceDocumentId: selectedReferenceId } : {}),
        ...(selectedExpedienteId ? { expedienteId: selectedExpedienteId } : {}),
      };

      setLoadingProgress(15);
      setLoadingStep("Iniciando generación con IA...");

      // 1. Iniciar generación — responde inmediatamente con un jobId
      const res = await fetch(`/api/_proxy/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("[guided] Respuesta no es JSON:", text.substring(0, 200));
        throw new Error("El servidor devolvió una respuesta inválida");
      }

      const startData = await res.json();

      if (!res.ok || !startData.ok) {
        if (res.status === 400) {
          const errorMessage = startData.message || startData.error || "Error de validación";
          const details = startData.details || [];
          throw new Error(`${errorMessage}${details.length > 0 ? `: ${details.join(", ")}` : ""}`);
        }
        throw new Error(startData.message || startData.error || "Error al generar el documento");
      }

      const { jobId } = startData;

      // 2. Polling hasta que el job esté listo (máx. 4 minutos)
      setLoadingProgress(30);
      setLoadingStep("Generando documento con IA...");

      let json: any = null;
      const MAX_ATTEMPTS = 120;
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        const pollRes = await fetch(`/api/_proxy/documents/jobs/${jobId}`);
        const pollData = await pollRes.json();

        if (pollData.status === "done") {
          json = pollData;
          break;
        }
        if (pollData.status === "error") {
          throw new Error(pollData.message || "Error al generar el documento");
        }

        // Actualizar progreso mientras espera
        const progress = Math.min(30 + Math.floor((i / MAX_ATTEMPTS) * 55), 85);
        setLoadingProgress(progress);
      }

      if (!json) throw new Error("El documento tardó demasiado en generarse. Intentá de nuevo.");

      setLoadingProgress(95);
      setLoadingStep("Finalizando...");

      await new Promise(resolve => setTimeout(resolve, 400));

      const generationResult: GenerationResult = {
        documentId: json.documentId,
        contrato: json.contrato,
        pdfUrl: json.pdfUrl,
        warnings: json.warnings || [],
        incompleteDocument: json.incompleteDocument || false,
        outputWarnings: json.outputWarnings || [],
        metadata: json.metadata,
      };

      setResult(generationResult);
      setCurrentStep("result");
      setHasUnsavedChanges(false);

      // Associate client and/or expediente in background (silent)
      if (selectedClientId) {
        patchDocumentClient(generationResult.documentId, selectedClientId).catch(() => {});
      }
      if (selectedExpedienteId) {
        patchDocumentExpediente(generationResult.documentId, selectedExpedienteId).catch(() => {});
      }

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
      
      showError("Error al generar. Revisá los datos e intentá de nuevo.");
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
      // Abre el ConfirmDialog en lugar de window.confirm
      setConfirmBackOpen(true);
      return;
    }
    executeBackToSelection();
  };

  const executeBackToSelection = () => {
    if (selectedDocumentType) {
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
    setConfirmBackOpen(false);
    setSelectedClientId("");
    setSelectedExpedienteId("");
    setSelectedReferenceId("");
    setReferenceDocuments([]);
  };

  const renderSelectionStep = () => {
    // Show all registered schemas in a stable order
    const orderedIds = [
      "service_contract",
      "nda",
      "legal_notice",
      "lease",
      "debt_recognition",
      "simple_authorization",
    ];
    const allSchemas = getAllDocumentSchemas();
    const availableSchemas = orderedIds
      .map((id) => allSchemas.find((s) => s.id === id))
      .filter(Boolean) as typeof allSchemas;

    return (
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex-1 px-4 sm:px-6 md:px-20 py-6 sm:py-10 md:py-12">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-12 text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-3 sm:mb-4 leading-tight">
                Crear documento legal
              </h1>
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400">
                Generá documentos profesionales con IA usando nuestro flujo guiado.
              </p>
            </div>

            {/* Selection Section */}
            <div className="space-y-8">
              <div className="space-y-2 text-center">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
                  ¿Qué documento necesitás crear?
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  Seleccioná el tipo de documento que mejor se adapte a tu necesidad
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex-1 px-4 sm:px-6 md:px-20 py-6 md:py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToSelection}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ← Volver
                </Button>
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {schema.label}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    {schema.description}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <AutosaveIndicator isSaving={isSaving} lastSaved={lastSaved} />
                  <Button
                    variant="outline"
                    onClick={handleBackToSelection}
                    className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex-1 px-4 sm:px-6 md:px-20 py-6 md:py-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToForm}
                  disabled={loading}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  ← Volver
                </Button>
              </div>
              
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    Resumen y Confirmación
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    Revisá los datos antes de generar el documento
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={handleBackToForm}
                  disabled={loading}
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
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

            {/* ─── Contexto del documento (cliente + expediente) ─────────── */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Contexto del documento <span className="font-normal text-slate-400">(opcional)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                Asociá el documento a un cliente o expediente existente. Podés hacerlo también después desde el detalle.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Cliente
                  </label>
                  <div className="relative">
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      disabled={loadingContext}
                      className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-8 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Sin asignar</option>
                      {clientList.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>

                {/* Expediente */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Expediente
                  </label>
                  <div className="relative">
                    <select
                      value={selectedExpedienteId}
                      onChange={(e) => setSelectedExpedienteId(e.target.value)}
                      disabled={loadingContext}
                      className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-8 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Sin asignar</option>
                      {expedienteList.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.number ? `#${ex.number} · ` : ""}{ex.title}
                        </option>
                      ))}
                    </select>
                    <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Documento de referencia para IA ─────────────────────── */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Documento de referencia para IA <span className="font-normal text-slate-400">(opcional)</span>
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 -mt-1">
                La IA usará el formato y estilo del documento seleccionado como base para la generación.
                Podés subir tus propios modelos en{" "}
                <a href="/documents/references" className="text-primary underline underline-offset-2">
                  Referencias IA
                </a>.
              </p>
              {loadingReferences ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando referencias...
                </div>
              ) : referenceDocuments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No hay documentos de referencia para este tipo. Subí uno desde{" "}
                  <a href="/documents/references" className="text-primary underline underline-offset-2">
                    Referencias IA
                  </a>.
                </p>
              ) : (
                <div className="relative">
                  <select
                    value={selectedReferenceId}
                    onChange={(e) => setSelectedReferenceId(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 pr-8 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Sin referencia</option>
                    {referenceDocuments.map((doc) => (
                      <option key={doc.id} value={doc.id}>
                        {doc.originalName}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                </div>
              )}
              {selectedReferenceId && (
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  La IA adaptará el documento al formato del modelo seleccionado.
                </p>
              )}
            </div>

            {warnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center text-slate-900 dark:text-white">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-500" />
                  Advertencias
                </h3>
                <WarningsPanel warnings={warnings} />
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Estas advertencias no bloquean la generación, pero te recomendamos revisarlas.
                </p>
              </div>
            )}

            <div className="flex justify-between items-center pt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                <span>Podés volver atrás para editar los datos antes de generar</span>
              </div>
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={handleBackToForm}
                  disabled={loading}
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Volver
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="min-w-[160px] bg-primary hover:bg-primary/90 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generar Documento
                    </>
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div
                ref={generationErrorRef}
                className="p-5 rounded-xl bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-700 scroll-mt-8"
              >
                <div className="flex items-start gap-3">
                  <div className="size-9 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center shrink-0 mt-0.5">
                    <AlertTriangle className="h-4 w-4 text-red-500 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-red-700 dark:text-red-300 mb-1">
                      No se pudo generar el documento
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-300 break-words">
                      {error}
                    </p>
                    <p className="text-xs mt-2 text-red-500 dark:text-red-400">
                      Revisá los datos ingresados o intentá nuevamente.
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBackToForm}
                    className="border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40"
                  >
                    Revisar datos
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleGenerate}
                    disabled={loading}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        Reintentando...
                      </>
                    ) : (
                      "Intentar de nuevo"
                    )}
                  </Button>
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
      <div className="min-h-[100dvh] flex flex-col">
        <div className="flex-1 px-4 sm:px-6 md:px-20 py-6 sm:py-10 md:py-12">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Header — condicional según calidad del documento */}
            {result.incompleteDocument ? (
              <div className="text-center space-y-3">
                <AlertTriangle className="h-14 w-14 text-amber-500 mx-auto" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  Documento generado con advertencias
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  El sistema detectó posibles problemas. Revisá y editá el contenido antes de descargar el PDF.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <CheckCircle className="h-14 w-14 text-emerald-500 mx-auto" />
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                  ¡Documento generado exitosamente!
                </h1>
                <p className="text-slate-600 dark:text-slate-400">
                  Revisá el contenido, editalo si necesitás, y descargá el PDF.
                </p>
              </div>
            )}

            {/* Alerta de validación de output */}
            {result.incompleteDocument && result.outputWarnings && result.outputWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <p className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                    Se detectaron {result.outputWarnings.filter(w => w.severity === "error").length} problema(s) — editá el contenido para corregirlos antes de descargar
                  </p>
                </div>
                <ul className="space-y-1.5 pl-7">
                  {result.outputWarnings.map((w, i) => (
                    <li key={i} className="text-sm text-amber-700 dark:text-amber-400 list-disc">
                      {w.message}
                      {w.match && (
                        <code className="ml-1 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-mono">
                          {w.match}
                        </code>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ─── Editor de documento ───────────────────────────────── */}
            <PlainTextDocumentEditor
              content={documentEditor.content}
              originalContent={documentEditor.originalContent}
              isDirty={documentEditor.isDirty}
              isManualSaving={documentEditor.isManualSaving}
              isSaving={documentEditor.isSaving}
              isAutosaveRetrying={documentEditor.isAutosaveRetrying}
              saveStatus={documentEditor.saveStatus}
              saveError={documentEditor.saveError}
              lastSavedAt={documentEditor.lastSavedAt}
              isDownloadingPdf={documentEditor.isDownloadingPdf}
              pdfDownloadError={documentEditor.pdfDownloadError}
              editorRef={documentEditor.editorRef}
              onSave={documentEditor.save}
              onRestoreOriginal={documentEditor.restoreOriginal}
              onDownloadPdf={documentEditor.downloadPdf}
              onDismissPdfDownloadError={documentEditor.dismissPdfDownloadError}
              onEditorInput={documentEditor.handleEditorInput}
              onEditorPaste={documentEditor.handleEditorPaste}
              onEditorDrop={documentEditor.handleEditorDrop}
              onEditorKeyDown={documentEditor.handleEditorKeyDown}
            />

            {/* Advertencias pre-generación */}
            {result.warnings && result.warnings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">Advertencias del formulario</h3>
                <WarningsPanel warnings={result.warnings} />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="outline"
                onClick={() => documentEditor.requestNavigation(() => {
                  trackStepNavigation("result", "selection", selectedDocumentType);
                  setCurrentStep("selection");
                  setSelectedDocumentType(null);
                  setFormData({});
                  setResult(null);
                  setError(null);
                  setValidationErrors([]);
                  setHasUnsavedChanges(false);
                })}
                className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Crear otro documento
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => documentEditor.requestNavigation(() => router.push(`/documents/${result.documentId}`))}
                  className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Ver detalle
                </Button>
                <Button
                  onClick={() => documentEditor.requestNavigation(() => router.push("/documents"))}
                  className="bg-primary hover:bg-primary/90 text-white"
                >
                  Ir al Dashboard
                </Button>
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  };

  // Resolución del icono y mensaje según el progreso actual
  const generationStepMeta = (() => {
    if (loadingProgress < 25)
      return { Icon: Search, label: "Validando datos del documento...", hint: "Verificando campos y estructura" };
    if (loadingProgress < 70)
      return { Icon: Brain, label: "Generando con inteligencia artificial...", hint: "Esto puede tomar unos segundos" };
    if (loadingProgress < 100)
      return { Icon: FileCheck, label: "Guardando el documento...", hint: "Procesando y almacenando el resultado" };
    return { Icon: CheckCircle, label: "¡Completado!", hint: "El documento está listo" };
  })();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <DocumentCreationPageHeader />

      <main className="flex-1 bg-white dark:bg-slate-900">
        {currentStep === "selection" && renderSelectionStep()}
        {currentStep === "form" && renderFormStep()}
        {currentStep === "summary" && renderSummaryStep()}
        {currentStep === "result" && renderResultStep()}
      </main>

      <DocumentCreationFooter />

      {/* Overlay de generación
          - Siempre montado mientras loading === true para que CSS pueda hacer fade-in
          - animate-in viene de Tailwind (fade-in + zoom-in desde el centro)
          - No bloquea scroll si la carga es muy corta gracias al delay de 150ms en backdrop */}
      {loading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-label="Generando documento"
          aria-live="polite"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-sm p-6 sm:p-8 flex flex-col items-center gap-5 animate-in zoom-in-95 duration-200">
            {/* Icono animado */}
            <div className="relative flex items-center justify-center mt-2">
              <div className="absolute size-16 rounded-full bg-primary/10 animate-ping opacity-50" />
              <div className="relative size-14 rounded-full bg-primary/10 flex items-center justify-center">
                {loadingProgress === 100 ? (
                  <generationStepMeta.Icon className="w-7 h-7 text-emerald-500" />
                ) : (
                  <generationStepMeta.Icon className="w-7 h-7 text-primary" />
                )}
              </div>
            </div>

            {/* Texto principal */}
            <div className="text-center space-y-1.5">
              <p className="text-base font-semibold text-slate-900 dark:text-white leading-snug">
                {generationStepMeta.label}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {generationStepMeta.hint}
              </p>
            </div>

            {/* Barra de progreso */}
            <div className="w-full space-y-1.5">
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-2 rounded-full bg-primary transition-all duration-500 ease-out"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <p className="text-xs text-right text-slate-400 dark:text-slate-500 tabular-nums">
                {loadingProgress}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmación de descarte de borrador */}
      <ConfirmDialog
        open={confirmBackOpen}
        variant="destructive"
        title="¿Descartás los cambios?"
        description="Tenés datos ingresados que aún no se guardaron. Si volvés a la selección, se perderán. Esta acción no se puede deshacer."
        confirmLabel="Sí, descartar"
        cancelLabel="Seguir editando"
        onConfirm={executeBackToSelection}
        onCancel={() => setConfirmBackOpen(false)}
      />

      <ConfirmDialog
        open={documentEditor.confirmNavigationOpen}
        variant="destructive"
        title="Hay cambios sin guardar"
        description="Si continuás con esta navegación, vas a perder las ediciones del documento que todavía no guardaste."
        confirmLabel="Salir igual"
        cancelLabel="Seguir editando"
        onConfirm={documentEditor.confirmNavigation}
        onCancel={documentEditor.cancelNavigation}
      />
    </div>
  );
}

