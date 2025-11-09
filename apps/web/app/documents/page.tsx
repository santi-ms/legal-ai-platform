export const dynamic = "force-dynamic";

import { listDocuments } from "@/app/lib/webApi";
import { DocumentsTableSafe } from "@/components/dashboard/DocumentsTableSafe";

export default async function DocumentsPage() {
  let documents: any[] = [];
  let errorMsg: string | null = null;

  try {
    const result = await listDocuments();
    documents = Array.isArray(result.documents) ? result.documents : [];
  } catch (err: any) {
    errorMsg = err?.message || "Error al cargar documentos";
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Dashboard de Documentos</h1>

      {errorMsg ? (
        <div className="mt-6 rounded-md bg-red-900/20 text-red-300 p-4">
          <p className="font-medium">No se pudieron cargar los documentos.</p>
          <p className="text-sm opacity-80">{errorMsg}</p>
        </div>
      ) : (
        <DocumentsTableSafe documents={documents ?? []} />
      )}
    </div>
  );
}
