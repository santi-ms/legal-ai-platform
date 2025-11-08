export const dynamic = "force-dynamic";

import { listDocuments } from "@/app/lib/webApi";

type DocumentsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const flat: Record<string, string> = {};
  for (const [key, value] of Object.entries(searchParams || {})) {
    if (Array.isArray(value)) {
      flat[key] = value[0] ?? "";
    } else if (value) {
      flat[key] = value;
    }
  }

  let data: any;
  try {
    data = await listDocuments(flat);
  } catch (e: any) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center">
        <h2 className="text-2xl font-semibold mb-4">
          Error al cargar documentos
        </h2>
        <pre className="text-left text-sm whitespace-pre-wrap bg-red-950/20 border border-red-500/30 p-3 rounded">
{String(e?.message ?? e)}
        </pre>
      </div>
    );
  }

  const rows = Array.isArray((data as any)?.items)
    ? (data as any).items
    : Array.isArray((data as any)?.data)
    ? (data as any).data
    : [];
  const total =
    typeof (data as any)?.total === "number"
      ? (data as any).total
      : Array.isArray(rows)
      ? rows.length
      : 0;

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
}
