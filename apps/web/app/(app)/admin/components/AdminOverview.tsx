"use client";

import { type SuperAdminOverview } from "@/app/lib/webApi";
import {
  Users,
  FileText,
  Building2,
  DollarSign,
  TrendingUp,
  ChevronRight,
  Loader2,
  BarChart3,
  Briefcase,
  UserCheck,
  Calendar,
} from "lucide-react";
import { PlanBadge, StatCard, fmt, fmtDate } from "./adminHelpers";

interface AdminOverviewProps {
  overview: SuperAdminOverview | null;
  loading: boolean;
  onSelectTenant: (id: string) => void;
}

export function AdminOverview({ overview, loading, onSelectTenant }: AdminOverviewProps) {
  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!overview) return null;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard icon={Building2}  label="Estudios / Tenants"  value={overview.totalTenants}                                  color="text-violet-600" />
        <StatCard icon={Users}       label="Usuarios totales"    value={overview.totalUsers}                                    color="text-blue-600" />
        <StatCard icon={FileText}    label="Documentos totales"  value={overview.totalDocuments}  sub={`${fmt(overview.docsThisMonth)} este mes`} color="text-emerald-600" />
        <StatCard icon={DollarSign}  label="Costo IA total"      value={overview.totalAiCostUsd.toFixed(2)} sub="USD"           color="text-amber-600" />
        <StatCard icon={UserCheck}   label="Clientes activos"    value={overview.totalClients}                                  color="text-sky-600" />
        <StatCard icon={Briefcase}   label="Expedientes"         value={overview.totalExpedientes}                              color="text-orange-600" />
        <StatCard icon={BarChart3}   label="Análisis IA"         value={overview.totalAnalyses}                                 color="text-pink-600" />
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
              onClick={() => onSelectTenant(t.id)}
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
  );
}
