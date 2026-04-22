"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import {
  uploadReferenceDocument,
  listReferenceDocuments,
  deleteReferenceDocument,
  REFERENCE_DOCUMENT_TYPES,
  ReferenceDocument,
} from "@/app/lib/webApi";
import {
  Upload,
  FileText,
  Trash2,
  Loader2,
  AlertTriangle,
  RefreshCcw,
  FolderOpen,
  ChevronDown,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { StatusPill } from "@/components/ui/StatusPill";
import { AccentStripe } from "@/components/ui/AccentStripe";
import { cn } from "@/app/lib/utils";
import { TOKENS } from "@/app/lib/design-tokens";
import { FolderKanban, Sparkles, HardDrive } from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  REFERENCE_DOCUMENT_TYPES.map((t) => [t.value, t.label])
);

// ─── Upload Zone ─────────────────────────────────────────────────────────────

interface UploadZoneProps {
  onUpload: (file: File, documentType: string) => Promise<void>;
  uploading: boolean;
}

function UploadZone({ onUpload, uploading }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [typeError, setTypeError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    if (!selectedType) {
      setTypeError(true);
      return;
    }
    setTypeError(false);
    await onUpload(selectedFile, selectedType);
    setSelectedFile(null);
    setSelectedType("");
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <h2 className="text-base font-semibold text-slate-900 dark:text-white mb-4">
        Subir documento de referencia
      </h2>

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors",
          dragging
            ? "border-primary bg-primary/5"
            : "border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50"
        )}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
        {selectedFile ? (
          <>
            <div className="size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white text-center">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
            <p className="text-xs text-primary">Haz clic para cambiar el archivo</p>
          </>
        ) : (
          <>
            <div className="size-12 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
              <Upload className="w-6 h-6 text-sky-600 dark:text-sky-400" strokeWidth={1.75} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                Arrastrá tu PDF aquí o hacé clic para seleccionar
              </p>
              <p className="text-xs text-slate-500 mt-1">Solo archivos PDF · Máx. 10 MB</p>
            </div>
          </>
        )}
      </div>

      {/* Document type selector */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Tipo de documento <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => { setSelectedType(e.target.value); setTypeError(false); }}
            className={cn(
              "w-full appearance-none bg-white dark:bg-slate-800 border rounded-lg px-3 py-2.5 pr-8 text-sm text-slate-900 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
              typeError
                ? "border-red-400 focus:ring-red-300"
                : "border-slate-300 dark:border-slate-600"
            )}
          >
            <option value="">Seleccioná el tipo de documento...</option>
            {REFERENCE_DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
        {typeError && (
          <p className="text-xs text-red-500 mt-1">Seleccioná el tipo de documento</p>
        )}
      </div>

      {/* Submit */}
      <Button
        className="w-full mt-4 flex items-center justify-center gap-2"
        disabled={!selectedFile || uploading}
        onClick={handleSubmit}
      >
        {uploading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Subiendo...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Subir documento
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Reference Document Card ─────────────────────────────────────────────────

interface ReferenceCardProps {
  doc: ReferenceDocument;
  onDelete: (id: string) => void;
  deleting: boolean;
}

function ReferenceCard({ doc, onDelete, deleting }: ReferenceCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-soft transition-all group">
      <div className="flex-shrink-0 size-10 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
        <FileText className="w-4 h-4 text-slate-600 dark:text-slate-300" strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {doc.originalName}
          </p>
          {doc.hasText === false && (
            <StatusPill tone="warning" size="sm" icon={AlertCircle}>
              Sin texto
            </StatusPill>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
          <span className="text-xs text-slate-500">{formatFileSize(doc.fileSize)}</span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500">{formatDate(doc.createdAt)}</span>
          {doc.uploadedBy && (
            <>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500">
                {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
              </span>
            </>
          )}
        </div>
      </div>
      <button
        onClick={() => onDelete(doc.id)}
        disabled={deleting}
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all disabled:opacity-30"
        title="Eliminar"
      >
        {deleting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReferencesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { success, error: showError } = useToast();

  const [references, setReferences] = useState<ReferenceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await listReferenceDocuments();
      setReferences(data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Error al cargar documentos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?callbackUrl=/documents/references");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
    }
  }, [authLoading, isAuthenticated, load]);

  const handleUpload = async (file: File, documentType: string) => {
    setUploading(true);
    try {
      const { doc, warning } = await uploadReferenceDocument(file, documentType);
      setReferences((prev) => [doc, ...prev]);
      if (warning) {
        showError(warning);
      } else {
        success(`"${doc.originalName}" subido correctamente`);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (deletingId) return;
    setDeletingId(id);
    try {
      await deleteReferenceDocument(id);
      setReferences((prev) => prev.filter((r) => r.id !== id));
      success("Documento eliminado");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al eliminar el documento");
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Group by documentType
  const grouped = REFERENCE_DOCUMENT_TYPES.map((type) => ({
    ...type,
    docs: references.filter((r) => r.documentType === type.value),
  })).filter((g) => g.docs.length > 0);

  // Also show docs with unknown types
  const knownTypes = new Set<string>(REFERENCE_DOCUMENT_TYPES.map((t) => t.value));
  const unknownDocs = references.filter((r) => !knownTypes.has(r.documentType));

  return (
    <div className="flex flex-col flex-1 text-slate-900 dark:text-slate-100">
      <main className="max-w-[1280px] mx-auto w-full px-4 md:px-6 py-8 flex-1">
        {/* Header */}
        <PageHeader
          icon={FolderKanban}
          iconGradient="sky"
          iconTreatment="outline"
          eyebrow="Asistente IA"
          title="Documentos de Referencia"
          description="Subí tus propios documentos para que la IA los use como modelo de formato y estilo al generar nuevos documentos."
          badge={references.length > 0 ? { label: `${references.length} referencia${references.length !== 1 ? "s" : ""}`, tone: "info" } : undefined}
        />

        {/* Stats */}
        {!loading && references.length > 0 && (
          <div className="mb-6">
            <StatsGrid
              columns={3}
              iconTreatment="outline"
              items={[
                {
                  icon: FileText,
                  label: "Total subidos",
                  value: references.length,
                  tone: "sky",
                  subText: `${Math.max(0, REFERENCE_DOCUMENT_TYPES.filter(t => references.some(r => r.documentType === t.value)).length)} tipos distintos`,
                },
                {
                  icon: Sparkles,
                  label: "Con texto extraído",
                  value: references.filter(r => r.hasText !== false).length,
                  tone: "emerald",
                  subText: "Usables por la IA",
                },
                {
                  icon: HardDrive,
                  label: "Espacio usado",
                  value: formatFileSize(references.reduce((sum, r) => sum + (r.fileSize ?? 0), 0)),
                  tone: "violet",
                },
              ]}
            />
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Upload Panel */}
          <div className="lg:col-span-1">
            <UploadZone onUpload={handleUpload} uploading={uploading} />

            {/* Info box editorial — sin fondo pintado, solo accent stripe */}
            <div className="relative mt-4 rounded-xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden">
              <AccentStripe tone="sky" thickness="thick" />
              <div className="flex items-start gap-2.5 pl-1">
                <div className="flex-shrink-0 size-7 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" strokeWidth={1.75} />
                </div>
                <div className="flex-1">
                  <p className={cn(TOKENS.eyebrow, "mb-1")}>
                    ¿Cómo funciona?
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Cuando creés un documento nuevo, la IA detectará si tenés algún documento similar subido aquí y podrás elegir usarlo como referencia. La IA copiará el formato, estilo y estructura de tu documento.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* List Panel */}
          <div className="lg:col-span-2">
            {loading ? (
              <PageSkeleton variant="list" count={4} />
            ) : loadError ? (
              <EmptyState
                icon={AlertTriangle}
                iconGradient="rose"
                iconTreatment="outline"
                title="Error al cargar documentos"
                description={loadError}
                primaryAction={
                  <Button variant="outline" size="sm" onClick={load} className="flex items-center gap-2">
                    <RefreshCcw className="w-3.5 h-3.5" />
                    Reintentar
                  </Button>
                }
              />
            ) : references.length === 0 ? (
              <EmptyState
                icon={FolderOpen}
                iconGradient="sky"
                iconTreatment="outline"
                title="Todavía no hay documentos de referencia"
                description="Subí tu primer PDF usando el panel de la izquierda. La IA lo usará como plantilla para mantener tu estilo y formato en los documentos que generes."
                tips={[
                  "Funciona mejor con cartas documento, contratos y escritos tipo",
                  "Extraemos el texto automáticamente para que la IA lo entienda",
                  "Podés tener varios documentos por tipo — elegís cuál usar en cada generación",
                ]}
              />
            ) : (
              <div className="space-y-6">
                {grouped.map((group) => (
                  <div key={group.value}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className={TOKENS.eyebrow}>
                        {group.label}
                      </h3>
                      <StatusPill tone="neutral" size="sm">{group.docs.length}</StatusPill>
                    </div>
                    <div className="space-y-2">
                      {group.docs.map((doc) => (
                        <ReferenceCard
                          key={doc.id}
                          doc={doc}
                          onDelete={handleDelete}
                          deleting={deletingId === doc.id}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {unknownDocs.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className={TOKENS.eyebrow}>
                        Otros
                      </h3>
                      <StatusPill tone="neutral" size="sm">{unknownDocs.length}</StatusPill>
                    </div>
                    <div className="space-y-2">
                      {unknownDocs.map((doc) => (
                        <ReferenceCard
                          key={doc.id}
                          doc={doc}
                          onDelete={handleDelete}
                          deleting={deletingId === doc.id}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
