"use client";

import { useEffect, useState } from "react";
import { X, Loader2, Briefcase, CalendarClock, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Expediente,
  ExpedientePayload,
  ExpedienteMatter,
  ExpedienteStatus,
  listClients,
  Client,
  calcularPlazoProcesal,
  PlazoResult,
  Provincia,
  PROVINCIAS,
} from "@/app/lib/webApi";

// ─── Constants ────────────────────────────────────────────────────────────────

export const MATTER_LABELS: Record<ExpedienteMatter, string> = {
  civil:            "Civil",
  penal:            "Penal",
  laboral:          "Laboral",
  familia:          "Familia",
  comercial:        "Comercial",
  administrativo:   "Administrativo",
  constitucional:   "Constitucional",
  tributario:       "Tributario",
  otro:             "Otro",
};

export const STATUS_LABELS: Record<ExpedienteStatus, string> = {
  activo:     "Activo",
  cerrado:    "Cerrado",
  archivado:  "Archivado",
  suspendido: "Suspendido",
};

export const STATUS_COLORS: Record<ExpedienteStatus, string> = {
  activo:     "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cerrado:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  archivado:  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  suspendido: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

// ─── Form ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (payload: ExpedientePayload) => Promise<void>;
  initial?: Expediente | null;
  defaultClientId?: string | null;
}

const EMPTY: ExpedientePayload = {
  number: "",
  title: "",
  matter: "civil",
  status: "activo",
  clientId: null,
  court: "",
  judge: "",
  opposingParty: "",
  openedAt: new Date().toISOString().slice(0, 10),
  deadline: null,
  notes: "",
};

const PLAZOS_COMUNES = [
  { label: "3 días — traslados breves",          value: 3 },
  { label: "5 días — traslados comunes",          value: 5 },
  { label: "10 días — oposiciones",              value: 10 },
  { label: "15 días — contestación de demanda",  value: 15 },
  { label: "20 días — contestación ampliada",    value: 20 },
  { label: "30 días — plazo general",            value: 30 },
  { label: "60 días — plazo especial",           value: 60 },
];

export function ExpedienteForm({ open, onClose, onSave, initial, defaultClientId }: Props) {
  const [form, setForm] = useState<ExpedientePayload>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  // ── Calculadora de plazos ──────────────────────────────────────────────────
  const [showCalc, setShowCalc] = useState(false);
  const [calcFecha, setCalcFecha] = useState("");
  const [calcDias, setCalcDias] = useState<number>(5);
  const [calcProvincia, setCalcProvincia] = useState<Provincia>("corrientes");
  const [calcResult, setCalcResult] = useState<PlazoResult | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const handleCalcPlazo = async () => {
    if (!calcFecha) { setCalcError("Ingresá la fecha de notificación"); return; }
    setCalcLoading(true);
    setCalcError(null);
    setCalcResult(null);
    try {
      const result = await calcularPlazoProcesal(calcFecha, calcDias, calcProvincia);
      setCalcResult(result);
      // Rellenar el campo deadline automáticamente
      setForm((f) => ({ ...f, deadline: result.fechaVencimiento }));
    } catch {
      setCalcError("Error al calcular el plazo");
    } finally {
      setCalcLoading(false);
    }
  };

  const formatDateAR = (iso: string) =>
    new Date(iso + "T12:00:00").toLocaleDateString("es-AR", {
      day: "numeric", month: "long", year: "numeric",
    });

  // Cargar clientes para el dropdown
  useEffect(() => {
    if (!open) return;
    listClients({ sort: "name:asc", pageSize: 100 })
      .then((r) => setClients(r.clients))
      .catch(() => {});
  }, [open]);

  // Rellenar con datos del expediente existente si es edición
  useEffect(() => {
    if (initial) {
      setForm({
        number:        initial.number ?? "",
        title:         initial.title,
        matter:        initial.matter,
        status:        initial.status,
        clientId:      initial.clientId ?? null,
        court:         initial.court ?? "",
        judge:         initial.judge ?? "",
        opposingParty: initial.opposingParty ?? "",
        openedAt:      initial.openedAt ? initial.openedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
        closedAt:      initial.closedAt ? initial.closedAt.slice(0, 10) : null,
        deadline:      initial.deadline ? initial.deadline.slice(0, 10) : null,
        notes:         initial.notes ?? "",
      });
    } else {
      setForm(defaultClientId ? { ...EMPTY, clientId: defaultClientId } : EMPTY);
    }
    setError(null);
  }, [initial, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof ExpedientePayload, value: any) =>
    setForm((f) => ({ ...f, [key]: value === "" ? null : value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("El título es obligatorio"); return; }
    if (!form.matter)       { setError("La materia es obligatoria"); return; }

    setSaving(true);
    setError(null);
    try {
      // Convert date strings to ISO datetime for the API
      const payload: ExpedientePayload = {
        ...form,
        openedAt:  form.openedAt  ? new Date(form.openedAt  + "T00:00:00").toISOString() : null,
        closedAt:  form.closedAt  ? new Date(form.closedAt  + "T00:00:00").toISOString() : null,
        deadline:  form.deadline  ? new Date(form.deadline  + "T00:00:00").toISOString() : null,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative ml-auto w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white">
                {initial ? "Editar Expediente" : "Nuevo Expediente"}
              </h2>
              <p className="text-xs text-slate-400">
                {initial ? "Modificá los datos del caso" : "Registrá un nuevo caso o expediente"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Número + Título */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Nº Expediente
              </Label>
              <Input
                placeholder="2024/001234"
                value={form.number ?? ""}
                onChange={(e) => set("number", e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Descripción breve del caso"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Materia + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Materia <span className="text-red-500">*</span>
              </Label>
              <select
                value={form.matter}
                onChange={(e) => set("matter", e.target.value as ExpedienteMatter)}
                className="w-full h-10 rounded-md border border-input bg-slate-50 dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                required
              >
                {(Object.entries(MATTER_LABELS) as [ExpedienteMatter, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Estado</Label>
              <select
                value={form.status ?? "activo"}
                onChange={(e) => set("status", e.target.value as ExpedienteStatus)}
                className="w-full h-10 rounded-md border border-input bg-slate-50 dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              >
                {(Object.entries(STATUS_LABELS) as [ExpedienteStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Cliente principal
            </Label>
            <select
              value={form.clientId ?? ""}
              onChange={(e) => set("clientId", e.target.value || null)}
              className="w-full h-10 rounded-md border border-input bg-slate-50 dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">— Sin cliente —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Fecha de apertura
              </Label>
              <Input
                type="date"
                value={form.openedAt ? String(form.openedAt).slice(0, 10) : ""}
                onChange={(e) => set("openedAt", e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Vencimiento / Deadline
              </Label>
              <Input
                type="date"
                value={form.deadline ? String(form.deadline).slice(0, 10) : ""}
                onChange={(e) => set("deadline", e.target.value)}
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* ── Calculadora de plazos ─────────────────────────────────────── */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowCalc((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              <CalendarClock className="w-4 h-4" />
              <span className="flex-1 text-left">Calcular plazo automáticamente</span>
              {showCalc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCalc && (
              <div className="px-4 pb-4 space-y-3 border-t border-primary/20">
                <p className="text-xs text-slate-500 dark:text-slate-400 pt-3">
                  Ingresá la fecha de notificación, la provincia y el tipo de plazo. El vencimiento se calcula respetando feriados nacionales, provinciales y fines de semana.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Fecha de notificación
                    </Label>
                    <Input
                      type="date"
                      value={calcFecha}
                      onChange={(e) => { setCalcFecha(e.target.value); setCalcResult(null); }}
                      className="bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Provincia / Jurisdicción
                    </Label>
                    <select
                      value={calcProvincia}
                      onChange={(e) => { setCalcProvincia(e.target.value as Provincia); setCalcResult(null); }}
                      className="w-full h-10 rounded-md border border-input bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    >
                      {PROVINCIAS.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Tipo de plazo
                  </Label>
                  <select
                    value={calcDias}
                    onChange={(e) => { setCalcDias(Number(e.target.value)); setCalcResult(null); }}
                    className="w-full h-10 rounded-md border border-input bg-white dark:bg-slate-800 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  >
                    {PLAZOS_COMUNES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                <Button
                  type="button"
                  onClick={handleCalcPlazo}
                  disabled={calcLoading || !calcFecha}
                  className="w-full bg-primary hover:bg-primary/90 text-white text-sm"
                >
                  {calcLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Calculando...</>
                  ) : (
                    <><CalendarClock className="w-4 h-4 mr-2" />Calcular y usar como vencimiento</>
                  )}
                </Button>

                {calcError && (
                  <p className="text-xs text-red-500 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />{calcError}
                  </p>
                )}

                {calcResult && (
                  <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-3 space-y-2">
                    <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                      ✅ Vencimiento: {formatDateAR(calcResult.fechaVencimiento)}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {calcDias} días hábiles = {calcResult.diasCalendario} días corridos
                    </p>
                    {calcResult.feriadosSaltados.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                          Feriados saltados ({calcResult.feriadosSaltados.length}):
                        </p>
                        <ul className="space-y-0.5">
                          {calcResult.feriadosSaltados.map((f) => (
                            <li key={f.fecha} className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                              <span className={f.tipo === "provincial" ? "text-violet-400" : ""}>•</span>
                              {formatDateAR(f.fecha)} — {f.nombre}
                              {f.tipo === "provincial" && (
                                <span className="text-[10px] bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 rounded-full">prov.</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Datos judiciales */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Juzgado / Tribunal
            </Label>
            <Input
              placeholder="Ej: Juzgado Civil Nº 3 - Corrientes Capital"
              value={form.court ?? ""}
              onChange={(e) => set("court", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Juez interviniente
              </Label>
              <Input
                placeholder="Nombre del juez"
                value={form.judge ?? ""}
                onChange={(e) => set("judge", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Parte contraria
              </Label>
              <Input
                placeholder="Nombre de la contraparte"
                value={form.opposingParty ?? ""}
                onChange={(e) => set("opposingParty", e.target.value)}
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Notas internas
            </Label>
            <textarea
              rows={4}
              placeholder="Observaciones, estrategia, recordatorios..."
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              className="w-full rounded-md border border-input bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={saving}
            onClick={handleSubmit as any}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : initial ? "Guardar cambios" : "Crear expediente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
