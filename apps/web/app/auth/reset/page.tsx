"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, Loader2, ArrowRight, CheckCircle } from "lucide-react";
import {
  resetRequestSchema,
  type ResetRequestInput,
} from "@/app/lib/validation/auth";
import { apiPost } from "@/app/lib/api";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthField } from "@/components/auth/AuthField";

export default function ResetRequestPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetRequestInput>({
    resolver: zodResolver(resetRequestSchema),
  });

  const onSubmit = async (data: ResetRequestInput) => {
    setLoading(true);
    try {
      // Seguridad: siempre mismo estado, no revelamos si el email existe
      await apiPost("/api/auth/reset/request", { email: data.email });
    } catch {
      // silenciado — misma UX
    } finally {
      setSentEmail(data.email);
      setLoading(false);
      setSent(true);
    }
  };

  // ── Success state ─────────────────────────────────────────────────────────
  if (sent) {
    return (
      <AuthShell
        variant="reset"
        eyebrow="Enviado"
        title={
          <>
            Revisá tu{" "}
            <span className="text-primary">correo</span>.
          </>
        }
        subtitle={
          <>
            Si <strong className="text-ink dark:text-white">{sentEmail}</strong>{" "}
            está registrado, te enviamos las instrucciones para recuperar el
            acceso.
          </>
        }
        topRight={
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ¿Te acordaste?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-primary hover:underline"
            >
              Iniciar sesión
            </Link>
          </span>
        }
      >
        <div className="space-y-6">
          {/* Confirmación visual */}
          <div className="flex items-start gap-4 p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-emerald-900 dark:text-emerald-100">
                Instrucciones enviadas
              </p>
              <p className="text-sm text-emerald-800/80 dark:text-emerald-200/80 leading-snug">
                Si no encontrás el email, revisá tu carpeta de spam o promociones.
                El enlace caduca en 30 minutos por seguridad.
              </p>
            </div>
          </div>

          <Link
            href="/auth/login"
            className="group w-full flex items-center justify-center gap-2 bg-ink hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-soft hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            Volver a iniciar sesión
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <button
            type="button"
            onClick={() => setSent(false)}
            className="w-full text-sm text-center text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            ¿Te equivocaste de email? Probá con otro
          </button>
        </div>
      </AuthShell>
    );
  }

  // ── Form state ────────────────────────────────────────────────────────────
  return (
    <AuthShell
      variant="reset"
      eyebrow="Recuperar contraseña"
      title={
        <>
          Te mandamos un link para{" "}
          <span className="text-primary">recuperar tu acceso</span>.
        </>
      }
      subtitle="Ingresá tu correo registrado y te enviamos las instrucciones. Por seguridad, el link caduca a los 30 minutos."
      topRight={
        <span className="text-sm text-slate-500 dark:text-slate-400">
          ¿Te acordaste?{" "}
          <Link
            href="/auth/login"
            className="font-semibold text-primary hover:underline"
          >
            Iniciar sesión
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <AuthField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          autoFocus
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <button
          type="submit"
          disabled={loading}
          className="group w-full flex items-center justify-center gap-2 bg-ink hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-soft hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Enviar instrucciones
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        <p className="text-center text-sm text-slate-600 dark:text-slate-400">
          ¿No tenés cuenta?{" "}
          <Link
            href="/auth/register"
            className="text-primary font-semibold hover:underline"
          >
            Crear una
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
