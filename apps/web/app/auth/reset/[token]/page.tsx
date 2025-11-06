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
import { Scale, Lock, Eye, EyeOff } from "lucide-react";
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
  const { success, error: showError } = useToast();

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

    try {
      const response = await apiPost("/api/_auth/reset/confirm", {
        token: data.token,
        password: data.password,
      });

      if (!response.ok) {
        // Mostrar errores de campo si existen
        if (response.fieldErrors) {
          Object.entries(response.fieldErrors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              showError(`${field}: ${messages[0]}`);
            }
          });
        } else {
          showError(response.message || "Error al resetear contraseña");
        }
        setLoading(false);
        return;
      }

      // Éxito: redirigir a login
      setVerified(true);
      success("Contraseña actualizada exitosamente. Ahora podés iniciar sesión.");
      
      // Redirigir a login después de un breve delay
      setTimeout(() => {
        router.push("/auth/login");
      }, 2000);
    } catch (err: any) {
      showError(err.message || "Error al resetear contraseña");
      setLoading(false);
    }
  };

  if (verified) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:bg-emerald-500 transition-colors">
                <Scale className="h-6 w-6" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold mb-2">¡Contraseña Actualizada!</h1>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-neutral-300 mb-2">
                Tu contraseña ha sido actualizada exitosamente.
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

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:bg-emerald-500 transition-colors">
              <Scale className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Nueva Contraseña</h1>
          <p className="text-neutral-400">
            Ingresá tu nueva contraseña
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Hidden token field */}
            <input type="hidden" {...register("token")} />

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-neutral-300 mb-2">
                Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Mínimo 8 caracteres con letra y número"
                  autoFocus
                  className={`pl-10 pr-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-emerald-500 ${
                    errors.password ? "border-red-500" : ""
                  }`}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={errors.password ? "password-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 transition-colors"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword" className="text-neutral-300 mb-2">
                Confirmar Nueva Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Repetí tu nueva contraseña"
                  className={`pl-10 pr-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-emerald-500 ${
                    errors.confirmPassword ? "border-red-500" : ""
                  }`}
                  aria-invalid={errors.confirmPassword ? "true" : "false"}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-300 transition-colors"
                  aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Actualizando...
                </>
              ) : (
                "Actualizar Contraseña"
              )}
            </Button>
          </form>

          {/* Link a login */}
          <div className="mt-6 text-center text-sm text-neutral-400">
            ¿Recordaste tu contraseña?{" "}
            <Link
              href="/auth/login"
              className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>

        {/* Link a home */}
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
