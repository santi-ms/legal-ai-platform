"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { Scale, Mail, Lock } from "lucide-react";
import { loginSchema, type LoginInput } from "@/app/lib/validation/auth";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { success, error: showError } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  // Verificar si viene de verificación de email
  useEffect(() => {
    if (searchParams?.get("verified") === "1") {
      setEmailVerified(true);
      success("Email verificado exitosamente. Ahora podés iniciar sesión.");
    }
  }, [searchParams, success]);

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        // El error puede venir del backend (email no verificado, credenciales inválidas, etc.)
        showError(result.error === "CredentialsSignin" 
          ? "Credenciales inválidas o email no verificado" 
          : "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // Login exitoso - redirigir a /documents
      if (result?.ok) {
        success("Sesión iniciada exitosamente");
        router.push("/documents");
        router.refresh();
      }
    } catch (err) {
      showError("Error al iniciar sesión. Por favor intentá nuevamente.");
      setLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold mb-2">Iniciar Sesión</h1>
          <p className="text-neutral-400">
            Accedé a tu cuenta para gestionar tus documentos legales
          </p>
        </div>

        {/* Banner de email verificado */}
        {emailVerified && (
          <div className="mb-6 p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg text-emerald-400 text-sm">
            ✅ Email verificado exitosamente. Ahora podés iniciar sesión.
          </div>
        )}

        {/* Formulario */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  autoFocus
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

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-neutral-300 mb-2">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
                <Input
                  id="password"
                  type="password"
                  {...register("password")}
                  placeholder="••••••••"
                  className={`pl-10 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus:border-emerald-500 ${
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

            {/* Link a reset password */}
            <div className="text-right">
              <Link
                href="/auth/reset"
                className="text-sm text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
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
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          {/* Link a registro */}
          <div className="mt-6 text-center text-sm text-neutral-400">
            ¿No tenés cuenta?{" "}
            <Link
              href="/auth/register"
              className="text-emerald-500 hover:text-emerald-400 font-medium transition-colors"
            >
              Registrate gratis
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
