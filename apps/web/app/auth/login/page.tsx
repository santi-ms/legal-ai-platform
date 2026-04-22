"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginPageContent() {
  return (
    <AuthShell
      variant="login"
      eyebrow="Iniciar sesión"
      title={
        <>
          Retomá tu trabajo{" "}
          <span className="text-primary">donde lo dejaste</span>.
        </>
      }
      subtitle="Ingresá tus datos para volver a tu estudio, tus documentos y tus asistentes IA."
      topRight={
        <span className="text-sm text-slate-500 dark:text-slate-400">
          ¿Sos nuevo?{" "}
          <Link
            href="/auth/register"
            className="font-semibold text-primary hover:underline"
          >
            Crear cuenta
          </Link>
        </span>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-parchment dark:bg-background-dark flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}
