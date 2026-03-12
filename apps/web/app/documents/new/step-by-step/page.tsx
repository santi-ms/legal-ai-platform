"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { DocumentCreationHeader } from "@/components/documents/DocumentCreationHeader";
import { DocumentProgressBar } from "@/components/documents/DocumentProgressBar";
import { DocumentSection } from "@/components/documents/DocumentSection";
import { DocumentNavigationButtons } from "@/components/documents/DocumentNavigationButtons";
import { DocumentCreationFooter } from "@/components/documents/DocumentCreationFooter";
import { LegalTipSidebar } from "@/components/documents/LegalTipSidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Users, Info } from "lucide-react";
import { getDocumentSchema } from "@/src/features/documents/core/registry";
import type { DocumentTypeId, StructuredDocumentData } from "@/src/features/documents/core/types";

// Initialize schemas
import "@/src/features/documents/schemas/service-contract";
import "@/src/features/documents/schemas/nda";
import "@/src/features/documents/schemas/legal-notice";

const STEPS = [
  { id: "inicio", label: "Inicio" },
  { id: "partes", label: "Partes" },
  { id: "inmueble", label: "Inmueble" },
  { id: "clausulas", label: "Cláusulas" },
  { id: "firma", label: "Firma" },
];

const LEGAL_TIPS: Record<string, string> = {
  partes: "Asegúrese de que los nombres coincidan exactamente con los documentos de identidad para evitar nulidades en el contrato.",
  inmueble: "La descripción del inmueble debe ser precisa y completa, incluyendo dirección completa, superficie y características principales.",
  clausulas: "Revise cuidadosamente todas las cláusulas antes de continuar. Puede personalizar términos y condiciones según sus necesidades.",
  firma: "Una vez firmado, el documento tendrá validez jurídica. Asegúrese de que todas las partes estén de acuerdo con los términos.",
};

export default function StepByStepDocumentCreationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const documentType = (searchParams.get("type") as DocumentTypeId) || "service_contract";
  const [currentStepIndex, setCurrentStepIndex] = useState(1); // Paso 2 de 5 (índice 1)
  const [formData, setFormData] = useState<StructuredDocumentData>({});

  const schema = getDocumentSchema(documentType);
  const documentTitle = schema?.label || "Documento Legal";

  // Legal tip for current step
  const currentStepId = STEPS[currentStepIndex]?.id || "partes";
  const legalTip = LEGAL_TIPS[currentStepId] || LEGAL_TIPS.partes;

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    } else {
      router.push("/documents/new/guided");
    }
  };

  const handleNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Final step - redirect to guided flow with data
      router.push(`/documents/new/guided?type=${documentType}&step=form`);
    }
  };

  // Example: Step 2 - Parties Information (Arrendador/Arrendatario)
  const renderPartiesStep = () => (
    <div className="flex flex-col gap-8">
      {/* Arrendador Section */}
      <DocumentSection
        icon={User}
        title="Información del Arrendador"
        description="Ingrese los datos de la persona o entidad propietaria del inmueble."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nombre completo o Razón Social
            </Label>
            <Input
              className="rounded-lg border-primary/20 bg-white/50 dark:bg-background-dark/50 p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Ej: Juan Pérez"
              value={formData.arrendador_nombre || ""}
              onChange={(e) => handleFieldChange("arrendador_nombre", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              DNI / NIE / CIF
            </Label>
            <Input
              className="rounded-lg border-primary/20 bg-white/50 dark:bg-background-dark/50 p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="00000000X"
              value={formData.arrendador_dni || ""}
              onChange={(e) => handleFieldChange("arrendador_dni", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Dirección de notificaciones
            </Label>
            <Input
              className="rounded-lg border-primary/20 bg-white/50 dark:bg-background-dark/50 p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Calle, número, piso, ciudad"
              value={formData.arrendador_direccion || ""}
              onChange={(e) => handleFieldChange("arrendador_direccion", e.target.value)}
            />
          </div>
        </div>
      </DocumentSection>

      {/* Arrendatario Section */}
      <DocumentSection
        icon={Users}
        title="Información del Arrendatario"
        description="Datos de la persona que alquilará la propiedad."
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nombre del Arrendatario
            </Label>
            <Input
              className="rounded-lg border-primary/20 bg-white/50 dark:bg-background-dark/50 p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="Nombre completo"
              value={formData.arrendatario_nombre || ""}
              onChange={(e) => handleFieldChange("arrendatario_nombre", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Documento de Identidad
            </Label>
            <Input
              className="rounded-lg border-primary/20 bg-white/50 dark:bg-background-dark/50 p-3 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              placeholder="DNI o Pasaporte"
              value={formData.arrendatario_dni || ""}
              onChange={(e) => handleFieldChange("arrendatario_dni", e.target.value)}
            />
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 flex items-center gap-2 rounded-lg bg-primary/5 p-4 text-sm text-primary">
          <Info className="w-5 h-5" />
          <p>
            ¿Hay más de un arrendatario? Podrá añadir co-arrendatarios en el siguiente paso.
          </p>
        </div>
      </DocumentSection>
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStepIndex) {
      case 0:
        // Step 1: Inicio (redirect to selection)
        router.push("/documents/new/guided");
        return null;
      case 1:
        return renderPartiesStep();
      case 2:
        // Step 3: Inmueble
        return (
          <DocumentSection
            icon={User}
            title="Información del Inmueble"
            description="Detalles del inmueble a arrendar."
          >
            <p className="text-slate-500 dark:text-slate-400">
              Esta sección se completará próximamente.
            </p>
          </DocumentSection>
        );
      case 3:
        // Step 4: Cláusulas
        return (
          <DocumentSection
            icon={User}
            title="Cláusulas del Contrato"
            description="Configure las cláusulas y términos del contrato."
          >
            <p className="text-slate-500 dark:text-slate-400">
              Esta sección se completará próximamente.
            </p>
          </DocumentSection>
        );
      case 4:
        // Step 5: Firma
        return (
          <DocumentSection
            icon={User}
            title="Firma del Contrato"
            description="Revise y firme el contrato."
          >
            <p className="text-slate-500 dark:text-slate-400">
              Esta sección se completará próximamente.
            </p>
          </DocumentSection>
        );
      default:
        return renderPartiesStep();
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100">
      <DocumentCreationHeader />

      <main className="flex-1 px-6 py-8 lg:px-20">
        <div className="mx-auto max-w-4xl">
          <DocumentProgressBar
            currentStep={currentStepIndex + 1}
            totalSteps={STEPS.length}
            documentTitle={documentTitle}
            steps={STEPS}
          />

          {renderCurrentStep()}

          <DocumentNavigationButtons
            onPrevious={handlePrevious}
            onNext={handleNext}
            showPrevious={currentStepIndex > 0}
            showNext={currentStepIndex < STEPS.length - 1}
            nextLabel={currentStepIndex === STEPS.length - 1 ? "Finalizar" : "Continuar"}
          />
        </div>
      </main>

      <DocumentCreationFooter />

      <LegalTipSidebar tip={legalTip} />
    </div>
  );
}

