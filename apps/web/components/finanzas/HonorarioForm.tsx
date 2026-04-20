"use client";

import { useEffect, useState } from "react";
import { X, Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Honorario,
  HonorarioPayload,
  HonorarioTipo,
  HonorarioEstado,
  listExpedientes,
  listClients,
  Expediente,
  Client,
} from "@/app/lib/webApi";

// ─── Constants ────────────────────────────────────────────────────────────────

export const TIPO_LABELS: Record<HonorarioTipo, string> = {
  consulta:   "Consulta",
  juicio:     "Juicio",
  acuerdo:    "Acuerdo",
  mediacion:  "Mediación",
  otro:       "Otro",
};

export const ESTADO_LABELS: Record<HonorarioEstado, string> = {
  presupuestado: "Presupuestado",
  facturado:     "Facturado",
  cobrado:       "Cobrado",
  cancelado:     "Cancelado",
};

export const ESTADO_COLORS: Record<HonorarioEstado, string> = {
  presupuestado: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  facturado:     "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  cobrado:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  cancelado:     "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

// ─── Form ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (payload: HonorarioPayload) => Promise<void>;
  initial?: Honorario | null;
  presetExpedienteId?: string;
  presetClientId?: string;
}

const EMPTY: HonorarioPayload = {
  expedienteId:     null,
  clientId:         null,
  tipo:             "consulta",
  concepto:         "",
  monto:            0,
  moneda:           "ARS",
  estado:           "presupuestado",
  fechaEmision:     new Date().toISOString(),
  fechaVencimiento: null,
  fechaCobro:       null,
  notas:            "",
};

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

function fromDateInput(s: string): string | null {
  if (!s) return null;
  return new Date(s + "T12:00:00Z").toISOString();
}

export function HonorarioForm({
  open,
  onClose,
  onSave,
  initial,
  presetExpedienteId,
  presetClientId,
}: Props) {
  const [form, setForm] = useState<HonorarioPayload>(EMPTY);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    // Cargar expedientes + clientes
    listExpedientes({ pageSize: 500 }).then((r) => setExpedientes(r.expedientes)).catch(() => {});
    listClients({ pageSize: 500 }).then((r) => setClients(r.clients)).catch(() => {});

    if (initial) {
      setForm({
        expedienteId:     initial.expedienteId,
        clientId:         initial.clientId,
        tipo:             initial.tipo,
        concepto:         initial.concepto,
        monto:            initial.monto,
        moneda:           initial.moneda,
        estado:           initial.estado,
        fechaEmision:     initial.fechaEmision,
        fechaVencimiento: initial.fechaVencimiento,
        fechaCobro:       initial.fechaCobro,
        notas:            initial.notas ?? "",
      });
    } else {
      setForm({
        ...EMPTY,
        expedienteId: presetExpedienteId ?? null,
        clientId:     presetClientId ?? null,
      });
    }
    setError(null);
  }, [open, initial, presetExpedienteId, presetClientId]);

  if (!open) return null;

  function update<K extends keyof HonorarioPayload>(key: K, value: HonorarioPayload[K]) {
    setForm((p) => ({ ...p, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.concepto || form.concepto.trim().length < 3) {
      setError("El concepto debe tener al menos 3 caracteres");
      return;
    }
    if (!form.monto || form.monto <= 0) {
      setError("El monto debe ser mayor a 0");
      return;
    }

    setSaving(true);
    try {
      await onSave({
        ...form,
        concepto: form.concepto.trim(),
        notas: form.notas?.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error al guardar el honorario");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="font-semibold text-lg">
              {initial ? "Editar honorario" : "Nuevo honorario"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Concepto */}
          <div>
            <Label htmlFor="concepto">Concepto *</Label>
            <Input
              id="concepto"
              value={form.concepto}
              onChange={(e) => update("concepto", e.target.value)}
              placeholder="Ej: Honorarios por contestación de demanda"
              maxLength={300}
              required
            />
          </div>

          {/* Tipo + Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <select
                id="tipo"
                value={form.tipo}
                onChange={(e) => update("tipo", e.target.value as HonorarioTipo)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                {Object.entries(TIPO_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="estado">Estado *</Label>
              <select
                id="estado"
                value={form.estado}
                onChange={(e) => update("estado", e.target.value as HonorarioEstado)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                {Object.entries(ESTADO_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Monto + Moneda */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Label htmlFor="monto">Monto *</Label>
              <Input
                id="monto"
                type="number"
                step="0.01"
                min="0"
                value={form.monto || ""}
                onChange={(e) => update("monto", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <Label htmlFor="moneda">Moneda</Label>
              <select
                id="moneda"
                value={form.moneda}
                onChange={(e) => update("moneda", e.target.value)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          {/* Expediente + Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expedienteId">Expediente (opcional)</Label>
              <select
                id="expedienteId"
                value={form.expedienteId ?? ""}
                onChange={(e) => update("expedienteId", e.target.value || null)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="">— Sin expediente —</option>
                {expedientes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.number ? `[${e.number}] ` : ""}{e.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="clientId">Cliente (opcional)</Label>
              <select
                id="clientId"
                value={form.clientId ?? ""}
                onChange={(e) => update("clientId", e.target.value || null)}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                <option value="">— Sin cliente —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="fechaEmision">Fecha emisión</Label>
              <Input
                id="fechaEmision"
                type="date"
                value={toDateInput(form.fechaEmision)}
                onChange={(e) => update("fechaEmision", fromDateInput(e.target.value) ?? undefined)}
              />
            </div>
            <div>
              <Label htmlFor="fechaVencimiento">Vence</Label>
              <Input
                id="fechaVencimiento"
                type="date"
                value={toDateInput(form.fechaVencimiento)}
                onChange={(e) => update("fechaVencimiento", fromDateInput(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="fechaCobro">Cobrado el</Label>
              <Input
                id="fechaCobro"
                type="date"
                value={toDateInput(form.fechaCobro)}
                onChange={(e) => update("fechaCobro", fromDateInput(e.target.value))}
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label htmlFor="notas">Notas internas</Label>
            <textarea
              id="notas"
              value={form.notas ?? ""}
              onChange={(e) => update("notas", e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm resize-none"
              placeholder="Detalles internos, condiciones de pago, etc."
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3">
              {error}
            </div>
          )}

          {/* Acciones */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {initial ? "Guardar cambios" : "Crear honorario"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
