"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DocumentReviewHeader } from "@/components/documents/review/DocumentReviewHeader";
import { AIAssistantSidebar } from "@/components/documents/review/AIAssistantSidebar";
import { DocumentToolbar } from "@/components/documents/review/DocumentToolbar";
import { SmartRevisionsSidebar } from "@/components/documents/review/SmartRevisionsSidebar";
import { getDocument } from "@/app/lib/webApi";
import { sanitizeInput } from "@/app/lib/sanitize";
import type { Document as ProxyDocument, DocumentApiResponse } from "@/app/lib/webApi";

type DocumentResponse = DocumentApiResponse;
type LastVersion = ProxyDocument["lastVersion"];

export default function DocumentReviewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [data, setData] = useState<DocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [documentContent, setDocumentContent] = useState("");

  // Load document
  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const json = await getDocument(id);
        setData(json);
        if (json.document?.lastVersion?.rawText) {
          setDocumentContent(json.document.lastVersion.rawText);
        }
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || "Error de red al cargar el documento");
        setLoading(false);
      }
    }

    load();
  }, [id]);

  const handleFinalize = async () => {
    if (!id) return;
    router.push(`/documents/${id}`);
  };

  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const showAiNotice = (msg: string) => {
    setAiNotice(msg);
    setTimeout(() => setAiNotice(null), 3000);
  };

  const handleApplyAll = () => {
    showAiNotice("La revisión automática con IA estará disponible próximamente.");
  };

  const handleApplyChange = (_changeId: string) => {
    showAiNotice("La aprobación de cambios con IA estará disponible próximamente.");
  };

  const handleIgnoreChange = (_changeId: string) => {
    showAiNotice("La gestión de sugerencias estará disponible próximamente.");
  };

  const handleAskAI = (_question: string) => {
    showAiNotice("El asistente de IA estará disponible próximamente.");
  };

  // No hay sugerencias ni comentarios hasta que el backend los provea
  const suggestedChanges: never[] = [];
  const comments: never[] = [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-slate-500">Cargando documento...</div>
      </div>
    );
  }

  if (error || !data?.document) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error || "Documento no encontrado"}</div>
      </div>
    );
  }

  const doc = data.document;
  const documentTitle = doc.type || "Documento";
  const fileName = `${documentTitle}_V2.pdf`;

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      {aiNotice && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white text-sm px-5 py-3 rounded-lg shadow-lg">
          {aiNotice}
        </div>
      )}
      <DocumentReviewHeader
        documentId={id!}
        documentTitle={documentTitle}
        onFinalize={handleFinalize}
      />

      <main className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: AI Assistant */}
        <AIAssistantSidebar
          readability={85}
          readabilityFeedback="Tu texto es claro y profesional. Considera simplificar el segundo párrafo."
          onApplyAll={handleApplyAll}
        />

        {/* Main Content Area: Editor */}
        <section className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 overflow-y-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 px-8 py-4 text-sm text-slate-500 dark:text-slate-400">
            <Link href="/documents" className="hover:text-primary transition-colors">
              Documentos
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-slate-900 dark:text-slate-200 font-medium">{fileName}</span>
          </div>

          {/* Toolbar */}
          <DocumentToolbar />

          {/* Document Viewer */}
          <div className="flex-1 px-8 py-6">
            <div className="max-w-[850px] mx-auto bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 rounded-lg p-12 min-h-[1000px] text-slate-800 dark:text-slate-200 leading-relaxed text-base font-display">
              {/* Document Title */}
              <h1 className="text-3xl font-bold mb-8 text-center border-b border-slate-100 dark:border-slate-800 pb-6">
                {documentTitle}
              </h1>

              {/* Document Content */}
              <div className="mb-6">
                {documentContent ? (
                  <div className="prose prose-slate dark:prose-invert max-w-none">
                    {documentContent.split("\n").map((paragraph, index) => {
                      if (!paragraph.trim()) return <br key={index} />;

                      // Check if it's a section header
                      if (/^\d+\./.test(paragraph.trim())) {
                        return (
                          <h2 key={index} className="text-xl font-bold mb-4 mt-8">
                            {paragraph.trim()}
                          </h2>
                        );
                      }

                      // Check if it contains highlighted terms (simple detection)
                      const hasHighlight = paragraph.includes("(") && paragraph.includes(")");
                      if (hasHighlight && paragraph.includes("El Cliente") && index === 0) {
                        return (
                          <p key={index} className="mb-4">
                            {paragraph.split(/(\([^)]+\))/).map((part, i) => {
                              if (part.startsWith("(") && part.endsWith(")")) {
                                return (
                                  <span
                                    key={i}
                                    className="bg-primary/5 border-b border-primary/30 px-1 rounded"
                                  >
                                    {part}
                                  </span>
                                );
                              }
                              return <span key={i}>{part}</span>;
                            })}
                          </p>
                        );
                      }

                      return (
                        <p key={index} className="mb-4">
                          {paragraph}
                        </p>
                      );
                    })}


                  </div>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400">
                    No hay contenido disponible para mostrar.
                  </p>
                )}

                {/* Signature Lines */}
                <div className="h-24 w-full border-b-2 border-slate-100 dark:border-slate-800 mb-8 border-dashed"></div>
                <div className="flex justify-between items-end mt-12 px-8">
                  <div className="flex flex-col items-center">
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 w-48 mb-2"></div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Firma del Cliente
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    <div className="h-1 bg-slate-200 dark:bg-slate-700 w-48 mb-2"></div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                      Firma del Prestador
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Sidebar: Smart Revisions */}
        <SmartRevisionsSidebar
          suggestedChanges={suggestedChanges}
          comments={comments}
          onApplyChange={handleApplyChange}
          onIgnoreChange={handleIgnoreChange}
          onAskAI={handleAskAI}
        />
      </main>
    </div>
  );
}



