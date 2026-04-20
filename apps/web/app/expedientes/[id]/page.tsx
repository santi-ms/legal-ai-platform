"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Pencil, Trash2, Loader2,
  User, CalendarClock, Gavel, Scale, FileText,
  Building2, Calendar, AlertCircle, Clock,
  CalendarX, DollarSign, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  getExpediente, updateExpediente, deleteExpediente,
  Expediente,
} from "@/app/lib/webApi";
import {
  ExpedienteForm,
  MATTER_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/components/expedientes/ExpedienteForm";
import { ActuacionesTimeline } from "@/components/expedientes/ActuacionesTimeline";
import { ExpedienteVencimientosTab } from "@/components/expedientes/ExpedienteVencimientosTab";
import { ExpedienteHonorariosTab } from "@/components/expedientes/ExpedienteHonorariosTab";
import { formatDocumentType } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { TrackVisit } from "@/components/ui/TrackVisit";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "info" | "actuaciones" | "documentos" | "vencimientos" | "honorarios";

interface Tab {
  id:    TabId;
  label: string;
  icon:  React.ElementType;
}

const TABS: Tab[] = [
  { id: "info",         label: "Información",   icon: Briefcase       },
  { id: "actuaciones",  label: "Actuaciones",   icon: Clock           },
  { id: "documentos",   label: "Documentos",    icon: FileText        },
  { id: "vencimientos", label: "Vencimientos",  icon: CalendarX       },
  { id: "honorarios",   label: "Honorarios",    icon: DollarSign      },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{value}</p>
    </div>
  );
}

function formatDate(str: string | null | undefined) {
  if (!str) return null;
  return new Date(str).toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const DOC_STATUS_STYLES: Record<string, string> = {
  generated:    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  needs_review: "bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-300",
  draft:        "bg-slate-100  text-slate-600  dark:bg-slate-800     dark:text-slate-400",
  reviewed:     "bg-sky-100    text-sky-700    dark:bg-sky-900/30    dark:text-sky-300",
  final:        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
};

const DOC_STATUS_LABELS: Record<string, string> = {
  generated:    "Generado",
  needs_review: "Revisar",
  draft:        "Borrador",
  reviewed:     "Revisado",
  final:        "Final",
};

// ─── Tab content ──────────────────────────────────────────────────────────────

function InfoTab({ expediente }: { expediente: Expediente }) {
  const isDeadlinePassed = expediente.deadline && new Date(expediente.deadline) < new Date();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left — details */}
      <div className="lg:col-span-2 space-y-5">
        {/* Datos judiciales */}
        {(expediente.court || expediente.judge || expediente.opposingParty) && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Gavel className="w-4 h-4 text-slate-400" />
              Datos judiciales
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="Juzgado / Tribunal" value={expediente.court} />
              <InfoRow label="Juez interviniente" value={expediente.judge} />
              <InfoRow label="Parte contraria"    value={expediente.opposingParty} />
            </div>
          </div>
        )}

        {/* Portal info */}
        {expediente.portalSyncEnabled && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-slate-400" />
              Portal judicial
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoRow label="ID en portal"       value={expediente.portalId} />
              <InfoRow label="Estado en portal"   value={expediente.portalStatus} />
              <InfoRow label="Última sync"        value={formatDate(expediente.portalLastSync)} />
            </div>
            {expediente.portalLastMovimiento && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Último movimiento</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {expediente.portalLastMovimiento}
                </p>
              </div>
            )}
            <Link href="/portal" className="text-xs text-primary hover:underline font-medium">
              Ver en Portal →
            </Link>
          </div>
        )}

        {/* Notas */}
        {expediente.notes && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Notas internas</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
              {expediente.notes}
            </p>
          </div>
        )}
      </div>

      {/* Right — sidebar */}
      <div className="space-y-4">
        {/* Cliente */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
            <User className="w-4 h-4 text-slate-400" />
            Cliente principal
          </h3>
          {expediente.client ? (
            <Link href={`/clients/${expediente.client.id}`} className="flex items-center gap-3 group">
              <div className={cn(
                "size-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                expediente.client.type === "persona_juridica"
                  ? "bg-violet-500/20 text-violet-600 dark:text-violet-300"
                  : "bg-sky-500/20 text-sky-600 dark:text-sky-300"
              )}>
                {expediente.client.type === "persona_juridica"
                  ? <Building2 className="w-4 h-4" />
                  : <User className="w-4 h-4" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white group-hover:text-primary transition-colors">
                  {expediente.client.name}
                </p>
                <p className="text-xs text-slate-400">
                  {expediente.client.type === "persona_juridica" ? "Persona Jurídica" : "Persona Física"}
                </p>
              </div>
            </Link>
          ) : (
            <p className="text-sm text-slate-400">Sin cliente asignado</p>
          )}
        </div>

        {/* Fechas */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            Fechas
          </h3>
          <InfoRow label="Apertura"    value={formatDate(expediente.openedAt)} />
          {expediente.deadline && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Vencimiento</p>
              <p className={cn(
                "mt-0.5 text-sm font-medium flex items-center gap-1.5",
                isDeadlinePassed ? "text-red-500" : "text-slate-700 dark:text-slate-200"
              )}>
                {isDeadlinePassed && <CalendarClock className="w-3.5 h-3.5" />}
                {formatDate(expediente.deadline)}
                {isDeadlinePassed && <span className="text-xs font-normal">(vencido)</span>}
              </p>
            </div>
          )}
          {expediente.closedAt && (
            <InfoRow label="Cierre" value={formatDate(expediente.closedAt)} />
          )}
          <InfoRow label="Registrado" value={formatDate(expediente.createdAt)} />
        </div>

        {/* Materia */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-slate-400" />
            Materia
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 capitalize">
            {MATTER_LABELS[expediente.matter] ?? expediente.matter}
          </p>
        </div>
      </div>
    </div>
  );
}

function DocumentosTab({ expediente }: { expediente: Expediente }) {
  return (
    <div>
      {/* Header with create button */}
      {expediente.documents && expediente.documents.length > 0 && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {expediente.documents.length} documento{expediente.documents.length !== 1 ? "s" : ""}
            </p>
            <Link
              href={`/documents?expedienteId=${expediente.id}`}
              className="text-xs text-primary hover:underline font-medium"
            >
              Ver en módulo de Documentos →
            </Link>
          </div>
          <Link href={`/documents/new?expedienteId=${expediente.id}`}>
            <Button size="sm" className="text-xs flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Nuevo documento
            </Button>
          </Link>
        </div>
      )}

      {!expediente.documents || expediente.documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <FileText className="w-10 h-10 text-slate-200 dark:text-slate-700" />
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              No hay documentos vinculados
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Creá un documento y asocialo a este expediente
            </p>
          </div>
          <Link href={`/documents/new?expedienteId=${expediente.id}`}>
            <Button size="sm" variant="outline" className="text-xs mt-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Crear documento
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {expediente.documents.map((doc) => {
            const vStatus = doc.versions[0]?.status ?? "draft";
            return (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors group"
              >
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                    {formatDocumentType(doc.type)}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(doc.createdAt).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                  DOC_STATUS_STYLES[vStatus] ?? DOC_STATUS_STYLES["draft"]
                )}>
                  {DOC_STATUS_LABELS[vStatus] ?? vStatus}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ExpedienteDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();
  const { success, error: showError } = useToast();

  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<TabId>("info");
  const [editOpen, setEditOpen]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [notFound, setNotFound]     = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await getExpediente(id);
      setExpediente(data);
    } catch (err: any) {
      if (err?.message?.includes("NOT_FOUND") || err?.message?.includes("404")) {
        setNotFound(true);
      } else {
        showError("Error al cargar el expediente");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleUpdate = async (payload: any) => {
    const updated = await updateExpediente(id, payload);
    setExpediente(updated);
    success("Expediente actualizado");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteExpediente(id);
      success("Expediente eliminado");
      router.push("/expedientes");
    } catch {
      showError("No se pudo eliminar el expediente");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] gap-3 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Cargando expediente...</span>
      </div>
    );
  }

  if (notFound || !expediente) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
        <AlertCircle className="w-10 h-10 text-slate-200 dark:text-slate-700" />
        <p className="text-sm font-medium">Expediente no encontrado</p>
        <Link href="/expedientes" className="text-primary text-sm font-semibold hover:underline">
          Volver a Expedientes
        </Link>
      </div>
    );
  }

  const isDeadlinePassed = expediente.deadline && new Date(expediente.deadline) < new Date();

  const docCount  = expediente.documents?.length ?? 0;

  return (
    <div className="p-6 md:p-8 space-y-5 max-w-6xl mx-auto w-full">
      {/* Track this page visit for "recently viewed" widget */}
      <TrackVisit
        id={expediente.id}
        type="expediente"
        label={expediente.title}
        sublabel={`${MATTER_LABELS[expediente.matter] ?? expediente.matter}${expediente.number ? ` · #${expediente.number}` : ""}`}
        href={`/expedientes/${expediente.id}`}
      />

      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { label: "Expedientes", href: "/expedientes" },
            { label: expediente.title },
          ]}
        />
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick create actions */}
          <Link href={`/documents/new?expedienteId=${expediente.id}`}>
            <Button size="sm" className="flex items-center gap-1.5 text-xs">
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo</span> Documento
            </Button>
          </Link>
          <Link href={`/vencimientos?expedienteId=${expediente.id}&create=1`}>
            <Button variant="outline" size="sm" className="flex items-center gap-1.5 text-xs">
              <CalendarClock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nuevo</span> Vencimiento
            </Button>
          </Link>
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-red-500 hover:text-red-600 hover:border-red-300 dark:hover:border-red-700"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Eliminar
          </Button>
        </div>
      </div>

      {/* Header card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold",
                STATUS_COLORS[expediente.status] ?? "bg-slate-100 text-slate-600"
              )}>
                {STATUS_LABELS[expediente.status] ?? expediente.status}
              </span>
              <span className="text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full capitalize">
                {MATTER_LABELS[expediente.matter] ?? expediente.matter}
              </span>
              {expediente.number && (
                <span className="text-xs text-slate-400">#{expediente.number}</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{expediente.title}</h1>

            {expediente.deadline && (
              <p className={cn(
                "flex items-center gap-1.5 text-xs mt-1.5 font-medium",
                isDeadlinePassed ? "text-red-500" : "text-slate-400"
              )}>
                <CalendarClock className="w-3.5 h-3.5" />
                {isDeadlinePassed ? "Venció el" : "Vence el"} {formatDate(expediente.deadline)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-800 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === "documentos" && docCount > 0 && (
                <span className={cn(
                  "text-[10px] font-bold min-w-[18px] text-center px-1 rounded-full",
                  isActive ? "bg-primary/20 text-primary" : "bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                )}>
                  {docCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === "info"         && <InfoTab expediente={expediente} />}
        {activeTab === "actuaciones"  && <ActuacionesTimeline expedienteId={expediente.id} />}
        {activeTab === "documentos"   && <DocumentosTab expediente={expediente} />}
        {activeTab === "vencimientos" && <ExpedienteVencimientosTab expedienteId={expediente.id} />}
        {activeTab === "honorarios"   && <ExpedienteHonorariosTab expedienteId={expediente.id} />}
      </div>

      {/* Edit panel */}
      <ExpedienteForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleUpdate}
        initial={expediente}
      />

      {/* Confirm delete */}
      <ConfirmDialog
        open={confirmDelete}
        title="Eliminar expediente"
        description="¿Estás seguro de que querés eliminar este expediente? Los documentos vinculados no se eliminarán."
        confirmLabel={deleting ? "Eliminando..." : "Eliminar"}
        cancelLabel="Cancelar"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
