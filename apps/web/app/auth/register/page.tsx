"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import { logger } from "@/app/lib/logger";
import { RegisterSidebar } from "@/components/auth/RegisterSidebar";
import { RegisterHeader } from "@/components/auth/RegisterHeader";
import { RegisterFormStep1 } from "@/components/auth/RegisterFormStep1";
import { RegisterFormStep2 } from "@/components/auth/RegisterFormStep2";
import type { RegisterStep1Input, RegisterStep2Input } from "@/app/lib/validation/auth";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [step1Data, setStep1Data] = useState<RegisterStep1Input | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { success, error: showError } = useToast();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleStep1Submit = (data: RegisterStep1Input) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Submit = async (data: RegisterStep2Input) => {
    if (!step1Data) {
      setApiError("Error interno: faltan datos del paso anterior. Volvé al paso 1.");
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      // Transformar datos para el backend (compatibilidad)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
      const backendUrl = `${apiUrl}/api/register`;

      logger.debug("[register] Calling backend", { backendUrl });

      const transformedBody = {
        name: `${step1Data.firstName} ${step1Data.lastName}`.trim(),
        email: step1Data.email,
        password: data.password,
        company: step1Data.companyName && step1Data.companyName.trim().length > 0 
          ? step1Data.companyName.trim() 
          : null,
      };

      const response = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transformedBody),
        cache: "no-store",
      });

      logger.debug("[register] Backend response status", { status: response.status });

      let responseData: any;
      try {
        responseData = await response.json();
      } catch (e) {
        const text = await response.text();
        logger.error("[register] Failed to parse JSON", e, { text: text.substring(0, 200) });
        throw new Error("Error al procesar respuesta del servidor");
      }

      logger.debug("[register] Response received", {
        ok: responseData?.ok,
        hasUser: !!responseData?.user,
        error: responseData?.error,
      });

      const apiResponse = {
        ok: response.ok && responseData?.ok === true,
        message: responseData?.message || "Error al registrar usuario",
        fieldErrors: responseData?.fieldErrors,
        error: responseData?.error,
        data: responseData?.user,
      };

      if (!apiResponse.ok) {
        logger.error("[register] Registration failed", undefined, { error: apiResponse.error });
        if (apiResponse.fieldErrors) {
          // Construir mensaje legible sin exponer nombres técnicos de campos
          const fieldErrors = apiResponse.fieldErrors as Record<string, string[]>;
          if (fieldErrors.email?.length) {
            setApiError("Este email ya está registrado. Probá iniciar sesión o usá otro email.");
          } else {
            setApiError("Algunos datos son inválidos. Revisá la información ingresada.");
          }
        } else {
          setApiError(apiResponse.message || "No pudimos crear la cuenta. Intentá nuevamente.");
        }
        setLoading(false);
        return;
      }

      logger.info("[register] Registration successful, redirecting");

      success("¡Cuenta creada exitosamente! Revisá tu email para verificar tu cuenta.");
      router.push("/auth/verify-email?sent=1");
    } catch (err: any) {
      logger.error("[register] Exception in onSubmit", err);
      setApiError(err.message || "Error de conexión. Revisá tu internet e intentá de nuevo.");
      setLoading(false);
    }
  };

  const handleBack = () => {
    setApiError(null);
    setCurrentStep(1);
  };

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col lg:flex-row">
      {/* Sidebar - Solo visible en desktop */}
      <RegisterSidebar />

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <RegisterHeader />

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20">
          {currentStep === 1 ? (
            <RegisterFormStep1 onSubmit={handleStep1Submit} isLoading={loading} />
          ) : (
            <RegisterFormStep2
              onSubmit={handleStep2Submit}
              onBack={handleBack}
              isLoading={loading}
              apiError={apiError}
            />
          )}
        </div>
      </main>
    </div>
  );
}
