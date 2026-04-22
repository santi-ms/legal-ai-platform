"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GenerationHeader } from "@/components/documents/GenerationHeader";
import { GenerationHero } from "@/components/documents/GenerationHero";
import { GenerationProgress } from "@/components/documents/GenerationProgress";
import { ActivityLog, type ActivityLogItem } from "@/components/documents/ActivityLog";
import { GenerationFooter } from "@/components/documents/GenerationFooter";
import { getDocumentSchema } from "@/src/features/documents/core/registry";
import type { DocumentTypeId } from "@/src/features/documents/core/types";
import { getDocument } from "@/app/lib/webApi";

// Initialize schemas
import "@/src/features/documents/schemas/service-contract";
import "@/src/features/documents/schemas/nda";
import "@/src/features/documents/schemas/legal-notice";

// Pasos del activity log — se marcan como completados según el progreso real
const ACTIVITY_STEPS: ActivityLogItem[] = [
  {
    id: "1",
    operation: "Análisis de parámetros y estructura del documento",
    details: "Procesando configuración inicial",
    status: "processing",
  },
  {
    id: "2",
    operation: "Búsqueda en base de jurisprudencia argentina",
    details: "DB: JurisData_AR_2024",
    status: "pending",
  },
  {
    id: "3",
    operation: "Redactando cláusulas principales",
    details: "Generando contenido legal",
    status: "pending",
  },
  {
    id: "4",
    operation: "Verificación de cumplimiento legal",
    details: "Módulo: Compliance_AR",
    status: "pending",
  },
  {
    id: "5",
    operation: "Optimización y preparación del documento",
    details: "Modo: Professional_Standard",
    status: "pending",
  },
];

// Mapeo de progreso a paso del activity log
function getStepIndexForProgress(progress: number): number {
  if (progress < 20) return 0;
  if (progress < 40) return 1;
  if (progress < 60) return 2;
  if (progress < 80) return 3;
  return 4;
}

// Descripción del paso actual según progreso
function getCurrentStep(progress: number): string {
  if (progress < 20) return "Analizando parámetros y estructura del documento";
  if (progress < 40) return "Consultando jurisprudencia relevante";
  if (progress < 60) return "Redactando cláusulas principales";
  if (progress < 80) return "Verificando cumplimiento legal argentino";
  if (progress < 100) return "Optimizando lenguaje y preparando documento";
  return "¡Documento generado con éxito!";
}

// Estados del backend que indican que la generación terminó
const DONE_STATUSES = ["generated", "needs_review", "reviewed", "final", "draft"];

function GeneratingDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentType = (searchParams.get("type") as DocumentTypeId) || "service_contract";
  const documentId = searchParams.get("documentId");

  const [progress, setProgress] = useState(0);
  const [activities, setActivities] = useState<ActivityLogItem[]>(ACTIVITY_STEPS);
  const [isDone, setIsDone] = useState(false);
  const [hasError, setHasError] = useState(false);
  const progressRef = useRef(0);
  const doneRef = useRef(false);

  const schema = getDocumentSchema(documentType);
  const documentTitle = schema?.label || "Documento Legal";

  // Animación de progreso suave — avanza solo hasta 90% mientras espera el backend
  useEffect(() => {
    if (doneRef.current) return;

    const tick = setInterval(() => {
      setProgress((prev) => {
        if (doneRef.current) return 100;
        // Avanza rápido al principio, más lento al acercarse al 90%
        const remaining = 90 - prev;
        if (remaining <= 0) return prev;
        const step = Math.max(0.3, remaining * 0.04);
        const next = Math.min(90, prev + step);
        progressRef.current = next;
        return next;
      });
    }, 400);

    return () => clearInterval(tick);
  }, []);

  // Actualiza el activity log según el progreso
  useEffect(() => {
    const currentStepIndex = getStepIndexForProgress(progress);
    setActivities(
      ACTIVITY_STEPS.map((step, index) => ({
        ...step,
        status:
          index < currentStepIndex
            ? "completed"
            : index === currentStepIndex
            ? "processing"
            : "pending",
      }))
    );
  }, [Math.floor(progress / 20)]); // solo recalcula cada 20%

  // Polling al backend para detectar cuando terminó la generación
  useEffect(() => {
    if (!documentId) {
      // Sin documentId, usamos solo la animación (fallback)
      const timeout = setTimeout(() => {
        doneRef.current = true;
        setProgress(100);
        setIsDone(true);
      }, 12000);
      return () => clearTimeout(timeout);
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 60; // 60 * 2s = 2 minutos máximo

    const poll = setInterval(async () => {
      attempts++;

      try {
        const doc = await getDocument(documentId as string);
        const status = doc?.status;

        if (status && DONE_STATUSES.includes(status as string)) {
          clearInterval(poll);
          doneRef.current = true;
          // Marcar todos los pasos como completados
          setActivities(ACTIVITY_STEPS.map((s) => ({ ...s, status: "completed" })));
          setProgress(100);
          setIsDone(true);
          return;
        }
      } catch {
        // Silenciar errores de polling, seguir intentando
      }

      if (attempts >= MAX_ATTEMPTS) {
        clearInterval(poll);
        setHasError(true);
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [documentId]);

  // Redirigir cuando esté listo
  useEffect(() => {
    if (!isDone || !documentId) return;
    const timeout = setTimeout(() => {
      router.push(`/documents/${documentId}`);
    }, 1200);
    return () => clearTimeout(timeout);
  }, [isDone, documentId, router]);

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] gap-6 px-4">
        <div className="text-center space-y-2">
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            La generación está tardando más de lo esperado
          </p>
          <p className="text-sm text-slate-500">
            El documento puede haberse generado igual. Revisá tus documentos.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.push("/documents")}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Ver mis documentos
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Volver al dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-auto min-h-[100dvh] w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <div className="layout-container flex h-full grow flex-col">
        <GenerationHeader onCancel={handleCancel} />

        <main className="flex-1 flex flex-col items-center py-8 px-4 md:px-10">
          <div className="w-full max-w-[1000px] flex flex-col gap-8">
            <GenerationHero
              documentTitle={documentTitle}
              subtitle="La inteligencia legal está redactando su documento según los parámetros establecidos."
              isActive={!isDone}
            />

            <GenerationProgress
              percentage={Math.min(100, progress)}
              currentStep={getCurrentStep(progress)}
            />

            <ActivityLog items={activities} />

            <GenerationFooter
              estimatedTime="entre 20 y 60 segundos"
              onCancel={!isDone ? handleCancel : undefined}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function GeneratingDocumentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[100dvh]">
          <div className="animate-pulse text-slate-500">Cargando...</div>
        </div>
      }
    >
      <GeneratingDocumentContent />
    </Suspense>
  );
}
