"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import {
  resetConfirmSchema,
  type ResetConfirmInput,
} from "@/app/lib/validation/auth";
import { apiPost } from "@/app/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";

export default function ResetConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { success } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ResetConfirmInput>({
    resolver: zodResolver(resetConfirmSchema),
  });

  useEffect(() => {
    if (token) setValue("token", token);
  }, [token, setValue]);

  const onSubmit = async (data: ResetConfirmInput) => {
    setLoading(true);
    setApiError(null);

    try {
      const response = await apiPost("/api/auth/reset/confirm", {
        token: data.token,
        password: data.password,
      });

      if (!response.ok) {
        if (response.fieldErrors) {
          setApiError(
            "La contraseña no cumple los requisitos. Debe tener al menos 8 caracteres con letras y números.",
          );
        } else {
          const msg = response.message || "";
          if (
            msg.toLowerCase().includes("expir") ||
            msg.toLowerCase().includes("invalid") ||
            msg.toLowerCase().includes("token")
          ) {
            setApiError(
              "El link de recuperación expiró o ya fue utilizado. Solicitá uno nuevo.",
            );
          } else {
            setApiError("No pudimos actualizar la contraseña. Intentá nuevamente.");
          }
        }
        setLoading(false);
        return;
      }

      setVerified(true);
      success("Contraseña actualizada. Ahora podés iniciar sesión.");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch {
      setApiError("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setLoading(false);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (verified) {
    return (
      <AuthShell
        variant="reset"
        eyebrow="Listo"
        title={
          <>
            Contraseña actualizada{" "}
            <span className="text-primary">con éxito</span>.
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
                Tu nueva contraseña ya está activa
              </p>
              <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80 leading-snug">
                Por seguridad, cerramos las sesiones activas en otros dispositivos.
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
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
      variant="reset"
      eyebrow="Nueva contraseña"
      title={
        <>
          Elegí una{" "}
          <span className="text-primary">contraseña nueva</span>.
        </>
      }
      subtitle="Tu contraseña anterior queda invalidada al guardar la nueva. Usá una que no tengas en otros servicios."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <input type="hidden" {...register("token")} />

        <AuthField
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          autoFocus
          icon={<Lock className="w-4 h-4" />}
          passwordToggle
          error={errors.password?.message}
          hint="Mínimo 8 caracteres, con al menos una letra y un número."
          {...register("password")}
        />

        <AuthField
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          icon={<Lock className="w-4 h-4" />}
          passwordToggle
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />

        {apiError && (
          <div
            className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm text-red-700 dark:text-red-300 leading-snug">
                {apiError}
              </p>
              {apiError.includes("expiró") && (
                <Link
                  href="/auth/reset"
                  className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  Solicitar un nuevo link →
                </Link>
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !token}
          className="group w-full flex items-center justify-center gap-2 bg-ink hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-soft hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Actualizando...
            </>
          ) : (
            <>
              Actualizar contraseña
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </AuthShell>
  );
}
