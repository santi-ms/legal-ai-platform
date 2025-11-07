export const dynamic = "force-dynamic";
import React from "react";
import { generateJWT } from "@/app/api/_proxy/utils";

async function listDocumentsDirect(params: URLSearchParams) {
  const apiBase = process.env.API_URL!;
  const prefix = (process.env.BACKEND_PREFIX || "").replace(/^\/|\/$/g, "");
  const path = prefix ? `/${prefix}/documents` : `/documents`;
  const qs = params.toString();
  const url = `${apiBase}${path}${qs ? `?${qs}` : ""}`;

  const token = await generateJWT();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const snippet = (await res.text()).slice(0, 400);
    throw new Error(`Upstream no-JSON (${res.status}): ${snippet}`);
  }

  return res.json();
}

type DocumentsPageProps = {
  searchParams: Record<string, string>;
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = new URLSearchParams(searchParams);

  try {
    const data = await listDocumentsDirect(params);
    const rows = data?.data ?? [];
    const total = data?.total ?? rows.length;

    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Dashboard de Documentos</h1>
        <p className="text-sm opacity-70 mb-4">{total} documentos en total</p>
        <pre className="text-xs bg-black/10 rounded p-4 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  } catch (e: any) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="text-xl font-semibold">Error al cargar documentos</h2>
        <p className="mt-2 text-sm opacity-70">{String(e.message)}</p>
      </div>
    );
  }
}
