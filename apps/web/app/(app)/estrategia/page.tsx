"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Swords, Plus, Loader2, Trash2, ChevronRight,
  AlertTriangle, CheckCircle2, Clock, FileText, Upload, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageSkeleton } from "@/components/ui/PageSkeleton";
import { StatsGrid } from "@/components/ui/StatsGrid";
import { cn } from "@/app/lib/utils";
import {
  listEscritos, uploadEscrito, deleteEscrito,
  EscritoAnalisis, TipoEscrito, NivelRiesgo,
  listExpedientes, Expediente,
} from "@/app/lib/webApi";
import Link from "next/link";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<TipoEscrito, string> = {
  demanda:       "Demanda",
  contestacion:  "Contestación",
  recurso:       "Recurso",
  alegato:       "Alegato",
  pericia:       "Pericia",
  resolucion:    "Resolución",
  otro:          "Otro",
};

const MATERIAS = [
  { value: "civil",          label: "Civil" },
  { value: "penal",          label: "Penal" },
  { value: "laboral",        label: "Laboral" },
  { value: "familia",        label: "Familia" },
  { value: "comercial",      label: "Comercial" },
  { value: "administrativo", label: "Administrativo" },
  { value: "otro",           label: "Otro" },
];

const PROVINCIAS = [
  { value: "corrientes",   label: "Corrientes" },
  { value: "misiones",     label: "Misiones" },
  { value: "caba",         label: "CABA" },
  { value: "buenos_aires", label: "Buenos Aires" },
  { value: "otro",         label: "Otra" },
];

const RIESGO_CONFIG: Record<NivelRiesgo, { label: string; color: string; icon: any }> = {
  alto:  { label: "Riesgo alto",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",    icon: AlertTriangle },
  medio: { label: "Riesgo medio", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle },
  bajo:  { label: "Riesgo bajo",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
};

// ─── Upload Modal ─────────────────────────────────────────────────────────────

function UploadModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { success, error: showError } = useToast();
  const [file, setFile]               = useState<File | null>(null);
  const [dragging, setDragging]       = useState(false);
  const [tipoEscrito, setTipoEscrito] = useState<TipoEscrito>("demanda");
  const [materia, setMateria]         = useState("");
  const [provincia, setProvincia]     = useState("corrientes");
  const [expedienteId, setExpedienteId] = useState("");
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [uploading, setUploading]     = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listExpedientes({ pageSize: 500 }).then((r) => setExpedientes(r.expedientes)).catch(() => {});
  }, []);

  async function handleSubmit() {
    if (!file) return;
    setUploading(true);
    try {
      await uploadEscrito(file, {
        tipoEscrito,
        materia:      materia || undefined,
        provincia:    provincia || undefined,
        expedienteId: expedienteId || null,
      });
      success("Escrito subido. El análisis comenzó en segundo plano.");
      onSuccess();
    } catch (err: any) {
      showError(err?.message || "Error al subir el escrito");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="size-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Swords className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="font-semibold text-lg">Analizar escrito contrario</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) setFile(f); }}
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all",
              dragging ? "border-violet-400 bg-violet-50 dark:bg-violet-950/20" :
              file ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20" :
              "border-slate-300 dark:border-slate-700 hover:border-violet-400/50",
            )}
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])} />
            {file ? (
              <div className="space-y-1">
                <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto" />
                <p className="font-medium text-sm text-slate-800 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-7 h-7 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="text-sm text-slate-500">Arrastrá el PDF o hacé clic para buscar</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Tipo de escrito</label>
              <select value={tipoEscrito} onChange={(e) => setTipoEscrito(e.target.value as TipoEscrito)}
                className="w-full h-9 rounded-md border border-input bg-white dark:bg-slate-800 px-2.5 text-sm">
                {Object.entries(TIPO_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Materia</label>
              <select value={materia} onChange={(e) => setMateria(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-white dark:bg-slate-800 px-2.5 text-sm">
                <option value="">— Sin especificar —</option>
                {MATERIAS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Provincia</label>
              <select value={provincia} onChange={(e) => setProvincia(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-white dark:bg-slate-800 px-2.5 text-sm">
                {PROVINCIAS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">Expediente (opcional)</label>
              <select value={expedienteId} onChange={(e) => setExpedienteId(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-white dark:bg-slate-800 px-2.5 text-sm">
                <option value="">— Sin vincular —</option>
                {expedientes.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.number ? `[${e.number}] ` : ""}{e.title.slice(0, 40)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={uploading}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={!file || uploading} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white">
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subiendo...</> : <><Swords className="w-4 h-4 mr-2" />Analizar</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EstrategiaPage() {
  const { success, error: showError } = useToast();
  const [items, setItems]       = useState<EscritoAnalisis[]>([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [page, setPage]         = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await listEscritos({ page, pageSize: 20 });
      setItems(res.items);
      setTotal(res.total);
    } catch { if (!silent) showError("Error al cargar los análisis"); }
    finally { if (!silent) setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  // Poll every 4s si hay items processing
  useEffect(() => {
    const hasProcessing = items.some((i) => i.status === "processing" || i.status === "pending");
    if (hasProcessing) {
      pollRef.current = setInterval(() => load(true), 4000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [items, load]);

  async function handleDelete() {
    if (!deleteId) return;
    try {
      await deleteEscrito(deleteId);
      success("Análisis eliminado");
      setDeleteId(null);
      load();
    } catch { showError("No se pudo eliminar"); }
  }

  const totalPages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-6 md:py-10 max-w-6xl mx-auto w-full space-y-8">
      {/* Header editorial */}
      <PageHeader
        icon={Swords}
        iconGradient="violet"
        eyebrow="Asistente IA"
        title="Doku Estratega"
        description="Subí un escrito de la parte contraria y la IA te da la estrategia de defensa."
        actions={
          <Button variant="ink" size="md" onClick={() => setModalOpen(true)}>
            <Plus className="w-4 h-4" />
            Analizar escrito
          </Button>
        }
      />

      {/* Stats */}
      {items.length > 0 && (
        <StatsGrid
          columns={4}
          items={[
            { icon: FileText,      label: "Total",         value: total,                                                         tone: "violet" },
            { icon: CheckCircle2,  label: "Completados",   value: items.filter(i => i.status === "done").length,                  tone: "emerald" },
            { icon: Loader2,       label: "En proceso",    value: items.filter(i => i.status === "processing" || i.status === "pending").length, tone: "amber" },
            { icon: AlertTriangle, label: "Riesgo alto",   value: items.filter(i => i.nivelRiesgo === "alto").length,             tone: "rose" },
          ]}
        />
      )}

      {/* List */}
      {loading ? (
        <PageSkeleton variant="list" count={5} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Swords}
          iconGradient="violet"
          title="Todavía no analizaste ningún escrito"
          description="Subí un PDF de la parte contraria y Doku Estratega identifica puntos débiles, sugiere defensas y detecta riesgos procesales."
          primaryAction={
            <Button onClick={() => setModalOpen(true)} className="bg-violet-600 hover:bg-violet-700 text-white gap-2">
              <Plus className="w-4 h-4" />
              Analizar primer escrito
            </Button>
          }
          tips={[
            "Subí el escrito en PDF — la IA extrae el texto automáticamente",
            "Indicá el tipo de escrito y la materia para mejorar el análisis",
            "Recibís puntos débiles, defensas sugeridas y nivel de riesgo",
          ]}
        />
      ) : (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {(
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => {
              const isProcessing = item.status === "processing" || item.status === "pending";
              const isError      = item.status === "error";
              const isDone       = item.status === "done";
              const riesgoCfg    = item.nivelRiesgo ? RIESGO_CONFIG[item.nivelRiesgo] : null;

              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  {/* Icon */}
                  <div className={cn(
                    "size-9 rounded-lg flex items-center justify-center flex-shrink-0",
                    isDone ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600" :
                    isError ? "bg-red-100 dark:bg-red-900/20 text-red-500" :
                    "bg-slate-100 dark:bg-slate-800 text-slate-400",
                  )}>
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> :
                     isError ? <AlertTriangle className="w-4 h-4" /> :
                     <FileText className="w-4 h-4" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                        {item.originalName}
                      </p>
                      <span className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
                        {TIPO_LABELS[item.tipoEscrito]}
                      </span>
                      {riesgoCfg && (
                        <span className={cn("text-xs px-2 py-0.5 rounded-full font-semibold", riesgoCfg.color)}>
                          {riesgoCfg.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                      {item.expediente && (
                        <span className="truncate max-w-[200px]">
                          📁 {item.expediente.title}
                        </span>
                      )}
                      <span>{new Date(item.createdAt).toLocaleDateString("es-AR")}</span>
                      {isProcessing && <span className="text-violet-500 animate-pulse">Analizando...</span>}
                      {isError && <span className="text-red-500">Error en el análisis</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {isDone && (
                      <Link href={`/estrategia/${item.id}`}>
                        <Button variant="outline" size="sm" className="gap-1 text-xs">
                          Ver análisis <ChevronRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <span>Página {page} de {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</Button>
            </div>
          </div>
        )}
      </div>
      )}

      {modalOpen && (
        <UploadModal
          onClose={() => setModalOpen(false)}
          onSuccess={() => { setModalOpen(false); load(); }}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Eliminar análisis"
        description="Se eliminará el análisis y no se podrá recuperar."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
