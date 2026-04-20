"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  User, Building2, Mail, Phone,
  MapPin, FileText, Hash, Calendar, AlertTriangle, Loader2,
  Archive, ArchiveRestore, UserCircle,
  Globe, Plus, Copy, Ban, Check, ExternalLink, Trash2, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/lib/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import {
  getClient, updateClient, deleteClient, unarchiveClient,
  listDocuments, listExpedientes, listHonorarios, listVencimientos,
  createClientPortalLink, listClientPortalLinks, revokeClientPortalLink, deleteClientPortalLink,
  Client, ClientPayload, ClientType, Document, Expediente, Honorario, Vencimiento, ClientPortalLink,
} from "@/app/lib/webApi";
import { ClientForm } from "@/components/clients/ClientForm";
import { cn } from "@/app/lib/utils";
import { TrackVisit } from "@/components/ui/TrackVisit";
import { ClientHeader } from "./components/ClientHeader";
import { ClientExpedientesTab } from "./components/ClientExpedientesTab";
import { ClientDocumentosTab } from "./components/ClientDocumentosTab";
import { ClientFinanzasTab } from "./components/ClientFinanzasTab";
import { ClientVencimientosTab } from "./components/ClientVencimientosTab";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

const TYPE_LABELS: Record<ClientType, string> = {
  persona_fisica: "Persona Física",
  persona_juridica: "Persona Jurídica",
};

// ─── Info Row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-0.5">
          {label}
        </p>
        {value ? (
          <p className="text-sm text-slate-900 dark:text-slate-100 break-words">{value}</p>
        ) : (
          <p className="text-sm text-slate-300 dark:text-slate-600 italic">Sin datos</p>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ClientDetailPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { success, error: showError } = useToast();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [expsLoading, setExpsLoading] = useState(false);
  const [portalLinks, setPortalLinks] = useState<ClientPortalLink[]>([]);
  const [portalCreating, setPortalCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [honorarios, setHonorarios] = useState<Honorario[]>([]);
  const [honLoading, setHonLoading] = useState(false);
  const [vencimientos, setVencimientos] = useState<Vencimiento[]>([]);
  const [vencLoading, setVencLoading] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    setFetchError(null);
    try {
      const data = await getClient(id);
      setClient(data);
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Error al cargar el cliente");
    } finally {
      setLoading(false);
    }
  };

  const loadDocs = async () => {
    if (!id) return;
    setDocsLoading(true);
    try {
      const res = await listDocuments({ clientId: id, pageSize: 20, sort: "createdAt:desc" });
      setDocuments(res.documents);
    } catch { /* silently ignore */ } finally {
      setDocsLoading(false);
    }
  };

  const loadExpedientesForClient = async () => {
    if (!id) return;
    setExpsLoading(true);
    try {
      const res = await listExpedientes({ clientId: id, pageSize: 20, sort: "createdAt:desc" });
      setExpedientes(res.expedientes);
    } catch { /* silently ignore */ } finally {
      setExpsLoading(false);
    }
  };

  const loadPortalLinks = async () => {
    if (!id) return;
    try {
      const links = await listClientPortalLinks(id);
      setPortalLinks(links);
    } catch { /* silently ignore */ }
  };

  const loadHonorarios = async () => {
    if (!id) return;
    setHonLoading(true);
    try {
      const res = await listHonorarios({ clientId: id, pageSize: 10, sort: "fechaEmision:desc" });
      setHonorarios(res.honorarios);
    } catch { /* silently ignore */ } finally {
      setHonLoading(false);
    }
  };

  const loadVencimientosForClient = async () => {
    if (!id) return;
    setVencLoading(true);
    try {
      const res = await listVencimientos({ clientId: id, pageSize: 10 });
      setVencimientos(res.items);
    } catch { /* silently ignore */ } finally {
      setVencLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      load();
      loadDocs();
      loadExpedientesForClient();
      loadPortalLinks();
      loadHonorarios();
      loadVencimientosForClient();
    }
  }, [id, isAuthenticated, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?callbackUrl=/clients/${id}`);
    }
  }, [authLoading, isAuthenticated, router, id]);

  const handleSave = async (payload: ClientPayload) => {
    if (!client) return;
    await updateClient(client.id, payload);
    success("Cliente actualizado correctamente");
    await load();
  };

  const handleDelete = async () => {
    if (!client) return;
    setDeleting(true);
    try {
      await deleteClient(client.id);
      success("Cliente archivado correctamente");
      router.push("/clients");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al archivar el cliente");
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleUnarchive = async () => {
    if (!client) return;
    try {
      await unarchiveClient(client.id);
      success("Cliente restaurado correctamente");
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Error al restaurar el cliente");
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (fetchError || !client) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 flex flex-col items-center text-center gap-4 max-w-sm w-full">
          <div className="size-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              {fetchError ? "Error al cargar el cliente" : "Cliente no encontrado"}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {fetchError ?? "Este cliente no existe o fue eliminado."}
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push("/clients")} className="text-sm">
            Volver a clientes
          </Button>
        </div>
      </div>
    );
  }

  const isJuridica = client.type === "persona_juridica";
  const initials = getInitials(client.name);

  // Financial summary values
  const totalMonto = honorarios.reduce((s, h) => s + h.monto, 0);
  const totalCobrado = honorarios.filter((h) => h.estado === "cobrado").reduce((s, h) => s + h.monto, 0);
  const totalPendiente = honorarios
    .filter((h) => h.estado === "presupuestado" || h.estado === "facturado")
    .reduce((s, h) => s + h.monto, 0);
  const fmtMoney = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(1)}M`
      : n >= 1_000
      ? `$${Math.round(n / 1_000)}k`
      : `$${n.toLocaleString("es-AR")}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <TrackVisit
        id={client.id}
        type="client"
        label={client.name}
        sublabel={TYPE_LABELS[client.type]}
        href={`/clients/${client.id}`}
      />

      {/* Header */}
      <ClientHeader
        client={client}
        clientId={id}
        onEdit={() => setFormOpen(true)}
        onArchive={() => setConfirmDelete(true)}
        onUnarchive={handleUnarchive}
      />

      {/* Archived banner */}
      {client.archivedAt && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 md:px-10 py-3">
          <div className="max-w-[960px] mx-auto flex items-center gap-3">
            <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-300">
              Este cliente está archivado desde el{" "}
              <strong>{formatDate(client.archivedAt)}</strong>. No aparece en el listado activo.
            </p>
          </div>
        </div>
      )}

      {/* Financial summary bar */}
      {!honLoading && honorarios.length > 0 && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 px-4 md:px-10 py-3">
          <div className="max-w-[960px] mx-auto flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Resumen financiero
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-sm">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{fmtMoney(totalMonto)}</span>
              </div>
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Cobrado:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{fmtMoney(totalCobrado)}</span>
              </div>
              {totalPendiente > 0 && (
                <>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                    <span className="text-xs text-slate-500 dark:text-slate-400">Pendiente:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{fmtMoney(totalPendiente)}</span>
                  </div>
                </>
              )}
              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Honorarios:</span>
                <span className="font-bold text-slate-700 dark:text-slate-200">{honorarios.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Body */}
      <div className="max-w-[960px] mx-auto px-4 md:px-10 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Left: Avatar + type */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center text-center gap-4">
            <div
              className={cn(
                "size-20 rounded-full flex items-center justify-center text-2xl font-extrabold",
                isJuridica
                  ? "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300"
                  : "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300"
              )}
            >
              {initials || (isJuridica ? <Building2 className="w-8 h-8" /> : <User className="w-8 h-8" />)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">{client.name}</h2>
              <span
                className={cn(
                  "mt-1.5 inline-block text-xs px-2.5 py-1 rounded-full font-semibold",
                  isJuridica
                    ? "bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    : "bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300"
                )}
              >
                {isJuridica
                  ? <Building2 className="w-3 h-3 inline mr-1" />
                  : <User className="w-3 h-3 inline mr-1" />}
                {TYPE_LABELS[client.type]}
              </span>
            </div>

            {client.email && (
              <a
                href={`mailto:${client.email}`}
                className="w-full text-sm text-center py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors truncate px-3"
              >
                <Mail className="w-3.5 h-3.5 inline mr-1.5" />
                {client.email}
              </a>
            )}
            {client.phone && (
              <a
                href={`tel:${client.phone}`}
                className="w-full text-sm text-center py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors px-3"
              >
                <Phone className="w-3.5 h-3.5 inline mr-1.5" />
                {client.phone}
              </a>
            )}
          </div>
        </div>

        {/* Right: Details */}
        <div className="md:col-span-2 space-y-5">

          {/* Identity */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Identificación
            </h3>
            <InfoRow
              icon={Hash}
              label={client.documentType ? `Número de ${client.documentType}` : "Documento"}
              value={
                client.documentType && client.documentNumber
                  ? `${client.documentType}: ${client.documentNumber}`
                  : client.documentNumber
              }
            />
            <InfoRow icon={Calendar} label="Alta" value={formatDate(client.createdAt)} />
            <InfoRow icon={Calendar} label="Última actualización" value={formatDate(client.updatedAt)} />
          </div>

          {/* Contact */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Contacto</h3>
            <InfoRow icon={Mail} label="Email" value={client.email} />
            <InfoRow icon={Phone} label="Teléfono" value={client.phone} />
          </div>

          {/* Address */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Domicilio</h3>
            <InfoRow icon={MapPin} label="Dirección" value={client.address} />
            <InfoRow
              icon={MapPin}
              label="Ciudad / Provincia"
              value={[client.city, client.province].filter(Boolean).join(", ") || null}
            />
          </div>

          {/* Contact person — persona jurídica */}
          {isJuridica &&
            (client.contactPersonName || client.contactPersonRole || client.contactPersonPhone || client.contactPersonEmail) && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
                <div className="flex items-center gap-2 mb-1">
                  <UserCircle className="w-4 h-4 text-slate-400" />
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Persona de contacto
                  </h3>
                </div>
                <InfoRow icon={UserCircle} label="Nombre y apellido" value={client.contactPersonName} />
                <InfoRow icon={UserCircle} label="Cargo / Rol" value={client.contactPersonRole} />
                <InfoRow icon={Phone} label="Teléfono directo" value={client.contactPersonPhone} />
                <InfoRow icon={Mail} label="Email directo" value={client.contactPersonEmail} />
              </div>
            )}

          {/* Notes */}
          {client.notes && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                Notas internas
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {client.notes}
              </p>
            </div>
          )}

          {/* Expedientes */}
          <ClientExpedientesTab
            clientId={id}
            expedientes={expedientes}
            isLoading={expsLoading}
          />

          {/* Documents */}
          <ClientDocumentosTab
            documents={documents}
            isLoading={docsLoading}
          />
        </div>
      </div>

      {/* Honorarios */}
      <div className="max-w-[960px] mx-auto px-4 md:px-10 pb-4">
        <ClientFinanzasTab
          clientId={id}
          honorarios={honorarios}
          isLoading={honLoading}
        />
      </div>

      {/* Vencimientos */}
      <div className="max-w-[960px] mx-auto px-4 md:px-10 pb-4">
        <ClientVencimientosTab
          clientId={id}
          vencimientos={vencimientos}
          isLoading={vencLoading}
        />
      </div>

      {/* Portal del Cliente */}
      <div className="max-w-[960px] mx-auto px-4 md:px-10 pb-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-violet-500" />
              <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Portal del Cliente</h2>
              <span className="text-xs text-slate-400 dark:text-slate-500">— acceso de solo lectura vía link</span>
            </div>
            <Button
              size="sm"
              disabled={portalCreating}
              onClick={async () => {
                setPortalCreating(true);
                try {
                  await createClientPortalLink({
                    clientId: id,
                    showDocuments: true,
                    showHonorarios: false,
                    showMovimientos: true,
                  });
                  success("Link generado. Copialo y enviáselo al cliente.");
                  await loadPortalLinks();
                } catch (e: any) {
                  showError(e?.message ?? "Error al generar link");
                } finally {
                  setPortalCreating(false);
                }
              }}
              className="gap-1.5"
            >
              {portalCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Generar link
            </Button>
          </div>

          <div className="p-5">
            {portalLinks.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No hay links activos. Generá uno para compartir el portal con {client.name}.
              </p>
            ) : (
              <div className="space-y-2">
                {portalLinks.map((link) => (
                  <div
                    key={link.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border text-sm",
                      link.status === "revoked"
                        ? "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 opacity-60"
                        : "border-violet-100 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-900/10"
                    )}
                  >
                    <Globe className={cn("w-4 h-4 flex-shrink-0", link.status === "revoked" ? "text-slate-400" : "text-violet-500")} />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-slate-600 dark:text-slate-400 truncate">
                        {link.tokenMasked}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {link.status === "revoked"
                          ? "Revocado"
                          : `Vence ${new Date(link.expiresAt).toLocaleDateString("es-AR")}`}
                        {link.viewCount > 0 && ` · ${link.viewCount} vista${link.viewCount !== 1 ? "s" : ""}`}
                      </p>
                    </div>
                    {link.status === "active" && (
                      <>
                        <button
                          title="Copiar link"
                          onClick={async () => {
                            await navigator.clipboard.writeText(link.portalUrl);
                            setCopiedId(link.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-600 transition-colors"
                        >
                          {copiedId === link.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <a
                          href={link.portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Ver portal"
                          className="p-1.5 rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 text-violet-600 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          title="Revocar link"
                          onClick={async () => {
                            try {
                              await revokeClientPortalLink(link.id);
                              success("Link revocado");
                              await loadPortalLinks();
                            } catch { showError("Error al revocar"); }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {link.status === "revoked" && (
                      <button
                        title="Eliminar"
                        onClick={async () => {
                          try {
                            await deleteClientPortalLink(link.id);
                            await loadPortalLinks();
                          } catch { showError("Error al eliminar"); }
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form */}
      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSave={handleSave}
        initialData={client}
      />

      {/* Archive Confirm Modal */}
      {confirmDelete && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => !deleting && setConfirmDelete(false)}
            aria-hidden="true"
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="archive-modal-title"
          >
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
              <div className="size-12 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                <Archive className="w-6 h-6 text-amber-500" />
              </div>
              <div className="text-center">
                <h3 id="archive-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                  ¿Archivar cliente?
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  <strong>{client.name}</strong> será archivado y dejará de aparecer en el listado activo.
                  Podés restaurarlo en cualquier momento.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Archivar"}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
