"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

/**
 * DataTable editorial — tabla minimalista con densidad confortable,
 * headers uppercase pequeños (estilo eyebrow) y filas con hover sutil.
 *
 * Uso:
 *   <DataTable
 *     columns={[
 *       { key: "name", header: "Cliente" },
 *       { key: "created", header: "Creado", align: "right" },
 *     ]}
 *     rows={data}
 *     rowKey={(r) => r.id}
 *     onRowClick={(r) => router.push(`/clients/${r.id}`)}
 *   />
 */

export interface DataTableColumn<T> {
  /** Key única (usada para React key y lookup genérico). */
  key: string;
  /** Header mostrado. */
  header: React.ReactNode;
  /** Render custom. Si no se provee, se lee row[key]. */
  render?: (row: T, index: number) => React.ReactNode;
  /** Alineación. */
  align?: "left" | "right" | "center";
  /** Ancho fijo o clase de tailwind (ej. "w-32", "w-[180px]"). */
  width?: string;
  /** Ocultar en mobile (md:table-cell). */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  /** Estado vacío. */
  empty?: React.ReactNode;
  /** Clase extra para el contenedor exterior. */
  className?: string;
  /** Densidad de filas. */
  density?: "comfortable" | "compact";
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  empty,
  className,
  density = "comfortable",
}: DataTableProps<T>) {
  const rowPadding = density === "compact" ? "py-2" : "py-3.5";

  return (
    <div
      className={cn(
        "w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-soft",
        className,
      )}
    >
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 dark:border-slate-800">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400",
                  col.align === "right" && "text-right",
                  col.align === "center" && "text-center",
                  col.align === undefined && "text-left",
                  col.hideOnMobile && "hidden md:table-cell",
                  col.width,
                )}
                style={col.width && !col.width.startsWith("w-") ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400"
              >
                {empty ?? "No hay resultados"}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={rowKey(row, i)}
                onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                className={cn(
                  "transition-colors",
                  onRowClick &&
                    "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50",
                )}
              >
                {columns.map((col) => {
                  const value = col.render
                    ? col.render(row, i)
                    : ((row as Record<string, unknown>)[col.key] as React.ReactNode);
                  return (
                    <td
                      key={col.key}
                      className={cn(
                        "px-5 text-slate-700 dark:text-slate-200",
                        rowPadding,
                        col.align === "right" && "text-right",
                        col.align === "center" && "text-center",
                        col.hideOnMobile && "hidden md:table-cell",
                      )}
                    >
                      {value as React.ReactNode}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
