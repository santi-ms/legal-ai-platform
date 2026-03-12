"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerStep2Schema, type RegisterStep2Input } from "@/app/lib/validation/auth";
import { RegisterProgress } from "./RegisterProgress";

interface RegisterFormStep2Props {
  onSubmit: (data: RegisterStep2Input) => void;
  onBack: () => void;
  isLoading?: boolean;
}

export function RegisterFormStep2({
  onSubmit,
  onBack,
  isLoading = false,
}: RegisterFormStep2Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterStep2Input>({
    resolver: zodResolver(registerStep2Schema),
  });

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
              placeholder="Mínimo 8 caracteres con letra y número"
              {...register("password")}
              className={`w-full pl-11 pr-11 rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-900 focus:ring-primary focus:border-primary ${
                errors.password ? "border-red-500" : ""
              }`}
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
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
          <p className="text-xs text-slate-500 dark:text-slate-400">
            La contraseña debe tener al menos 8 caracteres, incluir una letra y un número.
          </p>
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
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
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

