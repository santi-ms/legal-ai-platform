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
import { cn } from "@/app/lib/utils";

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
            <div className="size-12 rounded-xl bg-green-50 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white text-center">
              {selectedFile.name}
            </p>
            <p className="text-xs text-slate-500">{formatFileSize(selectedFile.size)}</p>
            <p className="text-xs text-primary">Haz clic para cambiar el archivo</p>
          </>
        ) : (
          <>
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-6 h-6 text-primary" />
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
    <div className="flex items-start gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group">
      <div className="flex-shrink-0 size-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
        <FileText className="w-5 h-5 text-red-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
            {doc.originalName}
          </p>
          {doc.hasText === false && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-full px-2 py-0.5 flex-shrink-0">
              <AlertCircle className="w-3 h-3" />
              Sin texto
            </span>
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
        className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all disabled:opacity-30"
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
      <div className="flex items-center justify-center min-h-screen">
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
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Documentos de Referencia
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base mt-1">
            Subí tus propios documentos para que la IA los use como modelo de formato y estilo al generar nuevos documentos.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Upload Panel */}
          <div className="lg:col-span-1">
            <UploadZone onUpload={handleUpload} uploading={uploading} />

            {/* Info box */}
            <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                ¿Cómo funciona?
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                Cuando creés un documento nuevo, la IA detectará si tenés algún documento similar subido aquí y podrás elegir usarlo como referencia. La IA copiará el formato, estilo y estructura de tu documento.
              </p>
            </div>
          </div>

          {/* List Panel */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                <p className="text-sm text-slate-500">Cargando documentos...</p>
              </div>
            ) : loadError ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center gap-4">
                <div className="size-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Error al cargar documentos
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{loadError}</p>
                </div>
                <Button variant="outline" size="sm" onClick={load} className="flex items-center gap-2">
                  <RefreshCcw className="w-3.5 h-3.5" />
                  Reintentar
                </Button>
              </div>
            ) : references.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center gap-3 text-center">
                <div className="size-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <FolderOpen className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Todavía no hay documentos de referencia
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Subí tu primer documento usando el panel de la izquierda
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map((group) => (
                  <div key={group.value}>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {group.label}
                      </h3>
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
                        {group.docs.length}
                      </span>
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
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Otros
                      </h3>
                      <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
                        {unknownDocs.length}
                      </span>
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
