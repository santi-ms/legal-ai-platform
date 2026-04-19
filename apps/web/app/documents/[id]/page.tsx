"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, AlertCircle, AlertTriangle, CalendarClock, MapPin, Pencil, ScrollText, Users, X, ChevronDown, Loader2, CheckCircle2, Clock, Star, RotateCcw, Share2, FileType } from "lucide-react";
import { SkeletonDocumentDetail } from "@/components/ui/skeleton";
import { sanitizeInput } from "@/app/lib/sanitize";
import { cn } from "@/lib/utils";
import { DocumentStatusBadge } from "@/app/components/DocumentStatusBadge";
import { DocumentWorkspaceShell } from "@/components/documents/DocumentWorkspaceShell";
import { listClients, patchDocumentClient, listExpedientes, patchDocumentExpediente, updateDocumentReviewStatus, downloadDocumentDocx } from "@/app/lib/webApi";
import { VersionHistoryCard } from "@/components/documents/VersionHistoryCard";
import { AnnotationsCard } from "@/components/documents/AnnotationsCard";
import { ShareModal } from "@/components/documents/ShareModal";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Briefcase } from "lucide-react";
import type {
  Document as ProxyDocument,
  DocumentApiResponse as ProxyDocumentResponse,
  Client,
  Expediente,
} from "@/app/lib/webApi";

type DocumentResponse = ProxyDocumentResponse;

// ─── Client Card ──────────────────────────────────────────────────────────────

function DocumentClientCard({
  documentId,
  initialClient,
}: {
  documentId: string;
  initialClient?: { id: string; name: string; type: string } | null;
}) {
  const [client, setClient] = useState<{ id: string; name: string; type: string } | null>(
    initialClient ?? null
  );
  const [open, setOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const fetchClients = async () => {
    if (clients.length > 0) return;
    setLoadingClients(true);
    try {
      const res = await listClients({ pageSize: 100, sort: "name:asc" });
      setClients(res.clients);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
    fetchClients();
  };

  const assign = async (c: Client | null) => {
    setSaving(true);
    setOpen(false);
    try {
      await patchDocumentClient(documentId, c?.id ?? null);
      setClient(c ? { id: c.id, name: c.name, type: c.type } : null);
    } catch {
      // silently ignore — UI stays at previous value
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cliente asociado</h2>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      {client ? (
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/clients/${client.id}`}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <span className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              {client.name.slice(0, 2).toUpperCase()}
            </span>
            {client.name}
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative" ref={ref}>
              <button
                onClick={handleOpen}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium"
              >
                Cambiar
              </button>
              {open && (
                <div className="absolute right-0 top-6 z-50 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 max-h-56 overflow-y-auto">
                    {loadingClients ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      </div>
                    ) : clients.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">Sin clientes</p>
                    ) : (
                      clients.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => assign(c)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                        >
                          <span className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                            {c.name.slice(0, 2).toUpperCase()}
                          </span>
                          <span className="text-sm text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => assign(null)}
              className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors"
              title="Desasociar cliente"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative" ref={ref}>
          <button
            onClick={handleOpen}
            className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
            Asignar cliente
          </button>
          {open && (
            <div className="absolute left-0 top-7 z-50 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 max-h-56 overflow-y-auto">
                {loadingClients ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                  </div>
                ) : clients.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">Sin clientes registrados</p>
                ) : (
                  clients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => assign(c)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors"
                    >
                      <span className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                        {c.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="text-sm text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Expediente Card ──────────────────────────────────────────────────────────

function DocumentExpedienteCard({
  documentId,
  initialExpediente,
}: {
  documentId: string;
  initialExpediente?: { id: string; title: string; number: string | null; matter: string; status: string } | null;
}) {
  const [expediente, setExpediente] = useState<{ id: string; title: string; number: string | null; matter: string; status: string } | null>(
    initialExpediente ?? null
  );
  const [open, setOpen] = useState(false);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const fetchExpedientes = async () => {
    if (expedientes.length > 0) return;
    setLoadingList(true);
    try {
      const res = await listExpedientes({ pageSize: 100, sort: "title:asc" });
      setExpedientes(res.expedientes);
    } finally {
      setLoadingList(false);
    }
  };

  const handleOpen = () => { setOpen(true); fetchExpedientes(); };

  const assign = async (e: Expediente | null) => {
    setSaving(true);
    setOpen(false);
    try {
      await patchDocumentExpediente(documentId, e?.id ?? null);
      setExpediente(e ? { id: e.id, title: e.title, number: e.number ?? null, matter: e.matter, status: e.status } : null);
    } catch { /* silently ignore */ } finally { setSaving(false); }
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Expediente asociado</h2>
        </div>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      {expediente ? (
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/expedientes/${expediente.id}`}
            className="flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <span className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
              <Briefcase className="w-3.5 h-3.5" />
            </span>
            <span className="truncate">
              {expediente.number ? `#${expediente.number} · ` : ""}{expediente.title}
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="relative" ref={ref}>
              <button onClick={handleOpen} className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium">
                Cambiar
              </button>
              {open && (
                <div className="absolute right-0 top-6 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-2 max-h-56 overflow-y-auto">
                    {loadingList ? (
                      <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                    ) : expedientes.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-3">Sin expedientes</p>
                    ) : expedientes.map((ex) => (
                      <button key={ex.id} onClick={() => assign(ex)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm text-slate-800 dark:text-slate-200 truncate">{ex.title}</p>
                          {ex.number && <p className="text-xs text-slate-400">#{ex.number}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => assign(null)} className="p-1 rounded text-slate-300 hover:text-red-500 transition-colors" title="Desasociar expediente">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative" ref={ref}>
          <button onClick={handleOpen} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors">
            <ChevronDown className="w-4 h-4" />
            Asignar expediente
          </button>
          {open && (
            <div className="absolute left-0 top-7 z-50 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden">
              <div className="p-2 max-h-56 overflow-y-auto">
                {loadingList ? (
                  <div className="flex justify-center py-4"><Loader2 className="w-4 h-4 animate-spin text-slate-400" /></div>
                ) : expedientes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-3">Sin expedientes registrados</p>
                ) : expedientes.map((ex) => (
                  <button key={ex.id} onClick={() => assign(ex)} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-800 dark:text-slate-200 truncate">{ex.title}</p>
                      {ex.number && <p className="text-xs text-slate-400">#{ex.number}</p>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

// ─── Review Workflow Card ─────────────────────────────────────────────────────

type ReviewStatus = "draft" | "generated" | "needs_review" | "reviewed" | "final";

const WORKFLOW_STEPS: { status: ReviewStatus; label: string; description: string }[] = [
  { status: "generated",    label: "Generado",  description: "Recién generado por IA" },
  { status: "reviewed",     label: "Revisado",  description: "Revisado y corregido" },
  { status: "final",        label: "Final",     description: "Aprobado y listo para usar" },
];

const STATUS_ICON: Record<string, React.ReactNode> = {
  generated:    <Clock className="w-4 h-4" />,
  needs_review: <AlertTriangle className="w-4 h-4" />,
  reviewed:     <CheckCircle2 className="w-4 h-4" />,
  final:        <Star className="w-4 h-4" />,
  draft:        <RotateCcw className="w-4 h-4" />,
};

const STATUS_STYLE: Record<string, string> = {
  draft:        "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  generated:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  needs_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  reviewed:     "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  final:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

function ReviewWorkflowCard({
  documentId,
  initialStatus,
  onStatusChange,
}: {
  documentId: string;
  initialStatus: ReviewStatus;
  onStatusChange?: (status: ReviewStatus) => void;
}) {
  const [status, setStatus]   = useState<ReviewStatus>(initialStatus);
  const [saving, setSaving]   = useState(false);

  // skip needs_review and draft in the visual progress — they're special states
  const visibleSteps = WORKFLOW_STEPS;
  const currentIdx   = visibleSteps.findIndex((s) => s.status === status);

  const transition = async (next: ReviewStatus) => {
    if (saving || next === status) return;
    setSaving(true);
    try {
      await updateDocumentReviewStatus(documentId, next);
      setStatus(next);
      onStatusChange?.(next);
    } catch {
      // silently ignore — status stays
    } finally {
      setSaving(false);
    }
  };

  const nextStep = visibleSteps[currentIdx + 1];
  const prevStep = visibleSteps[currentIdx - 1];

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Estado de revisión</h2>
        {saving && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
      </div>

      {/* Progress steps */}
      <div className="flex items-center gap-1 mb-5">
        {visibleSteps.map((step, i) => {
          const isActive   = step.status === status;
          const isComplete = currentIdx > i;
          return (
            <div key={step.status} className="flex items-center flex-1">
              <button
                onClick={() => transition(step.status)}
                disabled={saving}
                title={step.description}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[11px] font-semibold transition-all",
                  isActive
                    ? STATUS_STYLE[status] + " ring-2 ring-offset-1 ring-current"
                    : isComplete
                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 cursor-pointer hover:bg-emerald-100"
                    : "text-slate-400 dark:text-slate-500 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                )}
              >
                {isComplete
                  ? <CheckCircle2 className="w-4 h-4" />
                  : STATUS_ICON[step.status]
                }
                {step.label}
              </button>
              {i < visibleSteps.length - 1 && (
                <div className={cn(
                  "h-0.5 w-3 flex-shrink-0 rounded-full mx-0.5",
                  isComplete ? "bg-emerald-400" : "bg-slate-200 dark:bg-slate-700"
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {nextStep && (
          <Button
            size="sm"
            onClick={() => transition(nextStep.status)}
            disabled={saving}
            className="bg-primary text-white hover:bg-primary/90 font-semibold text-xs"
          >
            Marcar como {nextStep.label}
          </Button>
        )}
        {prevStep && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => transition(prevStep.status)}
            disabled={saving}
            className="text-xs text-slate-600 dark:text-slate-300"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Volver a {prevStep.label}
          </Button>
        )}
        {status === "needs_review" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => transition("reviewed")}
            disabled={saving}
            className="text-xs text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Marcar como Revisado
          </Button>
        )}
      </div>

      {status === "final" && (
        <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
          <Star className="w-3.5 h-3.5" />
          Documento aprobado y listo para usar
        </p>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<DocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const downloadErrorRef = useRef<HTMLDivElement>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  // carga el documento
  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const { getDocument } = await import("@/app/lib/webApi");
        const json = await getDocument(id);
        setData(json);
        setLoading(false);
      } catch (err: any) {
        setError(err?.message || "Error de red al cargar el documento");
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function handleDownload() {
    setDownloadError(null);
    if (!id) return;

    try {
      const response = await fetch(`/api/_proxy/documents/${id}/pdf`);
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        const msg = (json as any).message || "No se pudo descargar el PDF.";
        setDownloadError(msg);
        setTimeout(() => downloadErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError("No se pudo generar el PDF. Revisá tu conexión e intentá de nuevo.");
      setTimeout(() => downloadErrorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    }
  }

  // distintos estados

  if (!id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Cargando id…
      </div>
    );
  }

  if (loading) {
    return (
      <DocumentWorkspaceShell
        title="Cargando documento"
        description="Obteniendo información del documento y preparando su vista detallada."
      >
        <SkeletonDocumentDetail />
      </DocumentWorkspaceShell>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      </div>
    );
  }

  if (!data?.document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-sm text-gray-500">
        Documento no encontrado.
      </div>
    );
  }

  // data lista
  const doc = data.document;
  const last = doc.lastVersion;
  const currentStatus = doc.estado || last?.status || "draft";
  const contentValue = sanitizeInput(last?.editedContent ?? last?.rawText ?? "");

  const headerDescription = `${sanitizeInput(doc.type || "Documento")} · ${sanitizeInput(doc.jurisdiccion || "Sin jurisdicción")} · ${
    last ? `Actualizado ${new Date(last.createdAt).toLocaleString("es-AR")}` : "Sin versión generada"
  }`;

  return (
    <>
    <DocumentWorkspaceShell
      title={`Documento #${doc.id.slice(0, 8)}`}
      description={headerDescription}
      breadcrumb={
        <Breadcrumb
          items={[
            { label: "Documentos", href: "/documents" },
            { label: `#${doc.id.slice(0, 8)}` },
          ]}
        />
      }
      actions={
        <>
          <Link href="/documents">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          {last?.rawText && (
            <Link
              href={`/documents/${doc.id}/edit`}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-100 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          )}
          {last?.rawText && (
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-100 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              Compartir
            </button>
          )}
          {last?.rawText && (
            last?.status === "needs_review" ? (
              <button
                type="button"
                disabled
                title="El documento requiere revisión antes de generar el PDF final"
                className="inline-flex items-center gap-2 rounded-lg bg-slate-200 dark:bg-slate-700 px-4 py-2 text-sm font-semibold text-slate-400 dark:text-slate-500 cursor-not-allowed"
              >
                <AlertTriangle className="h-4 w-4" />
                PDF no disponible
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDownload();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary/90 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Descargar PDF
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    id && downloadDocumentDocx(id, doc.type || undefined).catch(() => {});
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <FileType className="h-4 w-4" />
                  Word
                </button>
              </div>
            )
          )}

        </>
      }
    >
      <div className="flex flex-col gap-8">
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SummaryCard
            icon={<ScrollText className="h-5 w-5 text-primary" />}
            label="Tipo de documento"
            value={sanitizeInput(doc.type || "Documento")}
          />
          <SummaryCard
            icon={<MapPin className="h-5 w-5 text-primary" />}
            label="Jurisdicción"
            value={sanitizeInput(doc.jurisdiccion || "Sin definir")}
          />
          <SummaryCard
            icon={<CalendarClock className="h-5 w-5 text-primary" />}
            label="Última actualización"
            value={last ? new Date(last.createdAt).toLocaleString("es-AR") : "Sin versión generada"}
          />
        </section>

        {/* BANNER NEEDS REVIEW — con detalle de issues si están disponibles */}
        {last?.status === "needs_review" && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/30 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Este documento requiere revisión
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-0.5">
                  El sistema detectó posibles placeholders o contenido incompleto durante la generación. Revisá el texto antes de usarlo. El PDF no se generó automáticamente.
                </p>
              </div>
            </div>
            {last?.outputWarnings && last.outputWarnings.length > 0 && (
              <ul className="space-y-1 pl-8">
                {last.outputWarnings.map((w, i) => (
                  <li key={i} className="text-sm text-amber-700 dark:text-amber-400 list-disc">
                    {w.message}
                    {w.match && (
                      <code className="ml-1 px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-mono">
                        {w.match}
                      </code>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* ERROR DE DESCARGA */}
        {downloadError && (
          <div
            ref={downloadErrorRef}
            className="flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4"
            role="alert"
          >
            <AlertCircle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                Error al descargar
              </p>
              <p className="text-sm text-red-600 dark:text-red-500 mt-0.5">
                {downloadError}
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="shrink-0 text-sm font-semibold text-red-700 dark:text-red-400 hover:underline"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* CARD DE METADATOS */}
        <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-slate-100 dark:border-slate-700/60">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Resumen del documento</h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Metadata operativa de esta versión</p>
            </div>
            <DocumentStatusBadge status={currentStatus} />
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 xl:grid-cols-3 divide-x divide-y divide-slate-100 dark:divide-slate-700/60">
            {[
              {
                label: "Tipo de documento",
                value: sanitizeInput(doc.type || ""),
              },
              {
                label: "Jurisdicción",
                value: sanitizeInput(doc.jurisdiccion || ""),
              },
              {
                label: "Estado",
                value:
                  doc.estado === "needs_review" ? "Requiere revisión"
                  : doc.estado === "generated" || doc.estado === "generated_text" ? "Generado"
                  : sanitizeInput(doc.estado || ""),
                valueClassName:
                  doc.estado === "generated" || doc.estado === "generated_text" || doc.estado === "GENERATED"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : doc.estado === "needs_review"
                    ? "text-amber-600 dark:text-amber-400"
                    : undefined,
              },
              {
                label: "Costo estimado (USD)",
                value: doc.costUsd !== null ? `$${doc.costUsd}` : "—",
              },
              {
                label: "Versión visible",
                value: last ? `#${last.id.slice(0, 8)}` : "—",
                mono: true,
                small: true,
              },
              {
                label: "Identificador",
                value: doc.id,
                mono: true,
                small: true,
              },
            ].map((f) => (
              <div key={f.label} className="px-5 py-4">
                <MetaField
                  label={f.label}
                  value={f.value}
                  valueClassName={f.valueClassName}
                  mono={f.mono}
                  small={f.small}
                />
              </div>
            ))}
          </div>

          {/* PDF row — solo si hay PDF */}
          {last?.pdfUrl && (
            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center gap-2">
              <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400 dark:text-slate-500 shrink-0">PDF</span>
              <span className="h-3 w-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Disponible para descarga</span>
            </div>
          )}
        </section>

        {/* CLIENTE ASOCIADO */}
        <DocumentClientCard
          documentId={doc.id}
          initialClient={(doc as any).client ?? null}
        />

        {/* EXPEDIENTE ASOCIADO */}
        <DocumentExpedienteCard
          documentId={doc.id}
          initialExpediente={(doc as any).expediente ?? null}
        />

        {/* WORKFLOW DE REVISIÓN */}
        <ReviewWorkflowCard
          documentId={doc.id}
          initialStatus={(last?.status as ReviewStatus) ?? "generated"}
        />

        {/* HISTORIAL DE VERSIONES */}
        <VersionHistoryCard documentId={doc.id} />

        {/* NOTAS INTERNAS */}
        <AnnotationsCard documentId={doc.id} />

        {/* CONTENIDO LEGAL */}
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight">
                Contenido legal
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {last?.editedContent
                  ? "Contenido editado manualmente · el PDF usará esta versión."
                  : "Texto generado automáticamente listo para revisión."}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {last?.editedContent && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                  <Pencil className="h-3 w-3" />
                  Editado
                </span>
              )}
              {last && (
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Versión #{last.id.slice(0, 6)}
                </span>
              )}
            </div>
          </div>

          {last ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm text-sm leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap max-h-[70vh] overflow-y-auto">
              {contentValue}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 shadow-sm">
              Todavía no hay una versión generada para este documento.
            </div>
          )}
        </section>
      </div>
    </DocumentWorkspaceShell>
    {showShareModal && id && (
      <ShareModal documentId={id} onClose={() => setShowShareModal(false)} />
    )}
    </>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">{icon}</div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 dark:text-white break-words">{value}</p>
    </div>
  );
}

/**
 * Campo reutilizable de metadatos
 */
function MetaField({
  label,
  value,
  valueClassName,
  mono,
  small,
}: {
  label: string;
  value: string;
  valueClassName?: string;
  mono?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] uppercase font-semibold tracking-widest text-slate-400 dark:text-slate-500">
        {label}
      </span>
      <span
        className={[
          "font-medium text-slate-800 dark:text-slate-100",
          mono ? "font-mono break-all" : "",
          small ? "text-[11px] leading-normal text-slate-500 dark:text-slate-400" : "text-sm",
          valueClassName || "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value || "—"}
      </span>
    </div>
  );
}
