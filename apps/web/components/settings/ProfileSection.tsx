"use client";

import { User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

interface ProfileSectionProps {
  formData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    bio?: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export function ProfileSection({ formData, onFieldChange }: ProfileSectionProps) {
  const { data: session } = useSession();
  const user = session?.user;

  // Initialize form data from session if available
  const firstName = formData.firstName || user?.name?.split(" ")[0] || "";
  const lastName = formData.lastName || user?.name?.split(" ").slice(1).join(" ") || "";
  const email = formData.email || user?.email || "";

  return (
    <div className="px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Información del Perfil</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Actualiza tus datos personales y de contacto.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre</Label>
          <Input
            value={firstName}
            onChange={(e) => onFieldChange("firstName", e.target.value)}
            className="rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary transition-all p-3 text-sm"
            placeholder="Ej. Juan"
            type="text"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Apellido</Label>
          <Input
            value={lastName}
            onChange={(e) => onFieldChange("lastName", e.target.value)}
            className="rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary transition-all p-3 text-sm"
            placeholder="Ej. Pérez"
            type="text"
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Correo Electrónico
          </Label>
          <Input
            value={email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            className="rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary transition-all p-3 text-sm"
            placeholder="juan.perez@empresa.com"
            type="email"
          />
        </div>
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Biografía Profesional
          </Label>
          <textarea
            value={formData.bio || ""}
            onChange={(e) => onFieldChange("bio", e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary transition-all p-3 text-sm resize-none"
            placeholder="Cuéntanos un poco sobre ti..."
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

