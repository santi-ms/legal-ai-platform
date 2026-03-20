"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Building2, User } from "lucide-react";
import { completeOnboarding } from "@/app/lib/webApi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";

type OnboardingFormProps = {
  initialName: string;
  initialEmail: string;
};

export function OnboardingForm({ initialName, initialEmail }: OnboardingFormProps) {
  const router = useRouter();
  const { update } = useSession();
  const { success } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName);
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Ingresá tu nombre para continuar.");
      return;
    }

    if (!company.trim()) {
      setError("Ingresá la empresa o estudio para continuar.");
      return;
    }

    try {
      await completeOnboarding({
        name: name.trim(),
        company: company.trim(),
      });

      await update({ reason: "onboarding-complete" });
      success("Onboarding completado exitosamente");

      startTransition(() => {
        router.replace("/documents");
        router.refresh();
      });
    } catch (submitError: any) {
      setError(submitError?.message || "No pudimos completar el onboarding.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nombre completo
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="pl-10"
              placeholder="Ej. Juan Pérez"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Correo electrónico
          </Label>
          <Input id="email" value={initialEmail} disabled className="bg-slate-100 dark:bg-slate-800" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="company" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Empresa o estudio
          </Label>
          <div className="relative">
            <Building2 className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              id="company"
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className="pl-10"
              placeholder="Ej. Estudio Pérez & Asociados"
              disabled={isPending}
            />
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Configurando espacio...
          </>
        ) : (
          "Continuar"
        )}
      </Button>
    </form>
  );
}