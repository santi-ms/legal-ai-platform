"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Scale, Mail, Loader2 } from "lucide-react";
import { resetRequestSchema, type ResetRequestInput } from "@/app/lib/validation/auth";
import { apiPost } from "@/app/lib/api";

export default function ResetRequestPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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
      // Siempre mostramos el mismo estado de éxito independientemente del resultado,
      // para no revelar si el email está registrado en el sistema (seguridad).
      await apiPost("/api/_auth/reset/request", { email: data.email });
    } catch {
      // Error silenciado intencionalmente — misma UX por seguridad
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  // ── Estado: instrucciones enviadas ────────────────────────────────────────
  if (sent) {
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
            <div className="p-8 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  Revisá tu email
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Si el email está registrado, te enviamos las instrucciones para recuperar el acceso.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                  Si no encontrás el email, revisá tu carpeta de spam.
                </p>
              </div>
              <Link href="/auth/login">
                <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-white font-semibold shadow-lg shadow-primary/20">
                  Volver al inicio de sesión
                </Button>
              </Link>
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
                Recuperar contraseña
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Ingresá tu email y te enviamos las instrucciones para recuperar el acceso.
              </p>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="nombre@firma.com"
                    autoFocus
                    className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${
                      errors.email ? "border-red-500" : ""
                    }`}
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "email-error" : undefined}
                  />
                </div>
                {errors.email && (
                  <p id="email-error" className="text-sm text-red-400" role="alert">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar instrucciones"
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
