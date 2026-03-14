"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { Scale, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { resetConfirmSchema, type ResetConfirmInput } from "@/app/lib/validation/auth";
import { apiPost } from "@/app/lib/api";

export default function ResetConfirmPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // Setear el token cuando el componente se monte
  useEffect(() => {
    if (token) {
      setValue("token", token);
    }
  }, [token, setValue]);

  const onSubmit = async (data: ResetConfirmInput) => {
    setLoading(true);
    setApiError(null);

    try {
      const response = await apiPost("/api/_auth/reset/confirm", {
        token: data.token,
        password: data.password,
      });

      if (!response.ok) {
        if (response.fieldErrors) {
          // Errores de validación de campo — mostramos mensaje claro sin nombres técnicos
          setApiError("La contraseña no cumple los requisitos. Verificá que tenga al menos 8 caracteres con letras y números.");
        } else {
          // El caso más probable de error es un token expirado o ya utilizado
          const msg = response.message || "";
          if (msg.toLowerCase().includes("expir") || msg.toLowerCase().includes("invalid") || msg.toLowerCase().includes("token")) {
            setApiError("El link de recuperación expiró o ya fue utilizado. Solicitá uno nuevo.");
          } else {
            setApiError("No pudimos actualizar la contraseña. Intentá nuevamente.");
          }
        }
        setLoading(false);
        return;
      }

      // Éxito
      setVerified(true);
      success("Contraseña actualizada exitosamente. Ahora podés iniciar sesión.");
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      setApiError("Error de conexión. Revisá tu internet e intentá de nuevo.");
      setLoading(false);
    }
  };

  // ── Estado: contraseña actualizada ───────────────────────────────────────
  if (verified) {
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
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  ¡Contraseña actualizada!
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tu contraseña fue actualizada exitosamente.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                  Redirigiendo al inicio de sesión...
                </p>
              </div>
              <Link href="/auth/login">
                <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20">
                  Ir al inicio de sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Estado: formulario ────────────────────────────────────────────────────
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

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="h-2 bg-primary" />
          <div className="p-8">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                Nueva contraseña
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Elegí una contraseña segura para tu cuenta.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Hidden token field */}
              <input type="hidden" {...register("token")} />

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Nueva contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Mínimo 8 caracteres con letra y número"
                    autoFocus
                    className={`w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      errors.password ? "border-red-500" : ""
                    }`}
                    aria-invalid={errors.password ? "true" : "false"}
                    aria-describedby={errors.password ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p id="password-error" className="text-sm text-red-400" role="alert">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirmar contraseña */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Confirmar contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    {...register("confirmPassword")}
                    placeholder="Repetí tu nueva contraseña"
                    className={`w-full pl-10 pr-11 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      errors.confirmPassword ? "border-red-500" : ""
                    }`}
                    aria-invalid={errors.confirmPassword ? "true" : "false"}
                    aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p id="confirmPassword-error" className="text-sm text-red-400" role="alert">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </div>

              {/* Inline API error */}
              {apiError && (
                <div
                  className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm text-red-700 dark:text-red-300 leading-snug">{apiError}</p>
                    {/* Si el error sugiere token expirado, ofrecer acción directa */}
                    {apiError.includes("expiró") && (
                      <Link
                        href="/auth/reset"
                        className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline"
                      >
                        Solicitar un nuevo link →
                      </Link>
                    )}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || !token}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar contraseña"
                )}
              </Button>
            </form>

            {/* Link a login */}
            <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400">
              ¿Ya recordaste tu contraseña?{" "}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </div>
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
