"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle, Loader2, Mail, Scale, ShieldCheck } from "lucide-react";
import { apiGet, apiPost } from "@/app/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ViewState = "loading" | "form" | "verifying" | "success";

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-lg group-hover:bg-primary/90 transition-colors">
              <Scale className="h-6 w-6" />
            </div>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="h-2 bg-primary" />
          <div className="p-8">{children}</div>
        </div>

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

function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [viewState, setViewState] = useState<ViewState>("loading");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  useEffect(() => {
    const token = searchParams?.get("token");
    const sent = searchParams?.get("sent");
    const pending = searchParams?.get("pending");
    const initialEmail = searchParams?.get("email") || "";

    setEmail(initialEmail);
    setErrorMessage("");

    if (token) {
      verifyLegacyToken(token);
      return;
    }

    if (sent === "1") {
      setInfoMessage("Te enviamos un código de 6 dígitos. Ingresalo para activar tu cuenta.");
      setResendCountdown(60);
    } else if (pending === "1") {
      setInfoMessage("Tu cuenta todavía está pendiente. Verificá el correo para continuar.");
    } else {
      setInfoMessage("Ingresá el código de 6 dígitos que recibiste por email.");
    }

    setViewState("form");
  }, [searchParams]);

  useEffect(() => {
    if (resendCountdown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setResendCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  const verifyLegacyToken = async (token: string) => {
    setViewState("verifying");

    try {
      const response = await apiGet("/api/_auth/verify-email", { token });

      if (!response.ok) {
        const msg = response.message || "";
        if (msg.toLowerCase().includes("expir") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("token")) {
          setErrorMessage("El link de verificación expiró o ya fue utilizado. Solicitá un nuevo código.");
        } else {
          setErrorMessage("No se pudo verificar tu email. Intentá nuevamente.");
        }
        setInfoMessage("Podés completar la verificación con un código de 6 dígitos.");
        setViewState("form");
        return;
      }

      setViewState("success");
      window.setTimeout(() => {
        router.push("/auth/login?verified=1");
      }, 2000);
    } catch {
      setErrorMessage("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setViewState("form");
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage("Ingresá tu correo electrónico.");
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setErrorMessage("El código debe tener 6 dígitos.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = await apiPost("/api/auth/verify-email", {
        email: email.trim(),
        code: code.trim(),
      }) as any;

      if (!response.ok) {
        if (response.error === "code_expired") {
          setErrorMessage("El código expiró. Solicitá uno nuevo.");
        } else if (response.error === "too_many_attempts") {
          setErrorMessage("Alcanzaste el máximo de intentos. Solicitá un nuevo código.");
        } else if (response.error === "verification_code_missing") {
          setErrorMessage("No hay un código activo para este correo. Reenviá uno nuevo.");
        } else {
          setErrorMessage(response.message || "No se pudo verificar el código.");
        }
        setIsSubmitting(false);
        return;
      }

      setViewState("success");
      window.setTimeout(() => {
        router.push("/auth/login?verified=1");
      }, 2000);
    } catch {
      setErrorMessage("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorMessage("Ingresá tu correo para reenviar el código.");
      return;
    }

    setIsResending(true);
    setErrorMessage("");

    try {
      const response = await apiPost("/api/auth/verify-email/resend", {
        email: email.trim(),
      }) as any;

      if (!response.ok) {
        if (response.error === "resend_cooldown_active") {
          const retryAfterSeconds = Math.max(1, Number(response.retryAfterSeconds || 60));
          setResendCountdown(retryAfterSeconds);
          setInfoMessage(`Esperá ${retryAfterSeconds}s antes de pedir otro código.`);
        } else {
          setErrorMessage(response.message || "No se pudo reenviar el código.");
        }
        setIsResending(false);
        return;
      }

      setInfoMessage("Te enviamos un nuevo código de verificación.");
      setResendCountdown(60);
    } catch {
      setErrorMessage("Error de conexión. Revisá tu internet e intentá de nuevo.");
    } finally {
      setIsResending(false);
    }
  };

  if (viewState === "loading" || viewState === "verifying") {
    return (
      <AuthCard>
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-900 dark:text-white">
              {viewState === "verifying" ? "Verificando tu email..." : "Cargando..."}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {viewState === "verifying" ? "Esto solo tomará un momento." : "Preparando la pantalla de verificación."}
            </p>
          </div>
        </div>
      </AuthCard>
    );
  }

  if (viewState === "success") {
    return (
      <AuthCard>
        <div className="text-center space-y-5">
          <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">¡Email verificado!</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Tu cuenta ya está activa.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
              Redirigiendo al inicio de sesión...
            </p>
          </div>
          <Link href="/auth/login?verified=1">
            <Button className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20">
              Ir al inicio de sesión
            </Button>
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <div className="space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Verificá tu correo</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Ingresá el código de 6 dígitos enviado a tu email para activar la cuenta.
            </p>
          </div>
        </div>

        {infoMessage && (
          <div className="flex items-start gap-3 p-3 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30">
            <Mail className="w-4 h-4 mt-0.5 text-blue-600 dark:text-blue-300 flex-shrink-0" />
            <p className="text-sm text-blue-700 dark:text-blue-200 leading-snug">{infoMessage}</p>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 p-3 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30">
            <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 dark:text-red-300 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-200 leading-snug">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Correo electrónico
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="nombre@firma.com"
              className="w-full py-3"
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Código de verificación
            </Label>
            <Input
              id="code"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={code}
              onChange={(event) => {
                const nextValue = event.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(nextValue);
              }}
              placeholder="123456"
              className="w-full py-3 text-center text-lg tracking-[0.35em] font-semibold"
              autoComplete="one-time-code"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              El código expira en 10 minutos y tenés hasta 5 intentos.
            </p>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando...
              </>
            ) : (
              "Verificar código"
            )}
          </Button>
        </form>

        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleResend}
            disabled={isResending || resendCountdown > 0}
            className="w-full border-slate-200 dark:border-slate-700"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Reenviando...
              </>
            ) : resendCountdown > 0 ? (
              `Reenviar en ${resendCountdown}s`
            ) : (
              "Reenviar código"
            )}
          </Button>
          <Link href="/auth/login" className="block">
            <Button variant="ghost" className="w-full">
              Volver al inicio de sesión
            </Button>
          </Link>
        </div>
      </div>
    </AuthCard>
  );
}

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
