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

  return <div>{/* TODO: tu tabla con data */}</div>;
}
