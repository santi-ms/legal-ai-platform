"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  ScanSearch, Upload, FileText, Trash2, Loader2,
  AlertCircle, CheckCircle2, Clock, ChevronRight, ShieldAlert,
} from "lucide-react";
import {
  listContractAnalyses,
  deleteContractAnalysis,
  uploadContractForAnalysis,
  type ContractAnalysis,
} from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ─── Risk config ─────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  low:    { label: "Riesgo bajo",   badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50" },
  medium: { label: "Riesgo medio",  badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800/50" },
  high:   { label: "Riesgo alto",   badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800/50" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [analyses, setAnalyses] = useState<ContractAnalysis[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ContractAnalysis | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listContractAnalyses();
      setAnalyses(res.analyses);
      setTotal(res.total);
    } catch (err: any) {
      toast({ title: "Error al cargar análisis", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Solo se aceptan archivos PDF", variant: "destructive" });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "El archivo no puede superar 10 MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress("Extrayendo texto del PDF...");

    try {
      setUploadProgress("Analizando con IA (esto puede tardar 20-30 segundos)...");
      const result = await uploadContractForAnalysis(file);
      toast({ title: "Análisis completado", description: `"${file.name}" analizado con éxito.` });
      router.push(`/analysis/${result.id}`);
    } catch (err: any) {
      toast({ title: "Error en el análisis", description: err.message, variant: "destructive" });
      setUploading(false);
      setUploadProgress(null);
    }
  }, [router, toast]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteContractAnalysis(deleteTarget.id);
      toast({ title: "Análisis eliminado" });
      setAnalyses(prev => prev.filter(a => a.id !== deleteTarget.id));
      setTotal(t => t - 1);
    } catch (err: any) {
      toast({ title: "Error al eliminar", description: err.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <ScanSearch className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Análisis de Contratos con IA
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Subí un contrato en PDF y Claude lo analiza: riesgos, cláusulas faltantes y recomendaciones
            </p>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer mb-8",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-slate-300 dark:border-slate-700 hover:border-primary hover:bg-primary/5",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onFileChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {uploadProgress ?? "Analizando..."}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Claude está leyendo y analizando el contrato
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Arrastrá un PDF o hacé clic para seleccionar
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Contratos, acuerdos, NDAs, locaciones… hasta 10 MB
              </p>
            </div>
            <span className="text-xs font-semibold text-primary border border-primary/30 rounded-lg px-3 py-1.5">
              Analizar con IA
            </span>
          </div>
        )}
      </div>

      {/* List of analyses */}
      <div>
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-3">
          Análisis anteriores
          {total > 0 && <span className="ml-2 text-sm font-normal text-slate-500">({total})</span>}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : analyses.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center">
            <ScanSearch className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Todavía no analizaste ningún contrato.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {analyses.map((a) => (
              <AnalysisCard
                key={a.id}
                analysis={a}
                onDelete={() => setDeleteTarget(a)}
                onClick={() => router.push(`/analysis/${a.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Eliminar análisis"
        description={`¿Eliminás el análisis de "${deleteTarget?.originalName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

// ─── AnalysisCard ─────────────────────────────────────────────────────────────

function AnalysisCard({
  analysis,
  onDelete,
  onClick,
}: {
  analysis: ContractAnalysis;
  onDelete: () => void;
  onClick: () => void;
}) {
  const risk = analysis.result?.overallRisk;
  const riskCfg = risk ? RISK_CONFIG[risk] : null;

  const date = new Date(analysis.createdAt).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const statusIcon =
    analysis.status === "done"   ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
    analysis.status === "error"  ? <AlertCircle   className="w-4 h-4 text-red-500" />    :
    <Clock className="w-4 h-4 text-yellow-500 animate-pulse" />;

  const fileSizeKb = Math.round(analysis.fileSize / 1024);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4 px-5 py-4">
      {/* File icon */}
      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5 text-slate-500" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
            {analysis.originalName}
          </p>
          {statusIcon}
        </div>
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {riskCfg && (
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", riskCfg.badge)}>
              {riskCfg.label}
            </span>
          )}
          {analysis.result?.contractType && (
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {analysis.result.contractType}
            </span>
          )}
          {analysis.result?.riskyClausesMain && analysis.result.riskyClausesMain.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
              <ShieldAlert className="w-3 h-3" />
              {analysis.result.riskyClausesMain.length} cláusula{analysis.result.riskyClausesMain.length !== 1 ? "s" : ""} riesgosa{analysis.result.riskyClausesMain.length !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-xs text-slate-400">{fileSizeKb} KB · {date}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onClick}
          className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Ver análisis"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
