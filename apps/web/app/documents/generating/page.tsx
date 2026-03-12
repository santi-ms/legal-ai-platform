"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GenerationHeader } from "@/components/documents/GenerationHeader";
import { GenerationHero } from "@/components/documents/GenerationHero";
import { GenerationProgress } from "@/components/documents/GenerationProgress";
import { ActivityLog, type ActivityLogItem } from "@/components/documents/ActivityLog";
import { GenerationFooter } from "@/components/documents/GenerationFooter";
import { getDocumentSchema } from "@/src/features/documents/core/registry";
import type { DocumentTypeId } from "@/src/features/documents/core/types";

// Initialize schemas
import "@/src/features/documents/schemas/service-contract";
import "@/src/features/documents/schemas/nda";
import "@/src/features/documents/schemas/legal-notice";

const DEFAULT_ACTIVITIES: ActivityLogItem[] = [
  {
    id: "1",
    operation: "Análisis de parámetros de entrada",
    details: "Input: config_final_v2.json",
    status: "completed",
  },
  {
    id: "2",
    operation: "Búsqueda en base de jurisprudencia",
    details: "DB: JurisData_ES_2024",
    status: "completed",
  },
  {
    id: "3",
    operation: "Redactando cláusulas de responsabilidad",
    details: "Generando: Articulo_IV_Limites.docx",
    status: "processing",
  },
  {
    id: "4",
    operation: "Verificación de cumplimiento RGPD",
    details: "Módulo: Compliance_EU_v3",
    status: "pending",
  },
  {
    id: "5",
    operation: "Optimización de lenguaje técnico-legal",
    details: "Modo: Professional_Standard",
    status: "pending",
  },
];

export default function GeneratingDocumentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const documentType = (searchParams.get("type") as DocumentTypeId) || "service_contract";
  const documentId = searchParams.get("documentId");

  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [activities, setActivities] = useState<ActivityLogItem[]>(DEFAULT_ACTIVITIES);
  const [isGenerating, setIsGenerating] = useState(true);

  const schema = getDocumentSchema(documentType);
  const documentTitle = schema?.label || "Documento Legal";

  // Simulate progress updates
  useEffect(() => {
    if (!isGenerating) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setIsGenerating(false);
          return 100;
        }
        return prev + Math.random() * 5;
      });
    }, 500);

    // Update current step based on progress
    const stepInterval = setInterval(() => {
      if (progress < 30) {
        setCurrentStep("Analizando parámetros y estructura del documento");
      } else if (progress < 60) {
        setCurrentStep("Redactando cláusulas principales");
      } else if (progress < 85) {
        setCurrentStep("Verificando cumplimiento legal y optimizando lenguaje");
      } else {
        setCurrentStep("Finalizando y preparando documento");
      }
    }, 1000);

    // Update activities
    const activityInterval = setInterval(() => {
      setActivities((prev) => {
        const newActivities = [...prev];
        const processingIndex = newActivities.findIndex((a) => a.status === "processing");
        
        if (processingIndex !== -1 && progress > 50) {
          newActivities[processingIndex].status = "completed";
          if (processingIndex + 1 < newActivities.length) {
            newActivities[processingIndex + 1].status = "processing";
          }
        }
        
        return newActivities;
      });
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(stepInterval);
      clearInterval(activityInterval);
    };
  }, [isGenerating, progress]);

  // Redirect when complete
  useEffect(() => {
    if (progress >= 100 && documentId) {
      const timeout = setTimeout(() => {
        router.push(`/documents/${documentId}`);
      }, 1500);
      return () => clearTimeout(timeout);
    }
  }, [progress, documentId, router]);

  const handleCancel = () => {
    setIsGenerating(false);
    router.push("/dashboard");
  };

  return (
    <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <div className="layout-container flex h-full grow flex-col">
        <GenerationHeader onCancel={handleCancel} />

        <main className="flex-1 flex flex-col items-center py-8 px-4 md:px-10">
          <div className="w-full max-w-[1000px] flex flex-col gap-8">
            {/* Hero Visual Feedback */}
            <GenerationHero
              documentTitle={documentTitle}
              subtitle="La inteligencia legal está redactando su documento según los parámetros establecidos."
              isActive={isGenerating}
            />

            {/* Progress Section */}
            <GenerationProgress percentage={progress} currentStep={currentStep} />

            {/* Terminal-Style Activity Log */}
            <ActivityLog items={activities} />

            {/* Footer Hint */}
            <GenerationFooter
              estimatedTime="entre 45 y 60 segundos"
              onCancel={isGenerating ? handleCancel : undefined}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

