"use client";

import { useState, useEffect } from "react";
import {
  getSuperAdminTenant,
  type SuperAdminTenantDetail,
} from "@/app/lib/webApi";
import {
  Building2,
  FileText,
  UserCheck,
  Brain,
  BarChart3,
  Loader2,
  X,
} from "lucide-react";
import { PlanBadge, fmt, fmtCost, fmtDate, fmtDateTime } from "./adminHelpers";

interface TenantDetailModalProps {
  tenantId: string;
  onClose: () => void;
}

export function TenantDetailModal({ tenantId, onClose }: TenantDetailModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-4xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col">
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
                  { label: "Usuarios",    value: detail._count.users },
                  { label: "Documentos",  value: detail._count.documents },
                  { label: "Clientes",    value: detail._count.clients },
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
                  users:    "Usuarios",
                  docs:     "Documentos",
                  clients:  "Clientes",
                  ai:       "Uso IA",
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
