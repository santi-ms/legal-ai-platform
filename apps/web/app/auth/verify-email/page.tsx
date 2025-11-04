"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { Scale, Mail, CheckCircle, XCircle } from "lucide-react";
import { apiGet } from "@/app/lib/api";

type VerificationState = "loading" | "sent" | "verifying" | "success" | "error";

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const { success, error: showError } = useToast();

  useEffect(() => {
    const token = searchParams?.get("token");
    const sent = searchParams?.get("sent");

    if (sent === "1") {
      // Estado: email enviado, esperando verificación
      setState("sent");
    } else if (token) {
      // Verificar token
      verifyToken(token);
    } else {
      // Sin token ni sent, mostrar estado de envío
      setState("sent");
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    setState("verifying");

    try {
      const response = await apiGet("/auth/verify-email", {
        token,
      });

      if (!response.ok) {
        setState("error");
        setErrorMessage(response.message || "Error al verificar email");
        showError(response.message || "Error al verificar email");
        return;
      }

      // Éxito: redirigir a login con flag de verificación
      setState("success");
      success("Email verificado exitosamente. Ahora podés iniciar sesión.");
      
      // Redirigir a login después de un breve delay
      setTimeout(() => {
        router.push("/auth/login?verified=1");
      }, 2000);
    } catch (err: any) {
      setState("error");
      setErrorMessage(err.message || "Error al verificar email");
      showError(err.message || "Error al verificar email");
    }
  };

  // Estado: Email enviado (esperando verificación)
  if (state === "sent") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:bg-emerald-500 transition-colors">
                <Scale className="h-6 w-6" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Verifica tu Email</h1>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-neutral-300 mb-2">
                Te enviamos un email de verificación.
              </p>
              <p className="text-sm text-neutral-400 mb-4">
                Por favor, revisá tu bandeja de entrada y hacé clic en el link para verificar tu cuenta.
              </p>
              <p className="text-xs text-neutral-500">
                Si no encontrás el email, revisá tu carpeta de spam.
              </p>
            </div>

            <Link href="/auth/login">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg">
                Ir al inicio de sesión
              </Button>
            </Link>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Verificando
  if (state === "verifying") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:bg-emerald-500 transition-colors">
                <Scale className="h-6 w-6" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Verificando...</h1>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              </div>
              <p className="text-neutral-300">
                Verificando tu email...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Éxito
  if (state === "success") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:bg-emerald-500 transition-colors">
                <Scale className="h-6 w-6" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold mb-2">¡Email Verificado!</h1>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-neutral-300 mb-2">
                Tu email ha sido verificado exitosamente.
              </p>
              <p className="text-sm text-neutral-400">
                Redirigiendo al inicio de sesión...
              </p>
            </div>

            <Link href="/auth/login">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg">
                Ir al inicio de sesión
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Error
  if (state === "error") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:bg-emerald-500 transition-colors">
                <Scale className="h-6 w-6" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Error de Verificación</h1>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-neutral-300 mb-2">
                {errorMessage || "No se pudo verificar tu email."}
              </p>
              <p className="text-sm text-neutral-400">
                El link puede haber expirado o ser inválido. Por favor, intentá nuevamente.
              </p>
            </div>

            <div className="space-y-3">
              <Link href="/auth/register">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg">
                  Registrarse nuevamente
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full border-neutral-700 text-neutral-300 hover:bg-neutral-800">
                  Ir al inicio de sesión
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Estado: Loading inicial
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:bg-emerald-500 transition-colors">
              <Scale className="h-6 w-6" />
            </div>
          </Link>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
          <p className="text-neutral-300">Cargando...</p>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <VerifyEmailForm />
    </Suspense>
  );
}
