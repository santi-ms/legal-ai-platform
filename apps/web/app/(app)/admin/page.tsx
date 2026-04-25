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
  deleteSuperAdminUser,
  type SuperAdminOverview,
  type SuperAdminTenant,
  type SuperAdminUser,
} from "@/app/lib/webApi";
import {
  Loader2,
  ArrowLeft,
  RefreshCw,
  ShieldAlert,
  LayoutDashboard,
  Building2,
  Users,
  Sparkles,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionTabs, type SectionTab } from "@/components/ui/SectionTabs";

// Sub-components
import { AdminOverview }      from "./components/AdminOverview";
import { TenantsTable }       from "./components/TenantsTable";
import { UsersTable }         from "./components/UsersTable";
import { PromptsManager }     from "./components/PromptsManager";
import { PromoCodesManager }  from "./components/PromoCodesManager";
import { TenantDetailModal }  from "./components/TenantDetailModal";

// ---------------------------------------------------------------------------

type Tab = "overview" | "tenants" | "users" | "prompts" | "promos";

const ADMIN_TABS: SectionTab[] = [
  { key: "overview", label: "Overview",          icon: LayoutDashboard },
  { key: "tenants",  label: "Estudios",          icon: Building2       },
  { key: "users",    label: "Usuarios",          icon: Users           },
  { key: "prompts",  label: "Prompts IA",        icon: Sparkles        },
  { key: "promos",   label: "Códigos Promo",     icon: Ticket          },
];

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
  const [deletingUserId, setDeletingUserId]   = useState<string | null>(null);
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
      <div className="flex items-center justify-center min-h-[100dvh] bg-parchment dark:bg-ink">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-parchment dark:bg-ink">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center shadow-soft mx-auto">
            <ShieldAlert className="w-7 h-7 text-white" />
          </div>
          <div>
            <p className="text-2xl font-extrabold tracking-tight text-ink dark:text-white">Acceso denegado</p>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">Esta sección es de acceso restringido al equipo de administración.</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="w-4 h-4" />
            Volver al panel
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

  async function handleDeleteUser(u: SuperAdminUser) {
    const label =
      u.firstName || u.lastName
        ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
        : u.name || u.email;
    if (
      !window.confirm(
        `¿Eliminar la cuenta de ${label} (${u.email})? Esta acción es permanente y no se puede deshacer.`,
      )
    ) {
      return;
    }
    setDeletingUserId(u.id);
    try {
      await deleteSuperAdminUser(u.id);
      await loadUsers(usersPage, userSearch);
    } catch (e: any) {
      window.alert(e?.message || "No se pudo eliminar el usuario.");
    } finally {
      setDeletingUserId(null);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[100dvh] bg-parchment dark:bg-ink text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-10">
        <PageHeader
          icon={ShieldAlert}
          iconGradient="rose"
          eyebrow="Administración · Acceso restringido"
          title="Panel de administración"
          description="Visibilidad completa del sistema: tenants, usuarios, prompts y métricas globales."
          badge={session?.user?.email ? { label: session.user.email, tone: "default" } : undefined}
          actions={
            <>
              <Button variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="w-4 h-4" />
                Volver al panel
              </Button>
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </>
          }
        />

        {/* Nav tabs editoriales */}
        <div className="mb-8">
          <SectionTabs
            tabs={ADMIN_TABS}
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as Tab)}
          />
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
            deletingId={deletingUserId}
            onSearchChange={setUserSearch}
            onSearch={() => loadUsers(1, userSearch)}
            onPageChange={handleUsersPageChange}
            onSelectTenant={setSelectedTenantId}
            onDeleteUser={handleDeleteUser}
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
