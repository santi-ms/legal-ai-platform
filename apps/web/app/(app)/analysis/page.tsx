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
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { isPlanLimitError } from "@/app/lib/webApi";
import { usePlanLimitHandler } from "@/app/lib/hooks/usePlanLimitHandler";

// ─── Risk config ─────────────────────────────────────────────────────────────

const RISK_CONFIG = {
  low:    { label: "Riesgo bajo",   badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50" },
  medium: { label: "Riesgo medio",  badge: "bg-amber-50  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300  border border-amber-200/70  dark:border-amber-800/50" },
  high:   { label: "Riesgo alto",   badge: "bg-rose-50   text-rose-700   dark:bg-rose-900/30   dark:text-rose-300   border border-rose-200/70   dark:border-rose-800/50" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalysisPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  const handlePlanLimit = usePlanLimitHandler();
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
      toastError(`Error al cargar análisis: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => { load(); }, [load]);

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toastError("Solo se aceptan archivos PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError("El archivo no puede superar 10 MB");
      return;
    }

    setUploading(true);
    setUploadProgress("Subiendo PDF y extrayendo texto...");

    try {
      const { analysisId } = await uploadContractForAnalysis(file);
      toastSuccess(`"${file.name}" subido — Claude está analizando en segundo plano.`);
      router.push(`/analysis/${analysisId}`);
    } catch (err: any) {
      if (isPlanLimitError(err)) {
        handlePlanLimit(err);
      } else {
        toastError(`Error al subir el archivo: ${err.message}`);
      }
      setUploading(false);
      setUploadProgress(null);
    }
  }, [router, toastSuccess, toastError, handlePlanLimit]);

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
      toastSuccess("Análisis eliminado");
      setAnalyses(prev => prev.filter(a => a.id !== deleteTarget.id));
      setTotal(t => t - 1);
    } catch (err: any) {
      toastError(`Error al eliminar: ${err.message}`);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 md:py-10 max-w-[1280px] mx-auto w-full">
      <PageHeader
        icon={ScanSearch}
        iconGradient="emerald"
        eyebrow="Asistente IA"
        title="Doku Analiza"
        description="Subí un contrato en PDF y Claude lo analiza: riesgos, cláusulas faltantes y recomendaciones."
      />

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative rounded-2xl border-2 border-dashed p-10 text-center transition-all cursor-pointer mb-10 overflow-hidden",
          dragOver
            ? "border-emerald-400 bg-emerald-50/60 dark:bg-emerald-900/10"
            : "border-slate-300 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-900/5",
          uploading && "pointer-events-none opacity-80"
        )}
      >
        <div className="pointer-events-none absolute -top-20 -right-20 w-80 h-80 rounded-full bg-gradient-to-br from-emerald-400/10 to-teal-500/10 blur-3xl" aria-hidden />
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onFileChange}
        />

        {uploading ? (
          <div className="relative flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {uploadProgress ?? "Analizando..."}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preparando el análisis con IA…
            </p>
          </div>
        ) : (
          <div className="relative flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-soft">
              <Upload className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-base font-bold text-slate-800 dark:text-slate-100">
                Arrastrá un PDF o hacé clic para seleccionar
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Contratos, acuerdos, NDAs, locaciones… hasta 10 MB
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-900/30 border border-emerald-200/70 dark:border-emerald-800/50 rounded-lg px-3 py-1.5">
              <ScanSearch className="w-3.5 h-3.5" />
              Analizar con IA
            </span>
          </div>
        )}
      </div>

      {/* List of analyses */}
      <div>
        <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-400">
              Historial
            </p>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5 tracking-tight">
              Análisis anteriores
              {total > 0 && <span className="ml-2 text-sm font-normal text-slate-500 dark:text-slate-400">· {total}</span>}
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : analyses.length === 0 ? (
          <EmptyState
            size="compact"
            icon={ScanSearch}
            iconGradient="emerald"
            title="Todavía no analizaste ningún contrato"
            description="Subí un PDF desde la zona de arriba y Claude te devuelve un análisis estructurado."
          />
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
        isLoading={deleting}
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

  const riskAccent =
    risk === "high"   ? "from-rose-500 to-red-600" :
    risk === "medium" ? "from-amber-500 to-orange-500" :
    risk === "low"    ? "from-emerald-500 to-teal-600" :
    "from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600";

  return (
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-hover hover:border-slate-300 dark:hover:border-slate-700 transition-all flex items-center gap-4 px-5 py-4 overflow-hidden">
      {/* Accent bar izquierda según riesgo */}
      <span
        className={cn("absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b", riskAccent)}
        aria-hidden
      />

      {/* File icon */}
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center flex-shrink-0 ml-1">
        <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
            {analysis.originalName}
          </p>
          {statusIcon}
          {riskCfg && (
            <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full", riskCfg.badge)}>
              {riskCfg.label}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 mt-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          {analysis.result?.contractType && (
            <span className="truncate max-w-[220px] font-medium text-slate-600 dark:text-slate-300">
              {analysis.result.contractType}
            </span>
          )}
          {analysis.result?.riskyClausesMain && analysis.result.riskyClausesMain.length > 0 && (
            <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400">
              <ShieldAlert className="w-3 h-3" />
              {analysis.result.riskyClausesMain.length} cláusula{analysis.result.riskyClausesMain.length !== 1 ? "s" : ""} riesgosa{analysis.result.riskyClausesMain.length !== 1 ? "s" : ""}
            </span>
          )}
          <span className="text-slate-400 dark:text-slate-500">{fileSizeKb} KB · {date}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onClick}
          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
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
