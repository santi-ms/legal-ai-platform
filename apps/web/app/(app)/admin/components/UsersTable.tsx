"use client";

import { type SuperAdminUser } from "@/app/lib/webApi";
import { Search, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanBadge, fmtDate } from "./adminHelpers";

interface UsersTableProps {
  users: SuperAdminUser[];
  usersTotal: number;
  usersPage: number;
  userSearch: string;
  loading: boolean;
  deletingId: string | null;
  onSearchChange: (val: string) => void;
  onSearch: () => void;
  onPageChange: (page: number) => void;
  onSelectTenant: (id: string) => void;
  onDeleteUser: (user: SuperAdminUser) => void;
}

export function UsersTable({
  users,
  usersTotal,
  usersPage,
  userSearch,
  loading,
  deletingId,
  onSearchChange,
  onSearch,
  onPageChange,
  onSelectTenant,
  onDeleteUser,
}: UsersTableProps) {
  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={userSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onSearch()}
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <Button size="sm" variant="outline" onClick={onSearch} className="gap-2">
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
                  {["Usuario", "Email", "Rol", "Estudio", "Plan", "Verificado", "Creado", ""].map((h) => (
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
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-slate-400 py-12 text-sm">
                      No se encontraron usuarios
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr
                      key={u.id}
                      className={u.tenantId ? "hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors" : ""}
                      onClick={() => u.tenantId && onSelectTenant(u.tenantId)}
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
                          u.role === "owner"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                            : u.role === "admin"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
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
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          disabled={deletingId === u.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUser(u);
                          }}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Eliminar cuenta"
                          aria-label="Eliminar cuenta"
                        >
                          {deletingId === u.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
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
                  onClick={() => onPageChange(usersPage - 1)}
                  className="px-3 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Anterior
                </button>
                <span className="px-3 py-1">Pág. {usersPage}</span>
                <button
                  type="button"
                  disabled={usersPage * 50 >= usersTotal}
                  onClick={() => onPageChange(usersPage + 1)}
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
