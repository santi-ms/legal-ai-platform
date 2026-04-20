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
  getSuperAdminUsers,
  type SuperAdminOverview,
  type SuperAdminTenant,
  type SuperAdminUser,
} from "@/app/lib/webApi";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Sub-components
import { AdminOverview }      from "./components/AdminOverview";
import { TenantsTable }       from "./components/TenantsTable";
import { UsersTable }         from "./components/UsersTable";
import { PromptsManager }     from "./components/PromptsManager";
import { PromoCodesManager }  from "./components/PromoCodesManager";
import { TenantDetailModal }  from "./components/TenantDetailModal";

// ---------------------------------------------------------------------------

type Tab = "overview" | "tenants" | "users" | "prompts" | "promos";

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  tenants:  "Estudios / Tenants",
  users:    "Usuarios",
  prompts:  "Prompts IA",
  promos:   "Códigos Promo",
};

// ---------------------------------------------------------------------------

export default function SuperAdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab]             = useState<Tab>("overview");
  const [overview, setOverview]               = useState<SuperAdminOverview | null>(null);
  const [tenants, setTenants]                 = useState<SuperAdminTenant[]>([]);
  const [tenantsTotal, setTenantsTotal]       = useState(0);
  const [tenantsPage, setTenantsPage]         = useState(1);
  const [tenantSearch, setTenantSearch]       = useState("");
  const [planFilter, setPlanFilter]           = useState("");
  const [users, setUsers]                     = useState<SuperAdminUser[]>([]);
  const [usersTotal, setUsersTotal]           = useState(0);
  const [usersPage, setUsersPage]             = useState(1);
  const [userSearch, setUserSearch]           = useState("");
  const [loading, setLoading]                 = useState(false);
  const [forbidden, setForbidden]             = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // ── Data loaders ───────────────────────────────────────────────────────────

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

  // ── Effects ────────────────────────────────────────────────────────────────

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
    if (activeTab === "users")   loadUsers(1, userSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ── Guards ─────────────────────────────────────────────────────────────────

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

  // ── Helpers for child callbacks ────────────────────────────────────────────

  function handleRefresh() {
    if (activeTab === "overview") loadOverview();
    if (activeTab === "tenants")  loadTenants(tenantsPage, tenantSearch, planFilter);
    if (activeTab === "users")    loadUsers(usersPage, userSearch);
    // prompts & promos manage their own refresh internally
  }

  function handlePlanFilterChange(val: string) {
    setPlanFilter(val);
    loadTenants(1, tenantSearch, val);
  }

  function handleTenantsPageChange(page: number) {
    setTenantsPage(page);
    loadTenants(page, tenantSearch, planFilter);
  }

  function handleUsersPageChange(page: number) {
    setUsersPage(page);
    loadUsers(page, userSearch);
  }

  // ── Render ─────────────────────────────────────────────────────────────────

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
          onClick={handleRefresh}
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
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <AdminOverview
            overview={overview}
            loading={loading}
            onSelectTenant={setSelectedTenantId}
          />
        )}

        {/* ── TENANTS ──────────────────────────────────────────────────────── */}
        {activeTab === "tenants" && (
          <TenantsTable
            tenants={tenants}
            tenantsTotal={tenantsTotal}
            tenantsPage={tenantsPage}
            tenantSearch={tenantSearch}
            planFilter={planFilter}
            loading={loading}
            onSearchChange={setTenantSearch}
            onPlanFilterChange={handlePlanFilterChange}
            onSearch={() => loadTenants(1, tenantSearch, planFilter)}
            onPageChange={handleTenantsPageChange}
            onSelectTenant={setSelectedTenantId}
          />
        )}

        {/* ── USERS ────────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <UsersTable
            users={users}
            usersTotal={usersTotal}
            usersPage={usersPage}
            userSearch={userSearch}
            loading={loading}
            onSearchChange={setUserSearch}
            onSearch={() => loadUsers(1, userSearch)}
            onPageChange={handleUsersPageChange}
            onSelectTenant={setSelectedTenantId}
          />
        )}

        {/* ── PROMPTS ──────────────────────────────────────────────────────── */}
        {activeTab === "prompts" && <PromptsManager />}

        {/* ── PROMO CODES ──────────────────────────────────────────────────── */}
        {activeTab === "promos" && <PromoCodesManager />}
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
