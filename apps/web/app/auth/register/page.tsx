"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { Scale, Mail, Lock, User, Building2, Eye, EyeOff } from "lucide-react";
import { registerSchema, type RegisterInput } from "@/app/lib/validation/auth";
import { apiPost } from "@/app/lib/api";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { success, error: showError } = useToast();

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);

    try {
      // Registrar usuario usando proxy
      const response = await apiPost("/api/_auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        companyName: data.companyName,
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
          showError(response.message || "Error al registrar usuario");
        }
        setLoading(false);
        return;
      }

      // Éxito: redirigir a página de verificación
      success("¡Cuenta creada exitosamente! Revisá tu email para verificar tu cuenta.");
      router.push("/auth/verify-email?sent=1");
    } catch (err: any) {
      showError(err.message || "Error al crear cuenta");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:bg-emerald-500 transition-colors">
              <Scale className="h-6 w-6" />
            </div>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Crear Cuenta</h1>
          <p className="text-neutral-400">
            Comenzá a generar tus documentos legales ahora
          </p>
        </div>

        {/* Formulario */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Nombre */}
            <div>
              <Label htmlFor="name" className="text-neutral-300 mb-2">
                Nombre
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="name"
                  type="text"
                  {...register("name")}
                  placeholder="Tu nombre"
                  autoFocus
                  className={`pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-emerald-500 ${
                    errors.name ? "border-red-500" : ""
                  }`}
                  aria-invalid={errors.name ? "true" : "false"}
                  aria-describedby={errors.name ? "name-error" : undefined}
                />
              </div>
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-neutral-300 mb-2">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="tu@email.com"
                  className={`pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-emerald-500 ${
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

            {/* Empresa */}
            <div>
              <Label htmlFor="companyName" className="text-neutral-300 mb-2">
                Empresa
              </Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="companyName"
                  type="text"
                  {...register("companyName")}
                  placeholder="Nombre de tu empresa"
                  className={`pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-emerald-500 ${
                    errors.companyName ? "border-red-500" : ""
                  }`}
                  aria-invalid={errors.companyName ? "true" : "false"}
                  aria-describedby={errors.companyName ? "companyName-error" : undefined}
                />
              </div>
              {errors.companyName && (
                <p id="companyName-error" className="mt-1 text-sm text-red-400" role="alert">
                  {errors.companyName.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-neutral-300 mb-2">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  placeholder="Mínimo 8 caracteres con letra y número"
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
                Confirmar Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirmPassword")}
                  placeholder="Repetí tu contraseña"
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
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </form>

          {/* Link a login */}
          <div className="mt-6 text-center text-sm text-neutral-400">
            ¿Ya tenés cuenta?{" "}
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

