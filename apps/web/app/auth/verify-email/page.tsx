"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Scale, Mail, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { apiGet } from "@/app/lib/api";

type VerificationState = "loading" | "sent" | "verifying" | "success" | "error";

// ── Wrapper visual compartido ─────────────────────────────────────────────────
function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-lg group-hover:bg-primary/90 transition-colors">
              <Scale className="h-6 w-6" />
            </div>
          </Link>
        </div>

        {/* Card con top accent bar */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="h-2 bg-primary" />
          <div className="p-8">
            {children}
          </div>
        </div>

        {/* Link volver */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Formulario principal ──────────────────────────────────────────────────────
function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<VerificationState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams?.get("token");
    const sent = searchParams?.get("sent");

    if (sent === "1") {
      setState("sent");
    } else if (token) {
      verifyToken(token);
    } else {
      setState("sent");
    }
  }, [searchParams]);

  const verifyToken = async (token: string) => {
    setState("verifying");

    try {
      const response = await apiGet("/api/_auth/verify-email", { token });

      if (!response.ok) {
        const msg = response.message || "";
        // Mensaje accionable según señal del backend
        if (msg.toLowerCase().includes("expir") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("token")) {
          setErrorMessage("El link de verificación expiró o ya fue utilizado. Registrate nuevamente para recibir uno nuevo.");
        } else {
          setErrorMessage("No se pudo verificar tu email. Intentá nuevamente o contactá soporte.");
        }
        setState("error");
        return;
      }

      setState("success");
      setTimeout(() => {
        router.push("/auth/login?verified=1");
      }, 2000);
    } catch (err: any) {
      setErrorMessage("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setState("error");
    }
  };

  // ── Estado: loading inicial ───────────────────────────────────────────────
  if (state === "loading") {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Cargando...</p>
        </div>
      </AuthCard>
    );
  }

  // ── Estado: email enviado ─────────────────────────────────────────────────
  if (state === "sent") {
    return (
      <AuthCard>
        <div className="text-center space-y-5">
          <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <Mail className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Verificá tu email
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Te enviamos un email de verificación. Revisá tu bandeja de entrada y hacé clic en el link para activar tu cuenta.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
              Si no encontrás el email, revisá tu carpeta de spam.
            </p>
          </div>
          <Link href="/auth/login">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20">
              Ir al inicio de sesión
            </Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  // ── Estado: verificando token ─────────────────────────────────────────────
  if (state === "verifying") {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">Verificando tu email...</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Esto solo tomará un momento.</p>
          </div>
        </div>
      </AuthCard>
    );
  }

  // ── Estado: éxito ─────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <AuthCard>
        <div className="text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              ¡Email verificado!
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tu cuenta fue activada exitosamente.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
          <Link href="/auth/login">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20">
              Ir al inicio de sesión
            </Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  // ── Estado: error ─────────────────────────────────────────────────────────
  return (
    <AuthCard>
      <div className="text-center space-y-5">
        <div className="w-14 h-14 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7 text-red-500 dark:text-red-400" />
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            No se pudo verificar
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {errorMessage || "No se pudo verificar tu email. Intentá nuevamente."}
          </p>
        </div>
        <div className="space-y-3 pt-1">
          <Link href="/auth/register">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20">
              Registrarse nuevamente
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button
              variant="outline"
              className="w-full border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Ir al inicio de sesión
            </Button>
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────
export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
