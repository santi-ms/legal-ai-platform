"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Lock,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import {
  registerStep2Schema,
  type RegisterStep2Input,
} from "@/app/lib/validation/auth";
import { AuthField } from "./AuthField";

interface RegisterFormStep2Props {
  onSubmit: (data: RegisterStep2Input) => Promise<void>;
  onBack: () => void;
  isLoading?: boolean;
  apiError?: string | null;
}

// ── Requisitos de contraseña ────────────────────────────────────────────────
const REQUIREMENTS = [
  {
    id: "length",
    label: "Al menos 8 caracteres",
    test: (p: string) => p.length >= 8,
  },
  {
    id: "lowercase",
    label: "Una minúscula (a-z)",
    test: (p: string) => /[a-z]/.test(p),
  },
  {
    id: "uppercase",
    label: "Una mayúscula (A-Z)",
    test: (p: string) => /[A-Z]/.test(p),
  },
  {
    id: "number",
    label: "Un número (0-9)",
    test: (p: string) => /\d/.test(p),
  },
  {
    id: "special",
    label: "Un símbolo (!@#...)",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
] as const;

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

const STRENGTH_CONFIG: Record<
  StrengthLevel,
  { label: string; barColor: string; textColor: string; bars: number }
> = {
  0: {
    label: "Muy débil",
    barColor: "bg-red-500",
    textColor: "text-red-600 dark:text-red-400",
    bars: 0,
  },
  1: {
    label: "Débil",
    barColor: "bg-red-500",
    textColor: "text-red-600 dark:text-red-400",
    bars: 1,
  },
  2: {
    label: "Aceptable",
    barColor: "bg-orange-500",
    textColor: "text-orange-600 dark:text-orange-400",
    bars: 2,
  },
  3: {
    label: "Fuerte",
    barColor: "bg-yellow-500",
    textColor: "text-yellow-600 dark:text-yellow-400",
    bars: 3,
  },
  4: {
    label: "Muy fuerte",
    barColor: "bg-emerald-500",
    textColor: "text-emerald-600 dark:text-emerald-400",
    bars: 4,
  },
};

function calculateStrength(password: string): StrengthLevel {
  if (!password) return 0;
  const passed = REQUIREMENTS.filter((r) => r.test(password)).length;
  if (passed <= 1) return 1;
  if (passed === 2) return 2;
  if (passed === 3 || passed === 4) return 3;
  return 4;
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const strength = calculateStrength(password);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className="space-y-3 pt-1">
      {/* 4 barras de fuerza */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors duration-300",
                config.bars >= bar
                  ? config.barColor
                  : "bg-slate-200 dark:bg-slate-800",
              )}
            />
          ))}
        </div>
        {password.length > 0 && (
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-wider min-w-[76px] text-right",
              config.textColor,
            )}
          >
            {config.label}
          </span>
        )}
      </div>

      {/* Lista de requisitos en chips */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {REQUIREMENTS.map((req) => {
          const ok = req.test(password);
          return (
            <div
              key={req.id}
              className={cn(
                "flex items-center gap-2 text-xs transition-colors",
                ok
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-slate-500 dark:text-slate-400",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                  ok
                    ? "bg-emerald-100 dark:bg-emerald-900/40"
                    : "bg-slate-100 dark:bg-slate-800",
                )}
                aria-hidden="true"
              >
                {ok ? (
                  <Check className="w-2.5 h-2.5" />
                ) : (
                  <X className="w-2.5 h-2.5" />
                )}
              </span>
              <span className="leading-none">{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RegisterFormStep2({
  onSubmit,
  onBack,
  isLoading = false,
  apiError = null,
}: RegisterFormStep2Props) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterStep2Input>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onChange",
  });

  const password = watch("password") ?? "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <AuthField
        label="Contraseña"
        type="password"
        autoComplete="new-password"
        autoFocus
        icon={<Lock className="w-4 h-4" />}
        passwordToggle
        error={errors.password?.message}
        {...register("password")}
      />

      {/* Strength meter + requisitos */}
      <PasswordStrengthMeter password={password} />

      <AuthField
        label="Confirmar contraseña"
        type="password"
        autoComplete="new-password"
        icon={<Lock className="w-4 h-4" />}
        passwordToggle
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      {/* API error inline */}
      {apiError && (
        <div
          className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300 leading-snug">
            {apiError}
          </p>
        </div>
      )}

      {/* Botonera: Volver + Crear cuenta */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="group flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:border-slate-400 dark:hover:border-slate-500 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Volver
        </button>

        <button
          type="submit"
          disabled={isLoading}
          className="group flex-1 flex items-center justify-center gap-2 bg-ink hover:bg-slate-900 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-soft hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creando cuenta...
            </>
          ) : (
            <>
              Crear cuenta
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
