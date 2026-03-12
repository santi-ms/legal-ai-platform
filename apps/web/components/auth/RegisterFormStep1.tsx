"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Mail, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerStep1Schema, type RegisterStep1Input } from "@/app/lib/validation/auth";
import { RegisterProgress } from "./RegisterProgress";

interface RegisterFormStep1Props {
  onSubmit: (data: RegisterStep1Input) => void;
  isLoading?: boolean;
}

export function RegisterFormStep1({ onSubmit, isLoading = false }: RegisterFormStep1Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
  });

  return (
    <div className="w-full max-w-xl">
      <RegisterProgress currentStep={1} totalSteps={2} stepTitle="Información de la Cuenta" />

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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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
          <span>© 2024 LegalTech AR. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <Link href="#terminos" className="hover:text-primary transition-colors">
              Términos
            </Link>
            <Link href="#privacidad" className="hover:text-primary transition-colors">
              Privacidad
            </Link>
            <Link href="#contacto" className="hover:text-primary transition-colors">
              Contacto
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

