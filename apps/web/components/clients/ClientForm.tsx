"use client";

import { useState, useEffect, useRef } from "react";
import { X, User, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Client, ClientPayload, ClientType, DocumentIdType } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

const PROVINCES = [
  "Buenos Aires", "CABA", "Catamarca", "Chaco", "Chubut", "Córdoba",
  "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja",
  "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan",
  "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero",
  "Tierra del Fuego", "Tucumán",
];

interface ClientFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: ClientPayload) => Promise<void>;
  initialData?: Client | null;
}

const EMPTY: ClientPayload = {
  type: "persona_fisica",
  name: "",
  documentType: null,
  documentNumber: null,
  email: null,
  phone: null,
  address: null,
  city: null,
  province: null,
  contactPersonName: null,
  contactPersonRole: null,
  contactPersonPhone: null,
  contactPersonEmail: null,
  notes: null,
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all";

const selectClass =
  "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all cursor-pointer";

export function ClientForm({ open, onClose, onSave, initialData }: ClientFormProps) {
  const [form, setForm] = useState<ClientPayload>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Focus trap + Escape handler
  useEffect(() => {
    if (!open) return;

    const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setForm(
        initialData
          ? {
              type: initialData.type,
              name: initialData.name,
              documentType: initialData.documentType,
              documentNumber: initialData.documentNumber,
              email: initialData.email,
              phone: initialData.phone,
              address: initialData.address,
              city: initialData.city,
              province: initialData.province,
              contactPersonName: initialData.contactPersonName ?? null,
              contactPersonRole: initialData.contactPersonRole ?? null,
              contactPersonPhone: initialData.contactPersonPhone ?? null,
              contactPersonEmail: initialData.contactPersonEmail ?? null,
              notes: initialData.notes,
            }
          : EMPTY
      );
      setError(null);
    }
  }, [open, initialData]);

  const set = (field: keyof ClientPayload, value: string | null) => {
    setForm((prev) => ({ ...prev, [field]: value || null }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("El nombre es requerido."); return; }
    setSaving(true);
    setError(null);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el cliente.");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="client-form-title"
        className="fixed right-0 top-0 h-full w-full max-w-lg z-50 bg-white dark:bg-slate-900 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
          <div>
            <h2 id="client-form-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {initialData ? "Editar cliente" : "Nuevo cliente"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {initialData ? "Modificá los datos del cliente." : "Completá los datos del cliente del estudio."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {/* Tipo de persona */}
          <Field label="Tipo de persona" required>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: "persona_fisica", label: "Persona Física", icon: User },
                { value: "persona_juridica", label: "Persona Jurídica", icon: Building2 },
              ] as { value: ClientType; label: string; icon: React.ElementType }[]).map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, type: opt.value }))}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 text-sm font-semibold transition-all",
                      form.type === opt.value
                        ? "border-primary bg-primary/5 text-primary dark:bg-primary/10"
                        : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/40"
                    )}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Nombre */}
          <Field label={form.type === "persona_juridica" ? "Razón Social" : "Nombre y Apellido"} required>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder={form.type === "persona_juridica" ? "Ej: García & Asociados SRL" : "Ej: María García Pérez"}
              maxLength={200}
            />
          </Field>

          {/* Documento */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo de documento">
              <select
                className={selectClass}
                value={form.documentType ?? ""}
                onChange={(e) => set("documentType", e.target.value as DocumentIdType || null)}
              >
                <option value="">— Sin especificar —</option>
                {form.type === "persona_fisica"
                  ? ["DNI", "CUIL", "Pasaporte"].map((d) => <option key={d} value={d}>{d}</option>)
                  : ["CUIT"].map((d) => <option key={d} value={d}>{d}</option>)
                }
              </select>
            </Field>
            <Field label="Número">
              <input
                className={inputClass}
                value={form.documentNumber ?? ""}
                onChange={(e) => set("documentNumber", e.target.value)}
                placeholder={form.documentType === "CUIT" ? "20-12345678-9" : "12345678"}
                maxLength={50}
              />
            </Field>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email">
              <input
                type="email"
                className={inputClass}
                value={form.email ?? ""}
                onChange={(e) => set("email", e.target.value)}
                placeholder="mail@ejemplo.com"
              />
            </Field>
            <Field label="Teléfono">
              <input
                className={inputClass}
                value={form.phone ?? ""}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+54 9 11 1234-5678"
                maxLength={50}
              />
            </Field>
          </div>

          {/* Domicilio */}
          <Field label="Domicilio">
            <input
              className={inputClass}
              value={form.address ?? ""}
              onChange={(e) => set("address", e.target.value)}
              placeholder="Av. Corrientes 1234, Piso 3"
              maxLength={300}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Ciudad">
              <input
                className={inputClass}
                value={form.city ?? ""}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Buenos Aires"
                maxLength={100}
              />
            </Field>
            <Field label="Provincia">
              <select
                className={selectClass}
                value={form.province ?? ""}
                onChange={(e) => set("province", e.target.value)}
              >
                <option value="">— Seleccionar —</option>
                {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          {/* Persona de contacto — solo para persona jurídica */}
          {form.type === "persona_juridica" && (
            <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-800/40">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Persona de contacto
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nombre y apellido">
                  <input
                    className={inputClass}
                    value={form.contactPersonName ?? ""}
                    onChange={(e) => set("contactPersonName", e.target.value)}
                    placeholder="Ej: Juan Martínez"
                    maxLength={200}
                  />
                </Field>
                <Field label="Cargo / Rol">
                  <input
                    className={inputClass}
                    value={form.contactPersonRole ?? ""}
                    onChange={(e) => set("contactPersonRole", e.target.value)}
                    placeholder="Ej: Gerente, Apoderado"
                    maxLength={100}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Teléfono directo">
                  <input
                    className={inputClass}
                    value={form.contactPersonPhone ?? ""}
                    onChange={(e) => set("contactPersonPhone", e.target.value)}
                    placeholder="+54 9 11 1234-5678"
                    maxLength={50}
                  />
                </Field>
                <Field label="Email directo">
                  <input
                    type="email"
                    className={inputClass}
                    value={form.contactPersonEmail ?? ""}
                    onChange={(e) => set("contactPersonEmail", e.target.value)}
                    placeholder="contacto@empresa.com"
                  />
                </Field>
              </div>
            </div>
          )}

          {/* Notas internas */}
          <Field label="Notas internas">
            <textarea
              className={cn(inputClass, "resize-none")}
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Información relevante sobre el cliente (solo visible para el estudio)…"
              maxLength={2000}
            />
          </Field>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-primary text-white hover:bg-primary/90 min-w-[120px]"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : initialData ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </div>
      </div>
    </>
  );
}
