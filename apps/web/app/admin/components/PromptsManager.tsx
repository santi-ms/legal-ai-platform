"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/toast";
import {
  listPrompts,
  patchPrompt,
  upsertPrompt,
  deletePrompt,
  type DocumentPrompt,
} from "@/app/lib/webApi";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PromptEditState {
  documentType: string;
  label: string;
  systemMessage: string;
  baseInstructions: string[];
  isActive: boolean;
}

const EMPTY_PROMPT: PromptEditState = {
  documentType: "", label: "", systemMessage: "", baseInstructions: [""], isActive: true,
};

// ---------------------------------------------------------------------------
// Inner form component
// ---------------------------------------------------------------------------

function PromptForm({
  state,
  onChange,
  onSave,
  onCancel,
  saving,
  showTypeField = false,
}: {
  state: PromptEditState;
  onChange: (s: PromptEditState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  showTypeField?: boolean;
}) {
  function updInstr(idx: number, val: string) {
    const a = [...state.baseInstructions]; a[idx] = val;
    onChange({ ...state, baseInstructions: a });
  }
  function addInstr() {
    onChange({ ...state, baseInstructions: [...state.baseInstructions, ""] });
  }
  function delInstr(idx: number) {
    const a = state.baseInstructions.filter((_, i) => i !== idx);
    onChange({ ...state, baseInstructions: a.length ? a : [""] });
  }

  return (
    <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
      {showTypeField && (
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">
            Tipo de documento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={state.documentType}
            onChange={(e) => onChange({ ...state, documentType: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
            placeholder="ej: comodato, poder_especial"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="mt-0.5 text-xs text-slate-400">Sin espacios, usá guiones bajos.</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Etiqueta <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={state.label}
          onChange={(e) => onChange({ ...state, label: e.target.value })}
          placeholder="ej: Contrato de Locación"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Mensaje de sistema (rol del abogado IA) <span className="text-red-500">*</span>
        </label>
        <textarea
          value={state.systemMessage}
          rows={5}
          onChange={(e) => onChange({ ...state, systemMessage: e.target.value })}
          placeholder="Sos un abogado senior argentino especializado en..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-500">Instrucciones de salida</label>
          <button
            type="button"
            onClick={addInstr}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Agregar
          </button>
        </div>
        <div className="space-y-2">
          {state.baseInstructions.map((inst, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-xs text-slate-400 mt-2.5 w-5 shrink-0 text-right">{idx + 1}.</span>
              <textarea
                value={inst}
                rows={2}
                onChange={(e) => updInstr(idx, e.target.value)}
                placeholder="Instrucción para el modelo..."
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              />
              {state.baseInstructions.length > 1 && (
                <button
                  type="button"
                  onClick={() => delInstr(idx)}
                  className="mt-2 p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="active-chk"
          type="checkbox"
          checked={state.isActive}
          onChange={(e) => onChange({ ...state, isActive: e.target.checked })}
          className="rounded border-slate-300 text-primary"
        />
        <label htmlFor="active-chk" className="text-sm text-slate-600 dark:text-slate-300 select-none">
          Prompt activo
        </label>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Guardar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
          disabled={saving}
          className="gap-2 border-slate-200 dark:border-slate-700"
        >
          <X className="w-3.5 h-3.5" /> Cancelar
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PromptsManager() {
  const { success, error: showError } = useToast();
  const [prompts, setPrompts] = useState<DocumentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editState, setEditState] = useState<PromptEditState>(EMPTY_PROMPT);
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newState, setNewState] = useState<PromptEditState>(EMPTY_PROMPT);

  const load = useCallback(async () => {
    setLoading(true);
    try { setPrompts(await listPrompts()); }
    catch (e: any) { showError(e.message ?? "Error cargando prompts"); }
    finally { setLoading(false); }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await patchPrompt(editing, {
        label: editState.label,
        systemMessage: editState.systemMessage,
        baseInstructions: editState.baseInstructions.filter((i) => i.trim()),
        isActive: editState.isActive,
      });
      setPrompts((prev) => prev.map((p) => p.documentType === editing ? updated : p));
      setEditing(null);
      success("Prompt guardado");
    } catch (e: any) { showError(e.message ?? "Error"); }
    finally { setSaving(false); }
  }

  async function saveNew() {
    if (!newState.documentType.trim() || !newState.label.trim() || !newState.systemMessage.trim()) {
      showError("Tipo, etiqueta y mensaje de sistema son obligatorios."); return;
    }
    setSaving(true);
    try {
      const created = await upsertPrompt(newState.documentType.trim(), {
        label: newState.label,
        systemMessage: newState.systemMessage,
        baseInstructions: newState.baseInstructions.filter((i) => i.trim()),
        isActive: newState.isActive,
      });
      setPrompts((prev) => {
        const exists = prev.find((p) => p.documentType === created.documentType);
        return exists
          ? prev.map((p) => p.documentType === created.documentType ? created : p)
          : [...prev, created];
      });
      setShowNewForm(false);
      setNewState(EMPTY_PROMPT);
      success("Prompt creado");
    } catch (e: any) { showError(e.message ?? "Error"); }
    finally { setSaving(false); }
  }

  async function toggleActive(p: DocumentPrompt) {
    try {
      const updated = await patchPrompt(p.documentType, { isActive: !p.isActive });
      setPrompts((prev) => prev.map((x) => x.documentType === p.documentType ? updated : x));
      success(updated.isActive ? "Activado" : "Desactivado");
    } catch (e: any) { showError(e.message ?? "Error"); }
  }

  async function handleDelete(p: DocumentPrompt) {
    if (!confirm(`¿Eliminar el prompt para "${p.label}"?`)) return;
    try {
      await deletePrompt(p.documentType);
      setPrompts((prev) => prev.filter((x) => x.documentType !== p.documentType));
      success("Eliminado");
    } catch (e: any) { showError(e.message ?? "Error"); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Los prompts aquí configurados son los que usa la IA al generar cada tipo de documento.
          Tienen prioridad sobre los valores por defecto del sistema.
        </p>
        <Button
          size="sm"
          onClick={() => { setShowNewForm(true); setEditing(null); }}
          className="gap-2 shrink-0 ml-4"
        >
          <Plus className="w-3.5 h-3.5" /> Nuevo prompt
        </Button>
      </div>

      {showNewForm && (
        <PromptForm
          state={newState}
          onChange={setNewState}
          onSave={saveNew}
          onCancel={() => { setShowNewForm(false); setNewState(EMPTY_PROMPT); }}
          saving={saving}
          showTypeField
        />
      )}

      {prompts.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          No hay prompts configurados todavía.
        </div>
      ) : (
        <div className="space-y-2">
          {prompts.map((p) => (
            <div
              key={p.documentType}
              className={`rounded-xl border bg-white dark:bg-slate-900 shadow-sm ${
                p.isActive
                  ? "border-slate-200 dark:border-slate-800"
                  : "border-slate-100 dark:border-slate-800 opacity-60"
              }`}
            >
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button
                  type="button"
                  className="flex-1 flex items-center gap-3 text-left min-w-0"
                  onClick={() => setExpanded((prev) => prev === p.documentType ? null : p.documentType)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{p.label}</p>
                    <p className="text-xs font-mono text-slate-400">{p.documentType}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                    p.isActive
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {p.isActive ? "Activo" : "Inactivo"}
                  </span>
                  {expanded === p.documentType
                    ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    title={p.isActive ? "Desactivar" : "Activar"}
                    onClick={() => toggleActive(p)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    {p.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    title="Editar"
                    onClick={() => {
                      setEditing(p.documentType);
                      setEditState({
                        documentType: p.documentType,
                        label: p.label,
                        systemMessage: p.systemMessage,
                        baseInstructions: p.baseInstructions.length ? p.baseInstructions : [""],
                        isActive: p.isActive,
                      });
                      setExpanded(p.documentType);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    title="Eliminar"
                    onClick={() => handleDelete(p)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Expanded */}
              {expanded === p.documentType && (
                <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4">
                  {editing === p.documentType ? (
                    <PromptForm
                      state={editState}
                      onChange={setEditState}
                      onSave={saveEdit}
                      onCancel={() => setEditing(null)}
                      saving={saving}
                    />
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Mensaje de sistema</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">
                          {p.systemMessage}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                          Instrucciones base ({p.baseInstructions.length})
                        </p>
                        <ol className="list-decimal list-inside space-y-1.5">
                          {p.baseInstructions.map((inst, i) => (
                            <li key={i} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{inst}</li>
                          ))}
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
