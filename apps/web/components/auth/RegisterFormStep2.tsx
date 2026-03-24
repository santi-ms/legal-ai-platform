"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerStep2Schema, type RegisterStep2Input } from "@/app/lib/validation/auth";
import { RegisterProgress } from "./RegisterProgress";

interface RegisterFormStep2Props {
  onSubmit: (data: RegisterStep2Input) => void;
  onBack: () => void;
  isLoading?: boolean;
  apiError?: string | null;
}

// ─── Password strength ────────────────────────────────────────────────────────

const REQUIREMENTS = [
  { id: "length",    label: "Mínimo 8 caracteres",      test: (v: string) => v.length >= 8 },
  { id: "lowercase", label: "Una letra minúscula",       test: (v: string) => /[a-z]/.test(v) },
  { id: "uppercase", label: "Una letra mayúscula",       test: (v: string) => /[A-Z]/.test(v) },
  { id: "number",    label: "Un número",                 test: (v: string) => /\d/.test(v) },
  { id: "special",   label: "Un carácter especial",      test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

type StrengthLevel = 0 | 1 | 2 | 3 | 4;

function getStrength(value: string): StrengthLevel {
  const score = REQUIREMENTS.filter((r) => r.test(value)).length;
  return Math.min(4, score) as StrengthLevel;
}

const STRENGTH_CONFIG: Record<
  StrengthLevel,
  { label: string; color: string; bars: number }
> = {
  0: { label: "",           color: "bg-slate-200 dark:bg-slate-700", bars: 0 },
  1: { label: "Muy débil",  color: "bg-red-500",    bars: 1 },
  2: { label: "Débil",      color: "bg-orange-400", bars: 2 },
  3: { label: "Aceptable",  color: "bg-yellow-400", bars: 3 },
  4: { label: "Fuerte",     color: "bg-emerald-500",bars: 4 },
};

function PasswordStrengthMeter({ value }: { value: string }) {
  if (!value) return null;
  const strength = getStrength(value);
  const config = STRENGTH_CONFIG[strength];

  return (
    <div className="space-y-2 mt-2">
      {/* Barras */}
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < config.bars ? config.color : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>

      {/* Label de nivel */}
      {config.label && (
        <p className={`text-xs font-medium ${
          strength <= 1 ? "text-red-500" :
          strength === 2 ? "text-orange-400" :
          strength === 3 ? "text-yellow-500" :
          "text-emerald-500"
        }`}>
          {config.label}
        </p>
      )}

      {/* Requisitos */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1">
        {REQUIREMENTS.map((req) => {
          const met = req.test(value);
          return (
            <div key={req.id} className="flex items-center gap-1.5">
              <Check
                className={`w-3 h-3 flex-shrink-0 transition-colors duration-200 ${
                  met ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"
                }`}
              />
              <span className={`text-xs transition-colors duration-200 ${
                met
                  ? "text-slate-600 dark:text-slate-300"
                  : "text-slate-400 dark:text-slate-500"
              }`}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function RegisterFormStep2({
  onSubmit,
  onBack,
  isLoading = false,
  apiError,
}: RegisterFormStep2Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterStep2Input>({
    resolver: zodResolver(registerStep2Schema),
  });

  const passwordValue = watch("password") ?? "";

  return (
    <div className="w-full max-w-xl">
      <RegisterProgress currentStep={2} totalSteps={2} stepTitle="Seguridad de la Cuenta" />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Mínimo 8 caracteres"
              {...register("password")}
              className={`w-full pl-11 pr-11 rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary focus:border-primary ${
                errors.password ? "border-red-500" : ""
              }`}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : "password-requirements"}
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

          {/* Strength meter */}
          <div id="password-requirements">
            <PasswordStrengthMeter value={passwordValue} />
          </div>

          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-400" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Confirmar Contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Repetí tu contraseña"
              {...register("confirmPassword")}
              className={`w-full pl-11 pr-11 rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary focus:border-primary ${
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
            <p id="confirmPassword-error" className="mt-1 text-sm text-red-400" role="alert">
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
            <p className="text-sm text-red-700 dark:text-red-300 leading-snug">{apiError}</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-4 flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="flex-1"
          >
            Volver
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            size="lg"
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-lg shadow-lg shadow-primary/20 transition duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              <>
                Crear Cuenta
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>

        {/* Login link */}
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
          ¿Ya tenés una cuenta?{" "}
          <Link href="/auth/login" className="text-primary font-bold hover:underline">
            Iniciá sesión aquí
          </Link>
        </p>
      </form>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
          <span>© 2024 DocuLex. Todos los derechos reservados.</span>
          <div className="flex gap-4">
            <a href={`mailto:soporte@legaltech.ar?subject=${encodeURIComponent("Consulta sobre Términos y Condiciones")}`} className="hover:text-primary transition-colors">Términos</a>
            <a href={`mailto:soporte@legaltech.ar?subject=${encodeURIComponent("Consulta sobre Política de Privacidad")}`} className="hover:text-primary transition-colors">Privacidad</a>
            <a href={`mailto:soporte@legaltech.ar?subject=${encodeURIComponent("Contacto")}`} className="hover:text-primary transition-colors">Contacto</a>
          </div>
        </div>
      </div>
    </div>
  );
}
