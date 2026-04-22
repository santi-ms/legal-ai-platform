"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, AlertCircle, CheckCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/app/lib/api";
import { loginSchema, type LoginInput } from "@/app/lib/validation/auth";
import { AuthField } from "./AuthField";

/**
 * Formulario de inicio de sesión — rediseñado con la paleta editorial de la
 * landing (ink/parchment/gold + primary), labels flotantes y Google OAuth
 * en una posición de igual jerarquía al email+password.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { success } = useToast();
  const [emailVerified, setEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const authenticatedTarget = session?.user?.tenantId ? "/documents" : "/onboarding";

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.replace(authenticatedTarget);
    }
  }, [authenticatedTarget, router, status]);

  // Verificar si viene de verificación de email
  useEffect(() => {
    if (searchParams?.get("verified") === "1") {
      setEmailVerified(true);
      success("Email verificado exitosamente. Ahora podés iniciar sesión.");
    }
  }, [searchParams, success]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const preflight = await apiPost("/api/auth/login", {
        email: data.email,
        password: data.password,
      });

      if (!preflight.ok) {
        if (preflight.error === "email_not_verified") {
          router.push(
            `/auth/verify-email?email=${encodeURIComponent(data.email)}&pending=1`,
          );
          setIsLoading(false);
          return;
        }

        setApiError("Email o contraseña incorrectos. Revisá los datos e intentá de nuevo.");
        setIsLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setApiError("Email o contraseña incorrectos. Revisá los datos e intentá de nuevo.");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        success("Sesión iniciada exitosamente");
        router.push("/documents");
        router.refresh();
        return;
      }

      setApiError("No pudimos procesar el inicio de sesión. Intentá nuevamente.");
      setIsLoading(false);
    } catch {
      setApiError("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setApiError(null);
    setIsGoogleLoading(true);

    try {
      await signIn("google", { callbackUrl: "/documents" });
    } catch {
      setApiError("No pudimos iniciar sesión con Google. Intentá nuevamente.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de email verificado — prominente */}
      {emailVerified && (
        <div
          className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
          aria-live="polite"
        >
          <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
          <p className="text-sm font-medium leading-snug">
            Email verificado. Ya podés iniciar sesión.
          </p>
        </div>
      )}

      {/* Google OAuth arriba — tratamiento visual destacado */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continuar con Google
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-parchment dark:bg-background-dark px-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-slate-500 dark:text-slate-400">
            o con email
          </span>
        </div>
      </div>

      {/* Form email + contraseña */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <AuthField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          autoFocus
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        <div className="space-y-1.5">
          <AuthField
            label="Contraseña"
            type="password"
            autoComplete="current-password"
            icon={<Lock className="w-4 h-4" />}
            passwordToggle
            error={errors.password?.message}
            {...register("password")}
          />
          <div className="flex justify-end pr-1">
            <Link
              href="/auth/reset"
              className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>

        {/* Remember me */}
        <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none pt-1">
          <input
            type="checkbox"
            className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary w-4 h-4"
          />
          Recordar mi sesión
        </label>

        {/* Inline API error */}
        {apiError && (
          <div
            className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300 leading-snug">
              {apiError}
            </p>
          </div>
        )}

        {/* Submit — usa ink como la landing para diferenciar del Google button */}
        <button
          type="submit"
          disabled={isLoading}
          className="group w-full flex items-center justify-center gap-2 bg-ink hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-soft hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Iniciando sesión...
            </>
          ) : (
            <>
              Iniciar sesión
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </form>

      {/* CTA a registro — solo mobile (en desktop ya está en topRight) */}
      <p className="lg:hidden text-center text-sm text-slate-600 dark:text-slate-400 pt-2">
        ¿No tenés cuenta?{" "}
        <Link href="/auth/register" className="text-primary font-semibold hover:underline">
          Crear cuenta
        </Link>
      </p>

      {/* Footer links */}
      <div className="flex justify-center gap-5 text-xs text-slate-500 dark:text-slate-400 pt-4 border-t border-slate-200/60 dark:border-slate-800">
        <Link href="/privacidad" className="hover:text-primary transition-colors">
          Privacidad
        </Link>
        <Link href="/terminos" className="hover:text-primary transition-colors">
          Términos
        </Link>
        <a
          href="mailto:hola@doculex.com.ar?subject=Contacto"
          className="hover:text-primary transition-colors"
        >
          Contacto
        </a>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}
