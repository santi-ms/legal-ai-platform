export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';

type DocumentsPageProps = {
  searchParams: Record<string, string>;
};

type DocumentsResponse = {
  ok?: boolean;
  data?: unknown;
  message?: string;
  error?: string;
  total?: number;
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const params = new URLSearchParams(searchParams);
  const qs = params.toString();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  const url = `${basePath}/api/_proxy/documents${qs ? `?${qs}` : ''}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as DocumentsResponse;
  const rows: unknown[] = Array.isArray((data as any).data) ? ((data as any).data as unknown[]) : [];
  const total = typeof data.total === 'number' ? data.total : rows.length;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-2">Dashboard de Documentos</h1>
      <p className="text-sm opacity-70 mb-4">{total} documentos en total</p>
      <pre className="text-xs bg-black/10 rounded p-4 overflow-auto">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
