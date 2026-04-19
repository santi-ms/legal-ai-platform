"use client";

import { User, Phone, Award, Scale } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";

const ESPECIALIDADES = [
  { value: "", label: "— Seleccioná tu especialidad —" },
  { value: "civil_comercial", label: "Civil y Comercial" },
  { value: "penal", label: "Penal" },
  { value: "laboral", label: "Laboral" },
  { value: "familia_sucesiones", label: "Familia y Sucesiones" },
  { value: "administrativo", label: "Derecho Administrativo" },
  { value: "societario", label: "Societario / Empresarial" },
  { value: "propiedad_intelectual", label: "Propiedad Intelectual" },
  { value: "ambiental", label: "Derecho Ambiental" },
  { value: "tributario", label: "Tributario / Fiscal" },
  { value: "internacional", label: "Derecho Internacional" },
  { value: "constitucional", label: "Derecho Constitucional" },
  { value: "otro", label: "Otro" },
];

const ROLES = [
  { value: "", label: "— Seleccioná tu rol —" },
  { value: "abogado_independiente", label: "Abogado independiente" },
  { value: "socio", label: "Socio del estudio" },
  { value: "asociado", label: "Asociado" },
  { value: "empleado", label: "Empleado de estudio" },
  { value: "asesor_in_house", label: "Asesor in-house" },
  { value: "docente", label: "Docente / Académico" },
  { value: "otro", label: "Otro" },
];

interface ProfileSectionProps {
  formData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    bio?: string;
    phone?: string;
    matricula?: string;
    especialidad?: string;
    professionalRole?: string;
  };
  onFieldChange: (field: string, value: string) => void;
}

export function ProfileSection({ formData, onFieldChange }: ProfileSectionProps) {
  const { data: session } = useSession();
  const user = session?.user;

  const firstName = formData.firstName ?? user?.name?.split(" ")[0] ?? "";
  const lastName = formData.lastName ?? user?.name?.split(" ").slice(1).join(" ") ?? "";
  const email = formData.email ?? user?.email ?? "";

  const inputClass =
    "rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary transition-all p-3 text-sm";
  const selectClass =
    "w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary transition-all px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 cursor-pointer";

  return (
    <div className="px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Información Personal</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Tus datos personales y profesionales como abogado.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
        {/* Nombre */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="firstName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Nombre <span className="text-red-500">*</span>
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => onFieldChange("firstName", e.target.value)}
            className={inputClass}
            placeholder="Ej. Juan"
            type="text"
          />
        </div>

        {/* Apellido */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="lastName" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Apellido
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => onFieldChange("lastName", e.target.value)}
            className={inputClass}
            placeholder="Ej. Pérez"
            type="text"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Correo Electrónico <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            value={email}
            onChange={(e) => onFieldChange("email", e.target.value)}
            className={inputClass}
            placeholder="juan.perez@estudio.com"
            type="email"
          />
        </div>

        {/* Teléfono */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Teléfono
            </span>
          </Label>
          <Input
            id="phone"
            value={formData.phone ?? ""}
            onChange={(e) => onFieldChange("phone", e.target.value)}
            className={inputClass}
            placeholder="+54 11 1234-5678"
            type="tel"
          />
        </div>

        {/* Matrícula */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="matricula" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Matrícula Profesional
            </span>
          </Label>
          <Input
            id="matricula"
            value={formData.matricula ?? ""}
            onChange={(e) => onFieldChange("matricula", e.target.value)}
            className={inputClass}
            placeholder="Ej. CPACF 12345"
            type="text"
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            CPACF, matrícula provincial u otro colegio.
          </p>
        </div>

        {/* Especialidad */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="especialidad" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5" />
              Especialidad Principal
            </span>
          </Label>
          <select
            id="especialidad"
            value={formData.especialidad ?? ""}
            onChange={(e) => onFieldChange("especialidad", e.target.value)}
            className={selectClass}
          >
            {ESPECIALIDADES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Rol profesional */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="professionalRole" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Rol Profesional
          </Label>
          <select
            id="professionalRole"
            value={formData.professionalRole ?? ""}
            onChange={(e) => onFieldChange("professionalRole", e.target.value)}
            className={selectClass}
          >
            {ROLES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Biografía */}
        <div className="flex flex-col gap-2 md:col-span-2">
          <Label htmlFor="bio" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Biografía Profesional
          </Label>
          <textarea
            id="bio"
            value={formData.bio ?? ""}
            onChange={(e) => onFieldChange("bio", e.target.value)}
            className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary transition-all p-3 text-sm resize-none text-slate-900 dark:text-slate-100"
            placeholder="Contanos brevemente tu trayectoria y áreas de práctica..."
            rows={3}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Aparece en los documentos generados. Máximo 1000 caracteres.
          </p>
        </div>
      </div>
    </div>
  );
}
