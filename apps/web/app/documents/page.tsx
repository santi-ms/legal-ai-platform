import Link from "next/link";
import { DashboardShell } from "@/app/components/DashboardShell";
import { DocumentStatusBadge } from "@/app/components/DocumentStatusBadge";
import { Button } from "@/components/ui/button";
import { getDocuments } from "@/app/lib/api";
import { formatDate, formatDocumentType } from "@/app/lib/format";
import { FileText, Download, Eye, Plus } from "lucide-react";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const mockDocuments = [
  {
    id: "3047ae32-b143-4d3f-8b26-b942b03a4155",
    type: "contrato_servicios",
    jurisdiccion: "Corrientes Capital",
    estado: "GENERATED",
    createdAt: "2025-01-28T10:30:00Z",
    lastVersion: {
      pdfUrl: "/path/to/pdf",
    },
  },
];

export default async function DocumentsPage() {
  let documents = [];

  try {
    const data = await getDocuments();
    documents = data.documents || mockDocuments;
  } catch (error) {
    console.error("Error loading documents:", error);
    documents = mockDocuments;
  }

  return (
    <DashboardShell
      title="Documentos"
      description="Historial de contratos, NDAs y cartas documento generados con IA. Todo listo para descargar y firmar."
      action={
        <Link href="/documents/new">
          <Button className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-teal-700/30 hover:bg-teal-500 hover:shadow-md transition-all">
            <Plus className="h-4 w-4" />
            Nuevo documento
          </Button>
        </Link>
      }
    >
      {/* Contenedor principal */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm ring-1 ring-black/[0.02] overflow-hidden">
        {documents.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-gray-50 ring-1 ring-inset ring-gray-200">
              <FileText className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              No hay documentos todavía
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Creá tu primer documento legal con IA y obtené tu contrato
              profesional en segundos.
            </p>
            <Link href="/documents/new">
              <Button className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-teal-700/30 hover:bg-teal-500 hover:shadow-md transition-all">
                <Plus className="h-4 w-4" />
                Crear documento
              </Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Documento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Jurisdicción
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Fecha
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {documents.map((document: any) => (
                  <tr
                    key={document.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    {/* Documento */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-50 ring-1 ring-inset ring-teal-600/20">
                          <FileText className="h-5 w-5 text-teal-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {formatDocumentType(document.type)}
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            #{document.id.slice(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Jurisdicción */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {document.jurisdiccion}
                    </td>

                    {/* Estado */}
                    <td className="px-6 py-4">
                      <DocumentStatusBadge status={document.estado} />
                    </td>

                    {/* Fecha */}
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(document.createdAt)}
                    </td>

                    {/* Acciones */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/documents/${document.id}`}>
                          <button className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 hover:text-gray-900">
                            <Eye className="h-3.5 w-3.5" />
                            Ver
                          </button>
                        </Link>

                        {document.lastVersion?.pdfUrl && (
                          <a
                            href={`http://localhost:4001/documents/${document.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <button className="inline-flex items-center gap-1.5 rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm ring-1 ring-inset ring-teal-700/30 hover:bg-teal-500 hover:shadow-md transition-all">
                              <Download className="h-3.5 w-3.5" />
                              PDF
                            </button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
