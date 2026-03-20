"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { apiPost } from "@/app/lib/api";
import { loginSchema, type LoginInput } from "@/app/lib/validation/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { success, error: showError } = useToast();
  const [emailVerified, setEmailVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

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
          router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}&pending=1`);
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
        // NextAuth no distingue el tipo de fallo en CredentialsSignin;
        // usamos un mensaje genérico y seguro sin especular la causa exacta.
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

      // Fallback: result sin error ni ok (edge case de timeout o respuesta inesperada)
      setApiError("No pudimos procesar el inicio de sesión. Intentá nuevamente.");
      setIsLoading(false);
    } catch (err) {
      setApiError("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[440px]">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top accent bar */}
        <div className="h-2 bg-primary"></div>

        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-slate-100">
              Bienvenido de nuevo
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              Accedé a tu espacio legal seguro
            </p>
          </div>

          {/* Banner de email verificado */}
          {emailVerified && (
            <div className="mb-6 p-4 bg-emerald-900/30 dark:bg-emerald-900/20 border border-emerald-700 dark:border-emerald-800 rounded-lg text-emerald-400 dark:text-emerald-300 text-sm">
              ✅ Email verificado exitosamente. Ahora podés iniciar sesión.
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Correo electrónico
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="nombre@firma.com"
                  {...register("email")}
                  autoFocus
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                    errors.email ? "border-red-500" : ""
                  }`}
                  aria-invalid={errors.email ? "true" : "false"}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </div>
              {errors.email && (
                <p id="email-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Contraseña
                </Label>
                <Link
                  href="/auth/reset"
                  className="text-xs text-primary font-medium hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2 py-1">
              <input
                id="remember"
                type="checkbox"
                className="rounded border-slate-300 dark:border-slate-700 text-primary focus:ring-primary w-4 h-4"
              />
              <Label
                htmlFor="remember"
                className="text-xs text-slate-600 dark:text-slate-400 cursor-pointer"
              >
                Recordar mi sesión
              </Label>
            </div>

            {/* Inline API error */}
            {apiError && (
              <div
                className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300 leading-snug">{apiError}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">
                O continuar con
              </span>
            </div>
          </div>

          {/* Social Login — deshabilitado hasta implementación */}
          <SocialLoginButtons />

          {/* Sign Up Link */}
          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            ¿No tenés cuenta?{" "}
            <Link href="/auth/register" className="text-primary font-bold hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>
      </div>

      {/* Footer Links */}
      <div className="mt-8 flex justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
        <a
          href={`mailto:soporte@legaltech.ar?subject=${encodeURIComponent("Consulta sobre Política de Privacidad")}`}
          className="hover:text-primary transition-colors"
        >
          Privacidad
        </a>
        <a
          href={`mailto:soporte@legaltech.ar?subject=${encodeURIComponent("Consulta sobre Términos y Condiciones")}`}
          className="hover:text-primary transition-colors"
        >
          Términos
        </a>
        <a
          href={`mailto:soporte@legaltech.ar?subject=${encodeURIComponent("Contacto")}`}
          className="hover:text-primary transition-colors"
        >
          Contacto
        </a>
      </div>
    </div>
  );
}

function SocialLoginButtons() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <button
        type="button"
        disabled
        aria-disabled="true"
        tabIndex={-1}
        title="Próximamente"
        className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg opacity-50 cursor-not-allowed relative"
      >
        <GoogleIcon />
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Google</span>
        <span className="absolute -top-2 -right-2 text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full leading-none">
          Pronto
        </span>
      </button>
      <button
        type="button"
        disabled
        aria-disabled="true"
        tabIndex={-1}
        title="Próximamente"
        className="flex items-center justify-center gap-2 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg opacity-50 cursor-not-allowed relative"
      >
        <AppleIcon />
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">Apple</span>
        <span className="absolute -top-2 -right-2 text-[9px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full leading-none">
          Pronto
        </span>
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
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

function AppleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
