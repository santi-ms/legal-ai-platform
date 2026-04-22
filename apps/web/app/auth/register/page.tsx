"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useToast } from "@/components/ui/toast";
import { logger } from "@/app/lib/logger";
import { apiPost } from "@/app/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterFormStep1 } from "@/components/auth/RegisterFormStep1";
import { RegisterFormStep2 } from "@/components/auth/RegisterFormStep2";
import type { RegisterStep1Input, RegisterStep2Input } from "@/app/lib/validation/auth";

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [step1Data, setStep1Data] = useState<RegisterStep1Input | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const router = useRouter();
  const { status } = useSession();
  const { success } = useToast();

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
      const transformedBody = {
        name: `${step1Data.firstName} ${step1Data.lastName}`.trim(),
        firstName: step1Data.firstName.trim(),
        lastName: step1Data.lastName.trim(),
        email: step1Data.email,
        password: data.password,
        company:
          step1Data.companyName && step1Data.companyName.trim().length > 0
            ? step1Data.companyName.trim()
            : null,
        professionalRole: step1Data.role,
      };

      logger.debug("[register] Calling register proxy");

      const apiResponse = (await apiPost("/api/auth/register", transformedBody)) as any;

      if (!apiResponse.ok) {
        logger.error("[register] Registration failed", undefined, {
          error: apiResponse.error,
        });
        if (apiResponse.error === "email_pending_verification") {
          success("Tu cuenta ya estaba pendiente. Continuá con la verificación del correo.");
          router.push(
            `/auth/verify-email?email=${encodeURIComponent(step1Data.email)}&pending=1`,
          );
          return;
        }

        if (apiResponse.fieldErrors) {
          const fieldErrors = apiResponse.fieldErrors as Record<string, string[]>;
          if (fieldErrors.email?.length) {
            setApiError("Este email ya está registrado. Probá iniciar sesión o usá otro email.");
          } else {
            setApiError("Algunos datos son inválidos. Revisá la información ingresada.");
          }
        } else {
          setApiError(
            apiResponse.message || "No pudimos crear la cuenta. Intentá nuevamente.",
          );
        }
        setLoading(false);
        return;
      }

      logger.info("[register] Registration successful, redirecting");

      success("¡Cuenta creada! Revisá tu email para verificar tu cuenta.");
      const verificationEmail = apiResponse?.verification?.email || step1Data.email;
      router.push(
        `/auth/verify-email?email=${encodeURIComponent(verificationEmail)}&sent=1`,
      );
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

  // Progress bar con 2 segmentos — paso actual destacado
  const progressBar = (
    <div className="flex items-center gap-2">
      <div
        className={`h-1 w-10 rounded-full transition-colors ${
          currentStep >= 1 ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
        }`}
      />
      <div
        className={`h-1 w-10 rounded-full transition-colors ${
          currentStep >= 2 ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
        }`}
      />
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 ml-1">
        Paso {currentStep}/2
      </span>
    </div>
  );

  return (
    <AuthShell
      variant="register"
      eyebrow={currentStep === 1 ? "Crear cuenta — paso 1" : "Crear cuenta — paso 2"}
      title={
        currentStep === 1 ? (
          <>
            Creá tu cuenta en{" "}
            <span className="text-primary">DocuLex</span>
          </>
        ) : (
          <>
            Asegurá tu acceso con una{" "}
            <span className="text-primary">contraseña fuerte</span>
          </>
        )
      }
      subtitle={
        currentStep === 1
          ? "Contanos sobre vos y tu estudio. Sin tarjeta de crédito, sin compromiso."
          : "Elegí una contraseña que no uses en otros servicios. Podés cambiarla cuando quieras."
      }
      topRight={
        <span className="text-sm text-slate-500 dark:text-slate-400">
          ¿Ya tenés cuenta?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:underline"
          >
            Iniciar sesión
          </Link>
        </span>
      }
      contentMaxWidth="max-w-xl"
    >
      <div className="space-y-6">
        {progressBar}

        {currentStep === 1 ? (
          <RegisterFormStep1
            onSubmit={handleStep1Submit}
            isLoading={loading}
            defaultValues={step1Data ?? undefined}
          />
        ) : (
          <RegisterFormStep2
            onSubmit={handleStep2Submit}
            onBack={handleBack}
            isLoading={loading}
            apiError={apiError}
          />
        )}
      </div>
    </AuthShell>
  );
}
