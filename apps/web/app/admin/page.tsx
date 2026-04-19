"use client";

/**
 * Super-Admin Dashboard
 *
 * Acceso exclusivo para el email configurado en SUPER_ADMIN_EMAIL.
 * Muestra: overview del sistema, tabla de tenants, usuarios, y detalle por tenant.
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useToast } from "@/components/ui/toast";
import {
  getSuperAdminOverview,
  getSuperAdminTenants,
  getSuperAdminTenant,
  getSuperAdminUsers,
  listPrompts,
  patchPrompt,
  upsertPrompt,
  deletePrompt,
  listPromoCodes,
  createPromoCode,
  patchPromoCode,
  deletePromoCode,
  type SuperAdminOverview,
  type SuperAdminTenant,
  type SuperAdminTenantDetail,
  type SuperAdminUser,
  type DocumentPrompt,
  type PromoCode,
} from "@/app/lib/webApi";
import {
  Users,
  FileText,
  Building2,
  DollarSign,
  TrendingUp,
  Search,
  ChevronRight,
  ArrowLeft,
  Loader2,
  X,
  RefreshCw,
  ShieldAlert,
  BarChart3,
  Briefcase,
  UserCheck,
  Brain,
  Calendar,
  Plus,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
  Save,
  Tag,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PLAN_LABELS: Record<string, string> = {
  free:     "Free",
  pro:      "Pro",
  proplus:  "Pro+",
  estudio:  "Estudio",
};

const PLAN_COLORS: Record<string, string> = {
  free:    "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  pro:     "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  proplus: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  estudio: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PLAN_COLORS[plan] ?? PLAN_COLORS.free}`}>
      {PLAN_LABELS[plan] ?? plan}
    </span>
  );
}

function fmt(n: number) {
  return n.toLocaleString("es-AR");
}

function fmtCost(usd: number) {
  return `$${usd.toFixed(4)} USD`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: any;
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex items-start gap-3">
      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-800 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{fmt(Number(value))}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tenant detail modal
// ---------------------------------------------------------------------------

function TenantDetailModal({
  tenantId,
  onClose,
}: {
  tenantId: string;
  onClose: () => void;
}) {
  const [detail, setDetail] = useState<SuperAdminTenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"users" | "docs" | "clients" | "ai" | "analyses">("users");

  useEffect(() => {
    getSuperAdminTenant(tenantId)
      .then(setDetail)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [tenantId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-500">Cargando...</span>
            </div>
          ) : detail ? (
            <div className="flex items-center gap-3">
              <Building2 className="w-5 h-5 text-primary" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{detail.name}</p>
                {detail.cuit && (
                  <p className="text-xs text-slate-400 font-mono">CUIT: {detail.cuit}</p>
                )}
              </div>
              <PlanBadge plan={detail.currentPlanCode} />
            </div>
          ) : (
            <p className="text-sm text-red-500">Error cargando tenant</p>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {detail && !loading && (
          <>
            {/* Mini stats */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
              <div className="grid grid-cols-5 gap-3 text-center">
                {[
                  { label: "Usuarios", value: detail._count.users },
                  { label: "Documentos", value: detail._count.documents },
                  { label: "Clientes", value: detail._count.clients },
                  { label: "Expedientes", value: detail._count.expedientes },
                  { label: "Análisis IA", value: detail._count.contractAnalyses },
                ].map((s) => (
                  <div key={s.label} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-2">
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{s.value}</p>
                    <p className="text-xs text-slate-400">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 gap-6 shrink-0 overflow-x-auto">
              {(["users", "docs", "clients", "ai", "analyses"] as const).map((tab) => {
                const labels: Record<string, string> = {
                  users: "Usuarios",
                  docs: "Documentos",
                  clients: "Clientes",
                  ai: "Uso IA",
                  analyses: "Análisis",
                };
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`py-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab
                        ? "border-primary text-primary"
                        : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    {labels[tab]}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {/* Users */}
              {activeTab === "users" && (
                <div className="space-y-2">
                  {detail.users.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Sin usuarios</p>
                  ) : (
                    detail.users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                            {u.firstName || u.lastName
                              ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                              : u.name || u.email}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{u.email}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            u.role === "owner" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : u.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                          }`}>
                            {u.role}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">{fmtDate(u.createdAt)}</p>
                        </div>
                        {!u.emailVerified && (
                          <span className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded shrink-0">
                            no verificado
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Docs */}
              {activeTab === "docs" && (
                <div>
                  {/* Doc types breakdown */}
                  {detail.docsByType.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Por tipo</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.docsByType.map((d) => (
                          <span key={d.type} className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-lg">
                            {d.type} <strong>({d.count})</strong>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Últimos 20</p>
                  <div className="space-y-2">
                    {detail.recentDocuments.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-8">Sin documentos</p>
                    ) : (
                      detail.recentDocuments.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                        >
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">{d.type}</p>
                            <p className="text-xs text-slate-400">
                              {d.jurisdiccion} · {d.createdBy?.email ?? "—"}
                              {d.client && ` · ${d.client.name}`}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                              d.estado === "ready_pdf"
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                : d.estado === "error"
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            }`}>
                              {d.estado}
                            </span>
                            <p className="text-xs text-slate-400 mt-1">{fmtDate(d.createdAt)}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Clients */}
              {activeTab === "clients" && (
                <div className="space-y-2">
                  {detail.recentClients.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Sin clientes</p>
                  ) : (
                    detail.recentClients.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                      >
                        <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{c.name}</p>
                          <p className="text-xs text-slate-400">
                            {c.type === "persona_fisica" ? "Persona física" : "Persona jurídica"}
                            {c.documentNumber && ` · ${c.documentNumber}`}
                            {c.email && ` · ${c.email}`}
                          </p>
                        </div>
                        <p className="text-xs text-slate-400 shrink-0">{fmtDate(c.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* AI Usage */}
              {activeTab === "ai" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-400">Costo total IA</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {fmtCost(detail.aiUsage.total.costUsd)}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-400">Llamadas totales</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {fmt(detail.aiUsage.total.calls)}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-400">Tokens prompt</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {fmt(detail.aiUsage.total.promptTokens)}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-400">Tokens completion</p>
                      <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {fmt(detail.aiUsage.total.completionTokens)}
                      </p>
                    </div>
                  </div>

                  {detail.aiUsage.byService.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Por servicio</p>
                      <div className="space-y-2">
                        {detail.aiUsage.byService.map((s) => (
                          <div key={s.service} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                            <Brain className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{s.service}</p>
                              <p className="text-xs text-slate-400">{fmt(s.calls)} llamadas · {fmt(s.promptTokens + s.completionTokens)} tokens</p>
                            </div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 shrink-0">
                              {fmtCost(s.costUsd)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Analyses */}
              {activeTab === "analyses" && (
                <div className="space-y-2">
                  {detail.analyses.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-8">Sin análisis de contratos</p>
                  ) : (
                    detail.analyses.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800"
                      >
                        <BarChart3 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{a.originalName}</p>
                          <p className="text-xs text-slate-400">{(a.fileSize / 1024).toFixed(1)} KB</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            a.status === "done" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : a.status === "error" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          }`}>
                            {a.status}
                          </span>
                          <p className="text-xs text-slate-400 mt-1">{fmtDate(a.createdAt)}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0 flex items-center justify-between text-xs text-slate-400">
              <span>Creado: {fmtDateTime(detail.createdAt)}</span>
              {detail.subscription && (
                <span>
                  Suscripción: <strong className="text-slate-600 dark:text-slate-300">{detail.subscription.status}</strong>
                  {detail.subscription.renewsAt && ` · Renueva ${fmtDate(detail.subscription.renewsAt)}`}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Tab = "overview" | "tenants" | "users" | "prompts" | "promos";

// ---------------------------------------------------------------------------
// Prompt management (inline in super-admin)
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

function PromptsTab() {
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

  function updInstr(s: PromptEditState, idx: number, val: string) {
    const a = [...s.baseInstructions]; a[idx] = val; return { ...s, baseInstructions: a };
  }
  function addInstr(s: PromptEditState) { return { ...s, baseInstructions: [...s.baseInstructions, ""] }; }
  function delInstr(s: PromptEditState, idx: number) {
    const a = s.baseInstructions.filter((_, i) => i !== idx);
    return { ...s, baseInstructions: a.length ? a : [""] };
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      const updated = await patchPrompt(editing, {
        label: editState.label,
        systemMessage: editState.systemMessage,
        baseInstructions: editState.baseInstructions.filter(i => i.trim()),
        isActive: editState.isActive,
      });
      setPrompts(prev => prev.map(p => p.documentType === editing ? updated : p));
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
        baseInstructions: newState.baseInstructions.filter(i => i.trim()),
        isActive: newState.isActive,
      });
      setPrompts(prev => {
        const exists = prev.find(p => p.documentType === created.documentType);
        return exists ? prev.map(p => p.documentType === created.documentType ? created : p) : [...prev, created];
      });
      setShowNewForm(false); setNewState(EMPTY_PROMPT);
      success("Prompt creado");
    } catch (e: any) { showError(e.message ?? "Error"); }
    finally { setSaving(false); }
  }

  async function toggleActive(p: DocumentPrompt) {
    try {
      const updated = await patchPrompt(p.documentType, { isActive: !p.isActive });
      setPrompts(prev => prev.map(x => x.documentType === p.documentType ? updated : x));
      success(updated.isActive ? "Activado" : "Desactivado");
    } catch (e: any) { showError(e.message ?? "Error"); }
  }

  async function handleDelete(p: DocumentPrompt) {
    if (!confirm(`¿Eliminar el prompt para "${p.label}"?`)) return;
    try {
      await deletePrompt(p.documentType);
      setPrompts(prev => prev.filter(x => x.documentType !== p.documentType));
      success("Eliminado");
    } catch (e: any) { showError(e.message ?? "Error"); }
  }

  // Mini form component
  function PromptForm({ state, onChange, onSave, onCancel, showTypeField = false }: {
    state: PromptEditState;
    onChange: (s: PromptEditState) => void;
    onSave: () => void;
    onCancel: () => void;
    showTypeField?: boolean;
  }) {
    return (
      <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
        {showTypeField && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de documento <span className="text-red-500">*</span></label>
            <input type="text" value={state.documentType}
              onChange={e => onChange({ ...state, documentType: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
              placeholder="ej: comodato, poder_especial"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <p className="mt-0.5 text-xs text-slate-400">Sin espacios, usá guiones bajos.</p>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Etiqueta <span className="text-red-500">*</span></label>
          <input type="text" value={state.label}
            onChange={e => onChange({ ...state, label: e.target.value })}
            placeholder="ej: Contrato de Locación"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1">Mensaje de sistema (rol del abogado IA) <span className="text-red-500">*</span></label>
          <textarea value={state.systemMessage} rows={5}
            onChange={e => onChange({ ...state, systemMessage: e.target.value })}
            placeholder="Sos un abogado senior argentino especializado en..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-slate-500">Instrucciones de salida</label>
            <button type="button" onClick={() => onChange(addInstr(state))}
              className="text-xs text-primary hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" /> Agregar
            </button>
          </div>
          <div className="space-y-2">
            {state.baseInstructions.map((inst, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <span className="text-xs text-slate-400 mt-2.5 w-5 shrink-0 text-right">{idx + 1}.</span>
                <textarea value={inst} rows={2}
                  onChange={e => onChange(updInstr(state, idx, e.target.value))}
                  placeholder="Instrucción para el modelo..."
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y" />
                {state.baseInstructions.length > 1 && (
                  <button type="button" onClick={() => onChange(delInstr(state, idx))}
                    className="mt-2 p-1 text-slate-400 hover:text-red-500 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input id="active-chk" type="checkbox" checked={state.isActive}
            onChange={e => onChange({ ...state, isActive: e.target.checked })}
            className="rounded border-slate-300 text-primary" />
          <label htmlFor="active-chk" className="text-sm text-slate-600 dark:text-slate-300 select-none">
            Prompt activo
          </label>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={onSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Guardar
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel} disabled={saving} className="gap-2 border-slate-200 dark:border-slate-700">
            <X className="w-3.5 h-3.5" /> Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Los prompts aquí configurados son los que usa la IA al generar cada tipo de documento.
            Tienen prioridad sobre los valores por defecto del sistema.
          </p>
        </div>
        <Button size="sm" onClick={() => { setShowNewForm(true); setEditing(null); }} className="gap-2 shrink-0 ml-4">
          <Plus className="w-3.5 h-3.5" /> Nuevo prompt
        </Button>
      </div>

      {showNewForm && (
        <PromptForm
          state={newState}
          onChange={setNewState}
          onSave={saveNew}
          onCancel={() => { setShowNewForm(false); setNewState(EMPTY_PROMPT); }}
          showTypeField
        />
      )}

      {prompts.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          No hay prompts configurados todavía.
        </div>
      ) : (
        <div className="space-y-2">
          {prompts.map(p => (
            <div key={p.documentType}
              className={`rounded-xl border bg-white dark:bg-slate-900 shadow-sm ${p.isActive ? "border-slate-200 dark:border-slate-800" : "border-slate-100 dark:border-slate-800 opacity-60"}`}>
              {/* Row */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button type="button" className="flex-1 flex items-center gap-3 text-left min-w-0"
                  onClick={() => setExpanded(prev => prev === p.documentType ? null : p.documentType)}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{p.label}</p>
                    <p className="text-xs font-mono text-slate-400">{p.documentType}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${p.isActive ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {p.isActive ? "Activo" : "Inactivo"}
                  </span>
                  {expanded === p.documentType ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" title={p.isActive ? "Desactivar" : "Activar"} onClick={() => toggleActive(p)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    {p.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  </button>
                  <button type="button" title="Editar" onClick={() => {
                    setEditing(p.documentType);
                    setEditState({ documentType: p.documentType, label: p.label, systemMessage: p.systemMessage, baseInstructions: p.baseInstructions.length ? p.baseInstructions : [""], isActive: p.isActive });
                    setExpanded(p.documentType);
                  }} className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button type="button" title="Eliminar" onClick={() => handleDelete(p)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
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
                    />
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Mensaje de sistema</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-3 whitespace-pre-wrap leading-relaxed">{p.systemMessage}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">Instrucciones base ({p.baseInstructions.length})</p>
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

// ---------------------------------------------------------------------------
// PromoCodesTab
// ---------------------------------------------------------------------------

const EMPTY_PROMO = {
  code: "", planCode: "pro" as const, trialDays: 14, maxUses: -1, expiresAt: "", note: "",
};

function PromoCodesTab() {
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

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
    </div>
  );

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
                Máximo de usos <span className="text-slate-400 font-normal">(-1 = ilimitado)</span>
              </label>
              <input
                type="number"
                min={-1}
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || -1 })}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
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
            <Button size="sm" variant="outline" onClick={() => { setShowForm(false); setForm(EMPTY_PROMO); }} disabled={saving} className="gap-2 border-slate-200 dark:border-slate-700">
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

// ---------------------------------------------------------------------------

export default function SuperAdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<SuperAdminOverview | null>(null);
  const [tenants, setTenants] = useState<SuperAdminTenant[]>([]);
  const [tenantsTotal, setTenantsTotal] = useState(0);
  const [tenantsPage, setTenantsPage] = useState(1);
  const [tenantSearch, setTenantSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [users, setUsers] = useState<SuperAdminUser[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // ── Load overview ─────────────────────────────────────────────────────────
  const loadOverview = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSuperAdminOverview();
      setOverview(data);
    } catch (e: any) {
      if (e.message?.includes("FORBIDDEN") || e.message?.includes("403")) setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load tenants ──────────────────────────────────────────────────────────
  const loadTenants = useCallback(async (page = 1, search = "", plan = "") => {
    setLoading(true);
    try {
      const res = await getSuperAdminTenants({
        page,
        pageSize: 25,
        ...(search ? { search } : {}),
        ...(plan ? { plan } : {}),
      });
      setTenants(res.tenants);
      setTenantsTotal(res.total);
      setTenantsPage(res.page);
    } catch (e: any) {
      if (e.message?.includes("FORBIDDEN") || e.message?.includes("403")) setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load users ────────────────────────────────────────────────────────────
  const loadUsers = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      const res = await getSuperAdminUsers({ page, pageSize: 50, ...(search ? { search } : {}) });
      setUsers(res.users);
      setUsersTotal(res.total);
      setUsersPage(res.page);
    } catch (e: any) {
      if (e.message?.includes("FORBIDDEN") || e.message?.includes("403")) setForbidden(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/login?callbackUrl=/admin");
      return;
    }
    if (sessionStatus === "authenticated") {
      loadOverview();
    }
  }, [sessionStatus, router, loadOverview]);

  useEffect(() => {
    if (activeTab === "tenants") loadTenants(1, tenantSearch, planFilter);
    if (activeTab === "users") loadUsers(1, userSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (sessionStatus === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <p className="text-xl font-bold text-slate-900 dark:text-white">Acceso denegado</p>
          <p className="text-sm text-slate-500">Esta sección es de acceso restringido.</p>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
            Volver al inicio
          </Button>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-500" />
          <span className="font-bold text-sm text-slate-900 dark:text-white">Super Admin</span>
          <span className="text-xs text-slate-400">· {session?.user?.email}</span>
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => {
            if (activeTab === "overview") loadOverview();
            if (activeTab === "tenants") loadTenants(tenantsPage, tenantSearch, planFilter);
            if (activeTab === "users") loadUsers(usersPage, userSearch);
            // promos se auto-refresca con su propio estado interno
          }}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Actualizar"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Page title */}
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">Panel de Administración</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Visibilidad completa del sistema · Acceso restringido
          </p>
        </div>

        {/* Nav tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-6 overflow-x-auto">
          {(["overview", "tenants", "users", "prompts", "promos"] as Tab[]).map((tab) => {
            const labels: Record<Tab, string> = {
              overview: "Overview",
              tenants: "Estudios / Tenants",
              users: "Usuarios",
              prompts: "Prompts IA",
              promos: "Códigos Promo",
            };
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <>
            {loading && !overview ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : overview ? (
              <div className="space-y-6">
                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard icon={Building2}   label="Estudios / Tenants"  value={overview.totalTenants}    color="text-violet-600" />
                  <StatCard icon={Users}        label="Usuarios totales"    value={overview.totalUsers}      color="text-blue-600" />
                  <StatCard icon={FileText}     label="Documentos totales"  value={overview.totalDocuments}  sub={`${fmt(overview.docsThisMonth)} este mes`} color="text-emerald-600" />
                  <StatCard icon={DollarSign}   label="Costo IA total"      value={overview.totalAiCostUsd.toFixed(2)} sub="USD" color="text-amber-600" />
                  <StatCard icon={UserCheck}    label="Clientes activos"    value={overview.totalClients}    color="text-sky-600" />
                  <StatCard icon={Briefcase}    label="Expedientes"         value={overview.totalExpedientes} color="text-orange-600" />
                  <StatCard icon={BarChart3}    label="Análisis IA"         value={overview.totalAnalyses}   color="text-pink-600" />
                </div>

                {/* Plan breakdown */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    Distribución de planes
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {overview.planBreakdown.map((p) => (
                      <div
                        key={p.plan}
                        className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 py-3"
                      >
                        <PlanBadge plan={p.plan} />
                        <span className="text-2xl font-bold text-slate-900 dark:text-white">{p.count}</span>
                        <span className="text-xs text-slate-400">
                          {overview.totalTenants > 0
                            ? `${((p.count / overview.totalTenants) * 100).toFixed(0)}%`
                            : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent tenants */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    Últimas cuentas creadas
                  </h3>
                  <div className="space-y-2">
                    {overview.recentTenants.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTenantId(t.id)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                      >
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{t.name}</p>
                        </div>
                        <PlanBadge plan={t.currentPlanCode} />
                        <div className="text-right shrink-0 text-xs text-slate-400">
                          <p>{t._count.users} usuarios · {t._count.documents} docs</p>
                          <p>{fmtDate(t.createdAt)}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* ── TENANTS ──────────────────────────────────────────────────────── */}
        {activeTab === "tenants" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="flex gap-3 items-center flex-wrap">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o CUIT..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadTenants(1, tenantSearch, planFilter)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <select
                value={planFilter}
                onChange={(e) => { setPlanFilter(e.target.value); loadTenants(1, tenantSearch, e.target.value); }}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">Todos los planes</option>
                <option value="free">Free</option>
                <option value="pro">Pro</option>
                <option value="proplus">Pro+</option>
                <option value="estudio">Estudio</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => loadTenants(1, tenantSearch, planFilter)}
                className="gap-2"
              >
                <Search className="w-3.5 h-3.5" />
                Buscar
              </Button>
            </div>

            {/* Table */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        {["Estudio", "Plan", "Usuarios", "Docs", "Clientes", "Análisis", "Costo IA", "Creado", ""].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {tenants.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center text-slate-400 py-12 text-sm">
                            No se encontraron estudios
                          </td>
                        </tr>
                      ) : (
                        tenants.map((t) => (
                          <tr
                            key={t.id}
                            onClick={() => setSelectedTenantId(t.id)}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900 dark:text-white">{t.name}</p>
                              {t.cuit && <p className="text-xs text-slate-400 font-mono">{t.cuit}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <PlanBadge plan={t.currentPlanCode} />
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">
                              {t._count.users}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">
                              {t._count.documents}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">
                              {t._count.clients}
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">
                              {t._count.contractAnalyses}
                            </td>
                            <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                              {t.aiCostUsd > 0 ? fmtCost(t.aiCostUsd) : "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                              {fmtDate(t.createdAt)}
                            </td>
                            <td className="px-4 py-3">
                              <ChevronRight className="w-4 h-4 text-slate-300" />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {tenantsTotal > 25 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <span>{tenantsTotal} estudios en total</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={tenantsPage <= 1}
                        onClick={() => { const p = tenantsPage - 1; setTenantsPage(p); loadTenants(p, tenantSearch, planFilter); }}
                        className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Anterior
                      </button>
                      <span className="px-3 py-1">Pág. {tenantsPage}</span>
                      <button
                        type="button"
                        disabled={tenantsPage * 25 >= tenantsTotal}
                        onClick={() => { const p = tenantsPage + 1; setTenantsPage(p); loadTenants(p, tenantSearch, planFilter); }}
                        className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── USERS ────────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div className="space-y-4">
            {/* Search */}
            <div className="flex gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadUsers(1, userSearch)}
                  className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <Button size="sm" variant="outline" onClick={() => loadUsers(1, userSearch)} className="gap-2">
                <Search className="w-3.5 h-3.5" />
                Buscar
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800">
                      <tr>
                        {["Usuario", "Email", "Rol", "Estudio", "Plan", "Verificado", "Creado"].map((h) => (
                          <th key={h} className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 uppercase tracking-wide whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center text-slate-400 py-12 text-sm">
                            No se encontraron usuarios
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr
                            key={u.id}
                            className={u.tenantId ? "hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors" : ""}
                            onClick={() => u.tenantId && setSelectedTenantId(u.tenantId)}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                                  {(u.firstName?.[0] || u.email[0]).toUpperCase()}
                                </div>
                                <p className="font-medium text-slate-900 dark:text-white">
                                  {u.firstName || u.lastName
                                    ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                                    : u.name || "—"}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{u.email}</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                u.role === "owner" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                                : u.role === "admin" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-xs">
                              {u.tenant?.name ?? <span className="text-slate-400">sin estudio</span>}
                            </td>
                            <td className="px-4 py-3">
                              {u.tenant ? <PlanBadge plan={u.tenant.currentPlanCode} /> : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {u.emailVerified ? (
                                <span className="text-emerald-500 text-xs">✓</span>
                              ) : (
                                <span className="text-amber-500 text-xs">Pendiente</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                              {fmtDate(u.createdAt)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {usersTotal > 50 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
                    <span>{usersTotal} usuarios en total</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={usersPage <= 1}
                        onClick={() => { const p = usersPage - 1; setUsersPage(p); loadUsers(p, userSearch); }}
                        className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Anterior
                      </button>
                      <span className="px-3 py-1">Pág. {usersPage}</span>
                      <button
                        type="button"
                        disabled={usersPage * 50 >= usersTotal}
                        onClick={() => { const p = usersPage + 1; setUsersPage(p); loadUsers(p, userSearch); }}
                        className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {/* ── PROMPTS ──────────────────────────────────────────────────────── */}
        {activeTab === "prompts" && <PromptsTab />}

        {/* ── PROMO CODES ──────────────────────────────────────────────────── */}
        {activeTab === "promos" && <PromoCodesTab />}

      </div>

      {/* Tenant detail modal */}
      {selectedTenantId && (
        <TenantDetailModal
          tenantId={selectedTenantId}
          onClose={() => setSelectedTenantId(null)}
        />
      )}
    </div>
  );
}
