"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { signIn } from "next-auth/react";
import {
  Mail,
  Building2,
  User,
  ArrowRight,
  Loader2,
  Scale,
  Briefcase,
  GraduationCap,
  Building,
  HelpCircle,
  Check,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  registerStep1Schema,
  type RegisterStep1Input,
} from "@/app/lib/validation/auth";
import { AuthField } from "./AuthField";

interface RegisterFormStep1Props {
  onSubmit: (data: RegisterStep1Input) => void;
  isLoading?: boolean;
  /** Valores por defecto — útil al volver del paso 2 */
  defaultValues?: Partial<RegisterStep1Input>;
}

const ROLE_OPTIONS = [
  { value: "partner", label: "Socio / Director", icon: Scale },
  { value: "associate", label: "Abogado asociado", icon: Briefcase },
  { value: "clerk", label: "Pasante / Paralegal", icon: GraduationCap },
  { value: "inhouse", label: "Abogado in-house", icon: Building },
  { value: "other", label: "Otro", icon: HelpCircle },
] as const;

export function RegisterFormStep1({
  onSubmit,
  isLoading = false,
  defaultValues,
}: RegisterFormStep1Props) {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: {
      firstName: defaultValues?.firstName ?? "",
      lastName: defaultValues?.lastName ?? "",
      email: defaultValues?.email ?? "",
      companyName: defaultValues?.companyName ?? "",
      role: defaultValues?.role ?? "",
    },
  });

  const selectedRole = watch("role");

  return (
    <div className="space-y-6">
      {/* Google sign-up — arriba, destacado */}
      <button
        type="button"
        onClick={() => {
          setIsGoogleLoading(true);
          signIn("google", { callbackUrl: "/onboarding" });
        }}
        disabled={isGoogleLoading}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Registrarse con Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-slate-200 dark:border-slate-800" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-parchment dark:bg-background-dark px-3 text-[11px] uppercase tracking-[0.14em] font-semibold text-slate-500 dark:text-slate-400">
            o completá el formulario
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Nombre + Apellido en grid 2 columnas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AuthField
            label="Nombre"
            type="text"
            autoComplete="given-name"
            autoFocus
            icon={<User className="w-4 h-4" />}
            error={errors.firstName?.message}
            {...register("firstName")}
          />
          <AuthField
            label="Apellido"
            type="text"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register("lastName")}
          />
        </div>

        {/* Email */}
        <AuthField
          label="Correo electrónico profesional"
          type="email"
          autoComplete="email"
          icon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register("email")}
        />

        {/* Empresa / Firma */}
        <AuthField
          label="Nombre del estudio o empresa (opcional)"
          type="text"
          autoComplete="organization"
          icon={<Building2 className="w-4 h-4" />}
          error={errors.companyName?.message}
          {...register("companyName")}
        />

        {/* Role — botones en grid, no select */}
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-400 pl-1">
            ¿Cuál es tu rol?
          </p>
          <input type="hidden" {...register("role")} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedRole === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setValue("role", option.value, { shouldValidate: true })
                  }
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    isSelected
                      ? "border-primary bg-primary/5 dark:bg-primary/10 text-primary font-semibold"
                      : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-500",
                  )}
                  aria-pressed={isSelected}
                >
                  <span
                    className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="flex-1">{option.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
          {errors.role && (
            <p className="text-xs text-red-500 font-medium pl-1" role="alert">
              {errors.role.message}
            </p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="group w-full flex items-center justify-center gap-2 bg-ink hover:bg-slate-900 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-soft hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Continuar al paso 2
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 leading-relaxed">
          Al registrarte aceptás nuestros{" "}
          <a href="/terminos" className="text-primary hover:underline font-medium">
            Términos
          </a>{" "}
          y{" "}
          <a href="/privacidad" className="text-primary hover:underline font-medium">
            Política de Privacidad
          </a>
          .
        </p>
      </form>
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
