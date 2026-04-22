"use client";

/**
 * Settings — Prompts IA
 *
 * Admin-only page to manage the DocumentPrompt library.
 * Each prompt is linked to a document type and customises the AI system message
 * and instructions used during generation.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { useAuth } from "@/app/lib/hooks/useAuth";
import {
  listPrompts,
  patchPrompt,
  upsertPrompt,
  deletePrompt,
  type DocumentPrompt,
} from "@/app/lib/webApi";
import {
  ArrowLeft,
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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditState {
  documentType: string;
  label: string;
  systemMessage: string;
  baseInstructions: string[];
  isActive: boolean;
}

const EMPTY_EDIT: EditState = {
  documentType: "",
  label: "",
  systemMessage: "",
  baseInstructions: [""],
  isActive: true,
};

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function PromptsSettingsPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [prompts, setPrompts] = useState<DocumentPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null); // documentType being edited
  const [editState, setEditState] = useState<EditState>(EMPTY_EDIT);
  const [saving, setSaving] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newState, setNewState] = useState<EditState>(EMPTY_EDIT);

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listPrompts();
      setPrompts(data);
    } catch (e: any) {
      showError(e.message ?? "Error cargando prompts");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) load();
  }, [isAuthenticated, authLoading, load]);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/settings/prompts");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const isAdmin = (user as any)?.role === "admin";

  function startEdit(p: DocumentPrompt) {
    setEditing(p.documentType);
    setEditState({
      documentType: p.documentType,
      label: p.label,
      systemMessage: p.systemMessage,
      baseInstructions: p.baseInstructions.length ? p.baseInstructions : [""],
      isActive: p.isActive,
    });
    setExpanded(p.documentType);
  }

  function cancelEdit() {
    setEditing(null);
    setEditState(EMPTY_EDIT);
  }

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
      setPrompts((prev) =>
        prev.map((p) => (p.documentType === editing ? updated : p))
      );
      setEditing(null);
      success("Prompt guardado");
    } catch (e: any) {
      showError(e.message ?? "Error guardando prompt");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(p: DocumentPrompt) {
    try {
      const updated = await patchPrompt(p.documentType, { isActive: !p.isActive });
      setPrompts((prev) =>
        prev.map((x) => (x.documentType === p.documentType ? updated : x))
      );
      success(updated.isActive ? "Prompt activado" : "Prompt desactivado");
    } catch (e: any) {
      showError(e.message ?? "Error");
    }
  }

  async function handleDelete(p: DocumentPrompt) {
    if (!confirm(`¿Eliminar el prompt para "${p.label}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deletePrompt(p.documentType);
      setPrompts((prev) => prev.filter((x) => x.documentType !== p.documentType));
      success("Prompt eliminado");
    } catch (e: any) {
      showError(e.message ?? "Error eliminando prompt");
    }
  }

  async function saveNew() {
    if (!newState.documentType.trim() || !newState.label.trim() || !newState.systemMessage.trim()) {
      showError("Tipo de documento, etiqueta y mensaje de sistema son obligatorios.");
      return;
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
          ? prev.map((p) => (p.documentType === created.documentType ? created : p))
          : [...prev, created];
      });
      setShowNewForm(false);
      setNewState(EMPTY_EDIT);
      success("Prompt creado");
    } catch (e: any) {
      showError(e.message ?? "Error creando prompt");
    } finally {
      setSaving(false);
    }
  }

  // ── Instruction list helpers ───────────────────────────────────────────────
  function updateInstruction(state: EditState, idx: number, val: string): EditState {
    const arr = [...state.baseInstructions];
    arr[idx] = val;
    return { ...state, baseInstructions: arr };
  }

  function addInstruction(state: EditState): EditState {
    return { ...state, baseInstructions: [...state.baseInstructions, ""] };
  }

  function removeInstruction(state: EditState, idx: number): EditState {
    const arr = state.baseInstructions.filter((_, i) => i !== idx);
    return { ...state, baseInstructions: arr.length ? arr : [""] };
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Subtítulo prompts + acción */}
      <div className="mt-6 flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center shadow-soft">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-400">
                    Inteligencia artificial
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-ink dark:text-white leading-tight">
                    Prompts personalizados
                  </h2>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                    Personalizá el sistema de IA para cada tipo de documento. Los prompts aquí definidos tienen prioridad sobre los valores por defecto del sistema.
                  </p>
                </div>
              </div>
              {isAdmin && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => { setShowNewForm(true); setExpanded(null); setEditing(null); }}
                  className="shrink-0 inline-flex items-center gap-2 bg-ink text-white hover:bg-slate-900 shadow-soft"
                >
                  <Plus className="h-4 w-4" />
                  Nuevo prompt
                </Button>
              )}
            </div>

            {/* New form */}
            {showNewForm && (
              <PromptForm
                title="Nuevo prompt"
                state={newState}
                onChange={setNewState}
                onSave={saveNew}
                onCancel={() => { setShowNewForm(false); setNewState(EMPTY_EDIT); }}
                saving={saving}
                updateInstruction={(idx, val) => setNewState((s) => updateInstruction(s, idx, val))}
                addInstruction={() => setNewState((s) => addInstruction(s))}
                removeInstruction={(idx) => setNewState((s) => removeInstruction(s, idx))}
                showDocumentTypeField
              />
            )}

            {/* List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : prompts.length === 0 ? (
              <div className="mx-4 mt-4 p-8 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No hay prompts configurados todavía. Hacé clic en <strong>Nuevo prompt</strong> para crear el primero.
                </p>
              </div>
            ) : (
              <div className="mx-4 mt-4 flex flex-col gap-3">
                {prompts.map((p) => (
                  <div
                    key={p.documentType}
                    className={`rounded-xl border bg-white dark:bg-slate-900 shadow-sm transition-all ${
                      p.isActive
                        ? "border-slate-200 dark:border-slate-800"
                        : "border-slate-100 dark:border-slate-800 opacity-60"
                    }`}
                  >
                    {/* Header row */}
                    <div className="flex items-center gap-3 px-5 py-4">
                      <button
                        type="button"
                        className="flex-1 flex items-center gap-3 text-left"
                        onClick={() =>
                          setExpanded((prev) => (prev === p.documentType ? null : p.documentType))
                        }
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 dark:text-white text-sm truncate">
                            {p.label}
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                            {p.documentType}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            p.isActive
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {p.isActive ? "Activo" : "Inactivo"}
                        </span>
                        {expanded === p.documentType ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                      </button>

                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            title={p.isActive ? "Desactivar" : "Activar"}
                            onClick={() => toggleActive(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            {p.isActive ? (
                              <ToggleRight className="w-4 h-4" />
                            ) : (
                              <ToggleLeft className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            title="Editar"
                            onClick={() => startEdit(p)}
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
                      )}
                    </div>

                    {/* Expanded detail / edit form */}
                    {expanded === p.documentType && (
                      <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4">
                        {editing === p.documentType ? (
                          <PromptForm
                            title="Editando prompt"
                            state={editState}
                            onChange={setEditState}
                            onSave={saveEdit}
                            onCancel={cancelEdit}
                            saving={saving}
                            updateInstruction={(idx, val) =>
                              setEditState((s) => updateInstruction(s, idx, val))
                            }
                            addInstruction={() => setEditState((s) => addInstruction(s))}
                            removeInstruction={(idx) =>
                              setEditState((s) => removeInstruction(s, idx))
                            }
                          />
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">
                                Mensaje de sistema
                              </p>
                              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-800 rounded-lg p-3 text-xs leading-relaxed">
                                {p.systemMessage}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                                Instrucciones base ({p.baseInstructions.length})
                              </p>
                              <ol className="list-decimal list-inside space-y-1.5">
                                {p.baseInstructions.map((inst, i) => (
                                  <li
                                    key={i}
                                    className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"
                                  >
                                    {inst}
                                  </li>
                                ))}
                              </ol>
                            </div>
                            <p className="text-xs text-slate-400">
                              Última actualización:{" "}
                              {new Date(p.updatedAt).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

      <div className="h-10" />
    </>
  );
}

// ---------------------------------------------------------------------------
// PromptForm component
// ---------------------------------------------------------------------------

interface PromptFormProps {
  title: string;
  state: EditState;
  onChange: (s: EditState) => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  updateInstruction: (idx: number, val: string) => void;
  addInstruction: () => void;
  removeInstruction: (idx: number) => void;
  showDocumentTypeField?: boolean;
}

function PromptForm({
  title,
  state,
  onChange,
  onSave,
  onCancel,
  saving,
  updateInstruction,
  addInstruction,
  removeInstruction,
  showDocumentTypeField = false,
}: PromptFormProps) {
  return (
    <div className="mx-4 mb-4 rounded-xl border border-primary/30 bg-white dark:bg-slate-900 p-5 shadow-sm space-y-4">
      <p className="font-semibold text-slate-900 dark:text-white text-sm">{title}</p>

      {showDocumentTypeField && (
        <div>
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
            Tipo de documento <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={state.documentType}
            onChange={(e) => onChange({ ...state, documentType: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
            placeholder="ej: comodato, poder_especial, convenio_honorarios"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="mt-1 text-xs text-slate-400">Identificador único, sin espacios (usar guiones bajos).</p>
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          Etiqueta (nombre legible) <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={state.label}
          onChange={(e) => onChange({ ...state, label: e.target.value })}
          placeholder="ej: Contrato de Locación"
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
          Mensaje de sistema (System Prompt) <span className="text-red-500">*</span>
        </label>
        <textarea
          value={state.systemMessage}
          onChange={(e) => onChange({ ...state, systemMessage: e.target.value })}
          rows={6}
          placeholder="Sos un abogado senior argentino especializado en..."
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
        />
        <p className="mt-1 text-xs text-slate-400">
          Define el rol, experiencia y especialidad del abogado IA para este tipo de documento.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Instrucciones base ({state.baseInstructions.length})
          </label>
          <button
            type="button"
            onClick={addInstruction}
            className="text-xs text-primary hover:underline inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Agregar
          </button>
        </div>
        <div className="space-y-2">
          {state.baseInstructions.map((inst, idx) => (
            <div key={idx} className="flex gap-2 items-start">
              <span className="text-xs text-slate-400 mt-2.5 w-5 text-right shrink-0">{idx + 1}.</span>
              <textarea
                value={inst}
                onChange={(e) => updateInstruction(idx, e.target.value)}
                rows={2}
                placeholder="Instrucción de salida para el documento..."
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              />
              {state.baseInstructions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeInstruction(idx)}
                  className="mt-2 p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Cada instrucción guía al modelo sobre cómo estructurar el documento final.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="isActive"
          type="checkbox"
          checked={state.isActive}
          onChange={(e) => onChange({ ...state, isActive: e.target.checked })}
          className="rounded border-slate-300 text-primary"
        />
        <label htmlFor="isActive" className="text-sm text-slate-700 dark:text-slate-300 select-none">
          Prompt activo (se usa en generación)
        </label>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          Guardar
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex items-center gap-2 border-slate-200 dark:border-slate-700"
        >
          <X className="w-3.5 h-3.5" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
