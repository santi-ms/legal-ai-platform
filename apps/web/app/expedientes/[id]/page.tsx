"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase, Pencil, Trash2, Loader2,
  User, CalendarClock, Gavel, Scale, FileText,
  Building2, Calendar, AlertCircle,
} from "lucide-react";
import { ActuacionesTimeline } from "@/components/expedientes/ActuacionesTimeline";
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
import { formatDocumentType } from "@/app/lib/format";
import { cn } from "@/app/lib/utils";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

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

export default function ExpedienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const { success, error: showError } = useToast();

  const [expediente, setExpediente]   = useState<Expediente | null>(null);
  const [loading, setLoading]         = useState(true);
  const [editOpen, setEditOpen]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [notFound, setNotFound]       = useState(false);

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

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Back + Actions */}
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          items={[
            { label: "Expedientes", href: "/expedientes" },
            { label: expediente.title },
          ]}
        />
        <div className="flex items-center gap-2">
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
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
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

            {/* Deadline warning */}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — details */}
        <div className="lg:col-span-2 space-y-6">

          {/* Datos judiciales */}
          {(expediente.court || expediente.judge || expediente.opposingParty) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Gavel className="w-4 h-4 text-slate-400" />
                Datos judiciales
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InfoRow label="Juzgado / Tribunal" value={expediente.court} />
                <InfoRow label="Juez interviniente" value={expediente.judge} />
                <InfoRow label="Parte contraria"    value={expediente.opposingParty} />
              </div>
            </div>
          )}

          {/* Documentos vinculados */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <FileText className="w-4 h-4 text-slate-400" />
              Documentos
              <span className="ml-auto text-xs font-normal text-slate-400">
                {expediente.documents?.length ?? 0} {expediente.documents?.length === 1 ? "documento" : "documentos"}
              </span>
            </h2>

            {!expediente.documents || expediente.documents.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">
                No hay documentos vinculados a este expediente.
              </p>
            ) : (
              <div className="space-y-2">
                {expediente.documents.map((doc) => {
                  const vStatus = doc.versions[0]?.status ?? "draft";
                  return (
                    <Link
                      key={doc.id}
                      href={`/documents/${doc.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate group-hover:text-primary transition-colors">
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

          {/* Notas */}
          {expediente.notes && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
              <h2 className="font-bold text-sm text-slate-900 dark:text-white mb-3">Notas internas</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {expediente.notes}
              </p>
            </div>
          )}

          {/* Actuaciones */}
          <ActuacionesTimeline expedienteId={expediente.id} />
        </div>

        {/* Right — sidebar */}
        <div className="space-y-4">

          {/* Cliente */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-slate-400" />
              Cliente principal
            </h2>
            {expediente.client ? (
              <Link
                href={`/clients/${expediente.client.id}`}
                className="flex items-center gap-3 group"
              >
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
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              Fechas
            </h2>
            <InfoRow label="Apertura"   value={formatDate(expediente.openedAt)} />
            <InfoRow label="Vencimiento" value={formatDate(expediente.deadline)} />
            {expediente.closedAt && (
              <InfoRow label="Cierre" value={formatDate(expediente.closedAt)} />
            )}
            <InfoRow label="Creado"     value={formatDate(expediente.createdAt)} />
          </div>

          {/* Materia */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm">
            <h2 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Scale className="w-4 h-4 text-slate-400" />
              Materia
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 capitalize">
              {MATTER_LABELS[expediente.matter] ?? expediente.matter}
            </p>
          </div>
        </div>
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
