export const dynamic = "force-dynamic";

import React from "react";
import { listDocuments, DocumentsResponse } from "@/app/lib/webApi";

type DocumentsPageProps = {
  searchParams: Record<string, string | string[]>;
};

function normalizeSearchParams(searchParams: Record<string, string | string[]>): Record<string, string> {
  const entries = Object.entries(searchParams).flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return value.length > 0 ? [[key, value[0]]] : [];
    }
    return value ? [[key, value]] : [];
  });
  return Object.fromEntries(entries);
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  try {
    const filters = normalizeSearchParams(searchParams ?? {});
    const data = (await listDocuments(filters)) as DocumentsResponse;
    const rows = Array.isArray((data as any)?.items) ? (data as any).items : (data as any)?.data ?? [];
    const total = typeof data?.total === "number" ? data.total : Array.isArray(rows) ? rows.length : 0;

    return (
      <div className="p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard de Documentos</h1>
          <p className="text-sm opacity-70">{total} documentos en total</p>
        </div>
        <pre className="text-xs bg-black/10 rounded p-4 overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-2">
        <h2 className="text-xl font-semibold">Error al cargar documentos</h2>
        <p className="text-sm opacity-70 text-center max-w-lg">
          {error?.message || "Error desconocido"}
        </p>
      </div>
    );
  }
}
