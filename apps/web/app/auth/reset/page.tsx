"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";
import { Scale, Mail } from "lucide-react";
import { resetRequestSchema, type ResetRequestInput } from "@/app/lib/validation/auth";
import { apiPost } from "@/app/lib/api";

export default function ResetRequestPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { success: showSuccess, error: showError } = useToast();

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
      const response = await apiPost("/api/_auth/reset/request", {
        email: data.email,
      });

      if (!response.ok) {
        // No revelar si el email existe o no (seguridad)
        // Mostrar el mismo mensaje genérico en ambos casos
        setSuccess(true);
        setLoading(false);
        return;
      }

      // Éxito: mostrar mensaje genérico
      setSuccess(true);
      showSuccess("Si el email existe, te enviamos un link para resetear tu contraseña.");
    } catch (err: any) {
      // No revelar si el email existe o no
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 group mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-lg group-hover:bg-emerald-500 transition-colors">
                <Scale className="h-6 w-6" />
              </div>
            </Link>
            <h1 className="text-3xl font-bold mb-2">Email Enviado</h1>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center">
            <div className="mb-6">
              <div className="w-16 h-16 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-neutral-300 mb-2">
                Si el email existe en nuestro sistema, te enviamos un link para resetear tu contraseña.
              </p>
              <p className="text-sm text-neutral-400">
                Revisá tu bandeja de entrada y seguí las instrucciones.
              </p>
            </div>

            <Link href="/auth/login">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg">
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>

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
          <h1 className="text-3xl font-bold mb-2">Resetear Contraseña</h1>
          <p className="text-neutral-400">
            Ingresá tu email y te enviaremos un link para resetear tu contraseña
          </p>
        </div>

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

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enviando...
                </>
              ) : (
                "Enviar Link de Reset"
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
