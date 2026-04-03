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
import {
  getSuperAdminOverview,
  getSuperAdminTenants,
  getSuperAdminTenant,
  getSuperAdminUsers,
  type SuperAdminOverview,
  type SuperAdminTenant,
  type SuperAdminTenantDetail,
  type SuperAdminUser,
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

type Tab = "overview" | "tenants" | "users";

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
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-6">
          {(["overview", "tenants", "users"] as Tab[]).map((tab) => {
            const labels: Record<Tab, string> = {
              overview: "Overview",
              tenants: "Estudios / Tenants",
              users: "Usuarios",
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
