"use client";

import { useState, useRef } from "react";
import { Building2, Phone, Globe, MapPin, Hash, Loader2, Upload, X, ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { uploadTenantLogo, deleteTenantLogo } from "@/app/lib/webApi";

interface EstudioFormData {
  name: string;
  cuit: string;
  address: string;
  phone: string;
  website: string;
}

interface EstudioSectionProps {
  formData: EstudioFormData;
  onFieldChange: (field: keyof EstudioFormData, value: string) => void;
  onSave: () => Promise<void>;
  isSaving: boolean;
  hasChanges: boolean;
  hasNoTenant?: boolean;
  logoUrl?: string | null;
  onLogoChange?: (logoUrl: string | null) => void;
}

export function EstudioSection({
  formData,
  onFieldChange,
  onSave,
  isSaving,
  hasChanges,
  hasNoTenant = false,
  logoUrl,
  onLogoChange,
}: EstudioSectionProps) {
  const inputClass =
    "rounded-lg border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:ring-primary focus:border-primary transition-all p-3 text-sm";

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isDeletingLogo, setIsDeletingLogo] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoError(null);
    setIsUploadingLogo(true);
    try {
      const { logoUrl: newLogoUrl } = await uploadTenantLogo(file);
      onLogoChange?.(newLogoUrl);
    } catch (err: any) {
      setLogoError(err.message || "Error al subir el logo");
    } finally {
      setIsUploadingLogo(false);
      // Reset input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleLogoDelete() {
    setLogoError(null);
    setIsDeletingLogo(true);
    try {
      await deleteTenantLogo();
      onLogoChange?.(null);
    } catch (err: any) {
      setLogoError(err.message || "Error al eliminar el logo");
    } finally {
      setIsDeletingLogo(false);
    }
  }

  return (
    <div className="px-4 py-8 border-t border-slate-200 dark:border-slate-800 mt-4">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
          <Building2 className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Datos del Estudio</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Información de tu estudio jurídico. Se usa en los encabezados de documentos.
          </p>
        </div>
      </div>

      {hasNoTenant ? (
        <div className="max-w-2xl rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            Todavía no completaste el onboarding. Completalo para poder editar los datos de tu estudio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
          {/* Nombre del estudio */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="estudio-name" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Nombre del Estudio <span className="text-red-500">*</span>
            </Label>
            <Input
              id="estudio-name"
              value={formData.name}
              onChange={(e) => onFieldChange("name", e.target.value)}
              className={inputClass}
              placeholder="Ej. Estudio Pérez & Asociados"
              type="text"
            />
          </div>

          {/* CUIT */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="estudio-cuit" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                CUIT
              </span>
            </Label>
            <Input
              id="estudio-cuit"
              value={formData.cuit}
              onChange={(e) => onFieldChange("cuit", e.target.value)}
              className={inputClass}
              placeholder="20-12345678-9"
              type="text"
            />
          </div>

          {/* Teléfono del estudio */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="estudio-phone" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                Teléfono del Estudio
              </span>
            </Label>
            <Input
              id="estudio-phone"
              value={formData.phone}
              onChange={(e) => onFieldChange("phone", e.target.value)}
              className={inputClass}
              placeholder="+54 11 4321-0000"
              type="tel"
            />
          </div>

          {/* Dirección */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="estudio-address" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                Dirección
              </span>
            </Label>
            <Input
              id="estudio-address"
              value={formData.address}
              onChange={(e) => onFieldChange("address", e.target.value)}
              className={inputClass}
              placeholder="Av. Corrientes 1234, Piso 3, CABA"
              type="text"
            />
          </div>

          {/* Sitio web */}
          <div className="flex flex-col gap-2 md:col-span-2">
            <Label htmlFor="estudio-website" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Sitio Web
              </span>
            </Label>
            <Input
              id="estudio-website"
              value={formData.website}
              onChange={(e) => onFieldChange("website", e.target.value)}
              className={inputClass}
              placeholder="https://www.muestudio.com.ar"
              type="url"
            />
          </div>

          {/* Logo del estudio */}
          <div className="flex flex-col gap-3 md:col-span-2">
            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                Logo del Estudio
              </span>
            </Label>
            <p className="text-xs text-slate-500 dark:text-slate-400 -mt-2">
              Se mostrará en el encabezado de los PDFs generados. PNG, JPG o WebP, máx. 500KB.
            </p>

            <div className="flex items-center gap-4">
              {/* Preview */}
              {logoUrl ? (
                <div className="relative w-32 h-16 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt="Logo del estudio"
                    className="max-w-full max-h-full object-contain p-1"
                  />
                </div>
              ) : (
                <div className="w-32 h-16 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}

              {/* Botones */}
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="text-xs"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3 h-3 mr-1.5" />
                      {logoUrl ? "Cambiar logo" : "Subir logo"}
                    </>
                  )}
                </Button>
                {logoUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleLogoDelete}
                    disabled={isDeletingLogo}
                    className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    {isDeletingLogo ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1.5" />
                        Quitar logo
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {logoError && (
              <p className="text-xs text-red-500 mt-1">{logoError}</p>
            )}
          </div>

          {/* Botón guardar propio de esta sección */}
          <div className="md:col-span-2 flex justify-end pt-2">
            <Button
              type="button"
              onClick={onSave}
              disabled={!hasChanges || isSaving}
              className="bg-primary text-white hover:bg-primary/90 font-semibold disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar datos del estudio"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
