"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, Building2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerStep1Schema, type RegisterStep1Input } from "@/app/lib/validation/auth";
import { RegisterProgress } from "./RegisterProgress";
import { signIn } from "next-auth/react";
import { useState } from "react";

interface RegisterFormStep1Props {
  onSubmit: (data: RegisterStep1Input) => void;
  isLoading?: boolean;
}

export function RegisterFormStep1({ onSubmit, isLoading = false }: RegisterFormStep1Props) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      companyName: "",
      role: "",
    },
  });

  const [firstName = "", lastName = "", email = "", companyName = "", role = ""] = watch([
    "firstName",
    "lastName",
    "email",
    "companyName",
    "role",
  ]);

  const completedFields = [
    firstName.trim().length > 0,
    lastName.trim().length > 0,
    isValidEmail(email.trim()),
    companyName.trim().length > 0,
    role.trim().length > 0,
  ].filter(Boolean).length;
  const progressPercentage = (completedFields / 5) * 100;

  return (
    <div className="w-full max-w-xl">
      <RegisterProgress
        currentStep={1}
        totalSteps={2}
        stepTitle="Información de la Cuenta"
        progressPercentage={progressPercentage}
      />

      {/* Google sign-up */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => { setIsGoogleLoading(true); signIn("google", { callbackUrl: "/onboarding" }); }}
          disabled={isGoogleLoading}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isGoogleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            Registrarse con Google
          </span>
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-2 text-slate-500 dark:text-slate-400">
              O completá el formulario
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nombre
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Ej. Juan"
              {...register("firstName")}
              className={`w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary focus:border-primary ${
                errors.firstName ? "border-red-500" : ""
              }`}
              aria-invalid={errors.firstName ? "true" : "false"}
              aria-describedby={errors.firstName ? "firstName-error" : undefined}
            />
            {errors.firstName && (
              <p id="firstName-error" className="mt-1 text-sm text-red-400" role="alert">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
              Apellidos
            </Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Ej. Pérez García"
              {...register("lastName")}
              className={`w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary focus:border-primary ${
                errors.lastName ? "border-red-500" : ""
              }`}
              aria-invalid={errors.lastName ? "true" : "false"}
              aria-describedby={errors.lastName ? "lastName-error" : undefined}
            />
            {errors.lastName && (
              <p id="lastName-error" className="mt-1 text-sm text-red-400" role="alert">
                {errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Correo electrónico profesional
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <Input
              id="email"
              type="email"
              placeholder="juan.perez@bufete.com"
              {...register("email")}
              className={`w-full pl-11 rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary focus:border-primary ${
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

        {/* Firm/Company Name */}
        <div className="space-y-2">
          <Label htmlFor="companyName" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nombre de la Firma o Empresa
          </Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <Input
              id="companyName"
              type="text"
              placeholder="Ej. Pérez & Asociados S.C."
              {...register("companyName")}
              className={`w-full pl-11 rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary focus:border-primary ${
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

        {/* Role */}
        <div className="space-y-2">
          <Label htmlFor="role" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Cargo / Rol
          </Label>
          <div className="relative">
            <select
              id="role"
              {...register("role")}
              className={`w-full rounded-lg border border-slate-300 dark:border-slate-700 dark:bg-slate-900 bg-white dark:text-slate-100 px-3 py-2 pr-10 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none ${
                errors.role ? "border-red-500" : ""
              }`}
              aria-invalid={errors.role ? "true" : "false"}
              aria-describedby={errors.role ? "role-error" : undefined}
            >
              <option disabled value="">
                Selecciona una opción
              </option>
              <option value="partner">Socio / Director</option>
              <option value="associate">Abogado Asociado</option>
              <option value="clerk">Pasante / Paralegal</option>
              <option value="inhouse">Abogado In-house</option>
              <option value="other">Otro</option>
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {errors.role && (
            <p id="role-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg shadow-lg shadow-primary/20 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Continuar al siguiente paso
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </form>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <span>© {new Date().getFullYear()} LegalTech AR. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <a 
              href={`mailto:soporte@legaltech.ar?subject=${encodeURIComponent("Consulta sobre Términos y Condiciones")}`}
              className="hover:text-primary transition-colors"
            >
              Términos
            </a>
            <a 
              href={`mailto:soporte@legaltech.ar?subject=${encodeURIComponent("Consulta sobre Política de Privacidad")}`}
              className="hover:text-primary transition-colors"
            >
              Privacidad
            </a>
            <a 
              href={`mailto:soporte@legaltech.ar?subject=${encodeURIComponent("Contacto")}`}
              className="hover:text-primary transition-colors"
            >
              Contacto
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

