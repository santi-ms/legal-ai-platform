"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SectionCard } from "@/components/ui/SectionCard";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  AlertCircle,
  KeyRound,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ─── Schema ───────────────────────────────────────────────────────────────────

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z
      .string()
      .min(8, "Mínimo 8 caracteres")
      .regex(/[a-z]/, "Debe contener una minúscula")
      .regex(/[A-Z]/, "Debe contener una mayúscula")
      .regex(/\d/, "Debe contener un número"),
    confirmPassword: z.string().min(1, "Confirmá la nueva contraseña"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

// ─── Password strength (reutilizamos la misma lógica que en registro) ─────────

const REQUIREMENTS = [
  { id: "length",    label: "Mínimo 8 caracteres",  test: (v: string) => v.length >= 8 },
  { id: "lowercase", label: "Una minúscula",         test: (v: string) => /[a-z]/.test(v) },
  { id: "uppercase", label: "Una mayúscula",         test: (v: string) => /[A-Z]/.test(v) },
  { id: "number",    label: "Un número",             test: (v: string) => /\d/.test(v) },
];

function PasswordStrengthMini({ value }: { value: string }) {
  if (!value) return null;
  const score = REQUIREMENTS.filter((r) => r.test(value)).length;
  const colors = ["", "bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-emerald-500"];
  const labels = ["", "Muy débil", "Débil", "Aceptable", "Fuerte"];
  const labelColors = ["", "text-red-500", "text-orange-400", "text-yellow-500", "text-emerald-500"];

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
              i < score ? colors[score] : "bg-slate-200 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs font-medium ${labelColors[score]}`}>{labels[score]}</p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {REQUIREMENTS.map((req) => {
          const met = req.test(value);
          return (
            <div key={req.id} className="flex items-center gap-1.5">
              <Check className={`w-3 h-3 flex-shrink-0 ${met ? "text-emerald-500" : "text-slate-300 dark:text-slate-600"}`} />
              <span className={`text-xs ${met ? "text-slate-600 dark:text-slate-300" : "text-slate-400 dark:text-slate-500"}`}>
                {req.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Change Password Form ─────────────────────────────────────────────────────

function ChangePasswordSection() {
  const { success, error: showError } = useToast();
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const newPasswordValue = watch("newPassword") ?? "";

  const onSubmit = async (data: ChangePasswordInput) => {
    setApiError(null);
    setIsSuccess(false);

    try {
      const res = await fetch("/api/_proxy/api/user/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        if (json.error === "invalid_current_password") {
          setApiError("La contraseña actual es incorrecta.");
        } else if (json.error === "no_password") {
          setApiError("Tu cuenta usa Google para iniciar sesión. No tenés contraseña para cambiar.");
        } else {
          setApiError(json.message || "No pudimos cambiar la contraseña. Intentá de nuevo.");
        }
        return;
      }

      setIsSuccess(true);
      reset();
      success("Contraseña actualizada correctamente");
    } catch {
      setApiError("Error de conexión. Revisá tu internet e intentá de nuevo.");
    }
  };

  return (
    <SectionCard
      icon={KeyRound}
      iconGradient="rose"
      eyebrow="Seguridad"
      title="Cambiar contraseña"
      description="Usá una contraseña segura que no uses en otros sitios."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-5">
        {/* Contraseña actual */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Contraseña actual
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <Input
              type={show.current ? "text" : "password"}
              placeholder="Tu contraseña actual"
              {...register("currentPassword")}
              className={`pl-10 pr-10 ${errors.currentPassword ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, current: !s.current }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-red-500">{errors.currentPassword.message}</p>
          )}
        </div>

        {/* Nueva contraseña */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nueva contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <Input
              type={show.new ? "text" : "password"}
              placeholder="Nueva contraseña"
              {...register("newPassword")}
              className={`pl-10 pr-10 ${errors.newPassword ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, new: !s.new }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <PasswordStrengthMini value={newPasswordValue} />
          {errors.newPassword && (
            <p className="text-xs text-red-500">{errors.newPassword.message}</p>
          )}
        </div>

        {/* Confirmar nueva contraseña */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Confirmar nueva contraseña
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
            <Input
              type={show.confirm ? "text" : "password"}
              placeholder="Repetí la nueva contraseña"
              {...register("confirmPassword")}
              className={`pl-10 pr-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* API error */}
        {apiError && (
          <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{apiError}</p>
          </div>
        )}

        {/* Success */}
        {isSuccess && (
          <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
              Contraseña actualizada correctamente.
            </p>
          </div>
        )}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-ink text-white hover:bg-slate-900 font-semibold shadow-soft hover:shadow-hover"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Actualizando...
            </>
          ) : (
            "Actualizar contraseña"
          )}
        </Button>
      </form>
    </SectionCard>
  );
}

// ─── Coming soon: 2FA ─────────────────────────────────────────────────────────

function TwoFactorSection() {
  return (
    <SectionCard
      icon={ShieldCheck}
      iconGradient="amber"
      eyebrow="Pronto"
      title="Autenticación de dos factores"
      description="Agregá una capa extra de seguridad a tu cuenta con 2FA por app o SMS."
      actions={
        <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-full">
          Próximamente
        </span>
      }
    >
      <Button disabled variant="outline" className="opacity-50 cursor-not-allowed">
        Configurar 2FA
      </Button>
    </SectionCard>
  );
}

// ─── Export de datos ──────────────────────────────────────────────────────────

function DataExportSection({ isAdmin }: { isAdmin: boolean }) {
  const { error: toastError, success: toastSuccess } = useToast();
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      const resp = await fetch("/api/_proxy/tenant/export", {
        method: "GET",
        headers: { "X-Requested-With": "XMLHttpRequest" },
        cache: "no-store",
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.message || `Error ${resp.status}`);
      }
      const blob = await resp.blob();
      const dateStr = new Date().toISOString().slice(0, 10);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `doculex-export-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toastSuccess("Descarga iniciada. Guardá el archivo en un lugar seguro.");
    } catch (err) {
      toastError(err instanceof Error ? err.message : "No pudimos generar la exportación.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <SectionCard
      icon={Download}
      iconGradient="blue"
      eyebrow="Portabilidad"
      title="Descargar mis datos"
      description="Exportá en JSON todos los datos del estudio: clientes, expedientes, documentos, vencimientos, honorarios y más. Los PDFs binarios y credenciales no se incluyen."
    >
      <div className="space-y-3">
        <Button
          type="button"
          onClick={handleExport}
          disabled={downloading || !isAdmin}
          className="gap-2"
        >
          {downloading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Preparando descarga…</>
          ) : (
            <><Download className="w-4 h-4" /> Descargar JSON</>
          )}
        </Button>
        {!isAdmin && (
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            Solo el administrador del estudio puede exportar los datos.
          </p>
        )}
      </div>
    </SectionCard>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function SecuritySettingsPage() {
  const { isAuthenticated, isLoading: authLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings/security");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="mt-6 space-y-5">
      <ChangePasswordSection />
      <TwoFactorSection />
      <DataExportSection isAdmin={isAdmin} />
    </div>
  );
}
