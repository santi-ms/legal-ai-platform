"use client";

import { type SuperAdminTenant } from "@/app/lib/webApi";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanBadge, fmtCost, fmtDate } from "./adminHelpers";

interface TenantsTableProps {
  tenants: SuperAdminTenant[];
  tenantsTotal: number;
  tenantsPage: number;
  tenantSearch: string;
  planFilter: string;
  loading: boolean;
  onSearchChange: (val: string) => void;
  onPlanFilterChange: (val: string) => void;
  onSearch: () => void;
  onPageChange: (page: number) => void;
  onSelectTenant: (id: string) => void;
}

export function TenantsTable({
  tenants,
  tenantsTotal,
  tenantsPage,
  tenantSearch,
  planFilter,
  loading,
  onSearchChange,
  onPlanFilterChange,
  onSearch,
  onPageChange,
  onSelectTenant,
}: TenantsTableProps) {
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-3 items-center flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o CUIT..."
            value={tenantSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => onPlanFilterChange(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="">Todos los planes</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="proplus">Pro+</option>
          <option value="estudio">Estudio</option>
        </select>
        <Button size="sm" variant="outline" onClick={onSearch} className="gap-2">
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
                    <th
                      key={h}
                      className="text-left text-xs font-semibold text-slate-500 dark:text-slate-400 px-4 py-3 uppercase tracking-wide whitespace-nowrap"
                    >
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
                      onClick={() => onSelectTenant(t.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 dark:text-white">{t.name}</p>
                        {t.cuit && <p className="text-xs text-slate-400 font-mono">{t.cuit}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <PlanBadge plan={t.currentPlanCode} />
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">{t._count.users}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">{t._count.documents}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">{t._count.clients}</td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300 text-center">{t._count.contractAnalyses}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {t.aiCostUsd > 0 ? fmtCost(t.aiCostUsd) : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">{fmtDate(t.createdAt)}</td>
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
                  onClick={() => onPageChange(tenantsPage - 1)}
                  className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Anterior
                </button>
                <span className="px-3 py-1">Pág. {tenantsPage}</span>
                <button
                  type="button"
                  disabled={tenantsPage * 25 >= tenantsTotal}
                  onClick={() => onPageChange(tenantsPage + 1)}
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
  );
}
