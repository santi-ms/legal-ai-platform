"use client";

import { useMemo } from "react";
import type { Document } from "@/app/lib/webApi";

type Doc = Document & Record<string, unknown>;

export function DocumentsTableSafe({ documents }: { documents: Doc[] }) {
  const rows: Doc[] = Array.isArray(documents) ? documents : [];
  const total = useMemo(() => rows.length, [rows]);

  if (rows.length === 0) {
    return (
      <div className="mt-6 rounded-md border border-zinc-800 p-6 text-zinc-400">
        No hay documentos.
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-x-auto rounded-md border border-zinc-800">
      <table className="min-w-full text-sm">
        <thead className="bg-zinc-900/40">
          <tr>
            <th className="px-3 py-2 text-left font-medium">ID</th>
            <th className="px-3 py-2 text-left font-medium">Título</th>
            <th className="px-3 py-2 text-left font-medium">Creado</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((doc) => (
            <tr key={doc.id} className="border-t border-zinc-800">
              <td className="px-3 py-2">{doc.id}</td>
              <td className="px-3 py-2">{(doc as any).title ?? "—"}</td>
              <td className="px-3 py-2">
                {(doc as any).createdAt ?? (doc as any).updatedAt ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-3 py-2 text-xs text-zinc-500">Total: {total}</div>
    </div>
  );
}

