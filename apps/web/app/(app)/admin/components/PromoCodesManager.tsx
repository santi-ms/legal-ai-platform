"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import {
  listPromoCodes,
  createPromoCode,
  patchPromoCode,
  deletePromoCode,
  type PromoCode,
} from "@/app/lib/webApi";
import {
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Save,
  X,
  Tag,
  Clock,
  Calendar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanBadge, fmtDate } from "./adminHelpers";

// ---------------------------------------------------------------------------

const EMPTY_PROMO = {
  code: "", planCode: "pro" as const, trialDays: 14, maxUses: -1, expiresAt: "", note: "",
};

// ---------------------------------------------------------------------------

export function PromoCodesManager() {
  const { success, error: showError } = useToast();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_PROMO);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPromos(await listPromoCodes()); }
    catch (e: any) { showError(e.message ?? "Error cargando códigos"); }
    finally { setLoading(false); }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  async function handleCreate() {
    if (!form.code.trim()) { showError("El código es obligatorio."); return; }
    setSaving(true);
    try {
      const created = await createPromoCode({
        code:      form.code.trim().toUpperCase(),
        planCode:  form.planCode,
        trialDays: form.trialDays,
        maxUses:   form.maxUses,
        expiresAt: form.expiresAt || null,
        note:      form.note || null,
      });
      setPromos((prev) => [created, ...prev]);
      setShowForm(false);
      setForm(EMPTY_PROMO);
      success(`Código "${created.code}" creado correctamente.`);
    } catch (e: any) { showError(e.message ?? "Error"); }
    finally { setSaving(false); }
  }

  async function handleToggle(p: PromoCode) {
    try {
      const updated = await patchPromoCode(p.id, { isActive: !p.isActive });
      setPromos((prev) => prev.map((x) => (x.id === p.id ? updated : x)));
      success(updated.isActive ? "Código activado" : "Código desactivado");
    } catch (e: any) { showError(e.message ?? "Error"); }
  }

  async function handleDelete(p: PromoCode) {
    if (!confirm(`¿Eliminar el código "${p.code}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deletePromoCode(p.id);
      setPromos((prev) => prev.filter((x) => x.id !== p.id));
      success("Código eliminado");
    } catch (e: any) { showError(e.message ?? "Error"); }
  }

  const usagePct = (p: PromoCode) =>
    p.maxUses === -1 ? null : Math.round((p.usedCount / p.maxUses) * 100);

  const isExpired = (p: PromoCode) =>
    p.expiresAt ? new Date(p.expiresAt) < new Date() : false;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Códigos promocionales que otorgan un trial gratuito al registrarse.
        </p>
        <Button size="sm" onClick={() => setShowForm((v) => !v)} className="gap-2 shrink-0 ml-4">
          <Plus className="w-3.5 h-3.5" /> Nuevo código
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Tag className="w-4 h-4 text-primary" /> Crear nuevo código
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Código */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s/g, "") })}
                placeholder="Ej: ABOGACIA2026"
                maxLength={40}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Plan */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Plan a activar</label>
              <select
                value={form.planCode}
                onChange={(e) => setForm({ ...form, planCode: e.target.value as any })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="pro">Pro</option>
                <option value="proplus">Pro+</option>
                <option value="estudio">Estudio</option>
              </select>
            </div>

            {/* Días de trial */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Días de trial</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.trialDays}
                onChange={(e) => setForm({ ...form, trialDays: parseInt(e.target.value) || 14 })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Máximo de usos */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Máximo de usos
              </label>
              {form.maxUses === -1 ? (
                <div className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 italic">
                  Sin límite de usos
                </div>
              ) : (
                <input
                  type="number"
                  min={1}
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: Math.max(1, parseInt(e.target.value) || 1) })}
                  placeholder="Ej: 100"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              )}
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.maxUses === -1}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.checked ? -1 : 100 })}
                  className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-primary focus:ring-primary/30"
                />
                Sin límite de usos (código ilimitado)
              </label>
            </div>

            {/* Vencimiento */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Válido hasta <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="date"
                value={form.expiresAt ? form.expiresAt.split("T")[0] : ""}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value ? `${e.target.value}T23:59:59Z` : "" })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Nota interna */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Nota interna <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="Ej: Charla UBA mayo 2026"
                maxLength={200}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={handleCreate} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Crear código
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setShowForm(false); setForm(EMPTY_PROMO); }}
              disabled={saving}
              className="gap-2 border-slate-200 dark:border-slate-700"
            >
              <X className="w-3.5 h-3.5" /> Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* List */}
      {promos.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          No hay códigos promocionales. Creá uno con el botón de arriba.
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map((p) => {
            const pct = usagePct(p);
            const expired = isExpired(p);

            return (
              <div
                key={p.id}
                className={`bg-white dark:bg-slate-900 rounded-xl border shadow-sm px-5 py-4 flex items-center gap-4 ${
                  !p.isActive || expired
                    ? "border-slate-100 dark:border-slate-800 opacity-60"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Tag className="w-5 h-5 text-primary" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm tracking-widest">
                      {p.code}
                    </span>
                    <PlanBadge plan={p.planCode} />
                    {!p.isActive && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        Inactivo
                      </span>
                    )}
                    {expired && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                        Vencido
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {p.trialDays} días trial
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {p.usedCount} / {p.maxUses === -1 ? "∞" : p.maxUses} usos
                      {pct !== null && (
                        <span className={`ml-1 font-semibold ${pct >= 90 ? "text-red-500" : pct >= 70 ? "text-amber-500" : "text-emerald-500"}`}>
                          ({pct}%)
                        </span>
                      )}
                    </span>
                    {p.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Vence {fmtDate(p.expiresAt)}
                      </span>
                    )}
                    {p.note && (
                      <span className="italic text-slate-400 truncate max-w-[200px]">{p.note}</span>
                    )}
                  </div>

                  {/* Usage bar */}
                  {pct !== null && (
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full transition-all ${
                          pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-400" : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(p)}
                    title={p.isActive ? "Desactivar" : "Activar"}
                    className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {p.isActive
                      ? <ToggleRight className="w-4 h-4 text-emerald-500" />
                      : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(p)}
                    title="Eliminar"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
