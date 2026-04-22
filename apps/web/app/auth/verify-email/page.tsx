"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  Mail,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { apiGet, apiPost } from "@/app/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";
import { OtpInput } from "@/components/auth/OtpInput";

type ViewState = "loading" | "form" | "verifying" | "success";

function VerifyEmailContent() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCountdown((c) => {
        if (c <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCountdown]);

  // Auto-submit cuando se completa el código
  useEffect(() => {
    if (code.length === 6 && !isSubmitting && viewState === "form" && email.trim()) {
      void handleVerifyDirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const verifyLegacyToken = async (token: string) => {
    setViewState("verifying");
    try {
      const response = await apiGet("/api/_auth/verify-email", { token });
      if (!response.ok) {
        const msg = response.message || "";
        if (
          msg.toLowerCase().includes("expir") ||
          msg.toLowerCase().includes("invalid") ||
          msg.toLowerCase().includes("token")
        ) {
          setErrorMessage(
            "El link de verificación expiró o ya fue utilizado. Solicitá un nuevo código.",
          );
        } else {
          setErrorMessage("No se pudo verificar tu email. Intentá nuevamente.");
        }
        setInfoMessage("Podés completar la verificación con un código de 6 dígitos.");
        setViewState("form");
        return;
      }

      setViewState("success");
      window.setTimeout(() => router.push("/auth/login?verified=1"), 2000);
    } catch {
      setErrorMessage("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setViewState("form");
    }
  };

  const handleVerifyDirect = async () => {
    if (!email.trim()) {
      setErrorMessage("Ingresá tu correo electrónico.");
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const response = (await apiPost("/api/auth/verify-email", {
        email: email.trim(),
        code: code.trim(),
      })) as any;

      if (!response.ok) {
        if (response.error === "code_expired") {
          setErrorMessage("El código expiró. Solicitá uno nuevo.");
        } else if (response.error === "too_many_attempts") {
          setErrorMessage(
            "Alcanzaste el máximo de intentos. Solicitá un nuevo código.",
          );
        } else if (response.error === "verification_code_missing") {
          setErrorMessage(
            "No hay un código activo para este correo. Reenviá uno nuevo.",
          );
        } else {
          setErrorMessage(response.message || "No se pudo verificar el código.");
        }
        setIsSubmitting(false);
        return;
      }

      setViewState("success");
      window.setTimeout(() => router.push("/auth/login?verified=1"), 2000);
    } catch {
      setErrorMessage("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await handleVerifyDirect();
  };

  const handleResend = async () => {
    if (!email.trim()) {
      setErrorMessage("Ingresá tu correo para reenviar el código.");
      return;
    }

    setIsResending(true);
    setErrorMessage("");

    try {
      const response = (await apiPost("/api/auth/verify-email/resend", {
        email: email.trim(),
      })) as any;

      if (!response.ok) {
        if (response.error === "resend_cooldown_active") {
          const retryAfterSeconds = Math.max(
            1,
            Number(response.retryAfterSeconds || 60),
          );
          setResendCountdown(retryAfterSeconds);
          setInfoMessage(`Esperá ${retryAfterSeconds}s antes de pedir otro código.`);
        } else {
          setErrorMessage(response.message || "No se pudo reenviar el código.");
        }
        setIsResending(false);
        return;
      }

      setInfoMessage("Te enviamos un nuevo código de verificación.");
      setCode("");
      setResendCountdown(60);
    } catch {
      setErrorMessage("Error de conexión. Revisá tu internet e intentá de nuevo.");
    } finally {
      setIsResending(false);
    }
  };

  // ── Loading / verifying ───────────────────────────────────────────────────
  if (viewState === "loading" || viewState === "verifying") {
    return (
      <AuthShell
        variant="verify"
        eyebrow="Verificando"
        title={
          viewState === "verifying" ? (
            <>
              Activando tu <span className="text-primary">cuenta</span>...
            </>
          ) : (
            <>Cargando...</>
          )
        }
        subtitle={
          viewState === "verifying"
            ? "Estamos confirmando tu email. Esto sólo tomará un momento."
            : "Preparando la pantalla de verificación."
        }
      >
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </AuthShell>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (viewState === "success") {
    return (
      <AuthShell
        variant="verify"
        eyebrow="¡Listo!"
        title={
          <>
            Tu cuenta ya está{" "}
            <span className="text-primary">activa</span>.
          </>
        }
        subtitle="Redirigiendo al inicio de sesión..."
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                Email verificado correctamente
              </p>
              <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80 leading-snug">
                Ya podés iniciar sesión y empezar a usar DocuLex.
              </p>
            </div>
          </div>

          <Link
            href="/auth/login?verified=1"
            className="group w-full flex items-center justify-center gap-2 bg-ink hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-soft hover:shadow-hover"
          >
            Ir al inicio de sesión
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </AuthShell>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────
  return (
    <AuthShell
      variant="verify"
      eyebrow="Verificá tu email"
      title={
        <>
          Ingresá el código{" "}
          <span className="text-primary">que te enviamos</span>.
        </>
      }
      subtitle={
        email ? (
          <>
            Te mandamos un código de 6 dígitos a{" "}
            <strong className="text-ink dark:text-white">{email}</strong>. Expira
            en 10 minutos.
          </>
        ) : (
          "Ingresá el código de 6 dígitos que recibiste por email. Expira en 10 minutos."
        )
      }
      topRight={
        <Link
          href="/auth/login"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Iniciar sesión
        </Link>
      }
    >
      <form onSubmit={handleVerify} className="space-y-6" noValidate>
        {/* Email — sólo si no viene pre-rellenado */}
        {!email && (
          <AuthField
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            icon={<Mail className="w-4 h-4" />}
          />
        )}

        {/* OTP input */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400 pl-1">
            Código de verificación
          </p>
          <OtpInput
            value={code}
            onChange={setCode}
            length={6}
            autoFocus={!!email}
            disabled={isSubmitting}
            error={!!errorMessage && !!code}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 pl-1">
            Pegá el código o tipealo dígito por dígito. Tenés hasta 5 intentos.
          </p>
        </div>

        {/* Info */}
        {infoMessage && !errorMessage && (
          <div
            className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900"
            role="status"
          >
            <Mail className="w-4 h-4 text-blue-500 dark:text-blue-300 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-700 dark:text-blue-200 leading-snug">
              {infoMessage}
            </p>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div
            className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300 leading-snug">
              {errorMessage}
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || code.length !== 6}
          className="group w-full flex items-center justify-center gap-2 bg-ink hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-soft hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              Verificar código
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        {/* Reenviar */}
        <div className="pt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          ¿No recibiste el código?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isResending || resendCountdown > 0}
            className="inline-flex items-center gap-1 text-primary font-semibold hover:underline disabled:no-underline disabled:text-slate-400 dark:disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            {isResending ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Reenviando...
              </>
            ) : resendCountdown > 0 ? (
              `Reenviar en ${resendCountdown}s`
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                Reenviar código
              </>
            )}
          </button>
        </div>
      </form>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-parchment dark:bg-background-dark flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
