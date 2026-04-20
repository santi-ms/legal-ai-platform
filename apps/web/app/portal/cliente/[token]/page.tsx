"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Briefcase, FileText, DollarSign, Phone, Mail, MapPin,
  Clock, CheckCircle2, AlertTriangle, Loader2, Scale,
  Download, ChevronRight, Calendar, Activity, Building2,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/app/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortalData {
  tenant:    { name: string; phone: string | null; address: string | null; logoUrl: string | null };
  abogado:   { firstName: string | null; lastName: string | null; email: string; phone: string | null };
  client:    { id: string; name: string; type: string; email: string | null; phone: string | null; documentType: string | null; documentNumber: string | null };
  message:   string | null;
  expiresAt: string;
  config:    { showDocuments: boolean; showHonorarios: boolean; showMovimientos: boolean };
  expedientes: Array<{
    id: string; number: string | null; title: string; matter: string; status: string;
    court: string | null; judge: string | null; deadline: string | null; openedAt: string;
    portalLastMovimiento: string | null; portalMovimientoAt: string | null;
    portalStatus: string | null; portalLastSync: string | null;
  }>;
  documents: Array<{
    id: string; type: string; createdAt: string; status: string | null; pdfUrl: string | null;
  }>;
  honorarios: Array<{
    id: string; tipo: string; concepto: string; monto: number; moneda: string;
    estado: string; fechaEmision: string; fechaVencimiento: string | null;
  }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MATTER_LABELS: Record<string, string> = {
  civil:           "Civil",
  penal:           "Penal",
  laboral:         "Laboral",
  familia:         "Familia",
  comercial:       "Comercial",
  administrativo:  "Administrativo",
  constitucional:  "Constitucional",
  tributario:      "Tributario",
  otro:            "Otro",
};

const STATUS_CONFIG: Record<string, { label: string; classes: string; icon: any }> = {
  activo:     { label: "En trámite", classes: "bg-emerald-100 text-emerald-700",  icon: CheckCircle2 },
  cerrado:    { label: "Cerrado",    classes: "bg-slate-100 text-slate-600",      icon: CheckCircle2 },
  archivado:  { label: "Archivado",  classes: "bg-slate-100 text-slate-500",      icon: Clock },
  suspendido: { label: "Suspendido", classes: "bg-amber-100 text-amber-700",      icon: AlertTriangle },
};

const DOC_TYPE_LABELS: Record<string, string> = {
  carta_documento:    "Carta Documento",
  contrato_servicios: "Contrato de Servicios",
  poder_notarial:     "Poder Notarial",
  contestacion_demanda:"Contestación de Demanda",
  recurso_apelacion:  "Recurso de Apelación",
  nda:                "Acuerdo de Confidencialidad",
  comodato:           "Contrato de Comodato",
};

const HONORARIO_ESTADO: Record<string, string> = {
  presupuestado: "Presupuestado",
  facturado:     "Facturado",
  cobrado:       "Cobrado",
  cancelado:     "Cancelado",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtMoney(amount: number, moneda: string) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: moneda === "USD" ? "USD" : "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}

function abogadoName(a: PortalData["abogado"]) {
  return [a.firstName, a.lastName].filter(Boolean).join(" ") || a.email;
}

// ─── Error States ─────────────────────────────────────────────────────────────

function ErrorState({ code, message }: { code?: string; message: string }) {
  const icon =
    code === "EXPIRED" ? Clock :
    code === "REVOKED" ? ShieldCheck :
    AlertTriangle;
  const Icon = icon;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center">
          <Icon className="w-8 h-8 text-slate-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            {code === "EXPIRED" ? "Link expirado" :
             code === "REVOKED" ? "Link desactivado" :
             "Link no encontrado"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{message}</p>
        </div>
        <p className="text-xs text-slate-400">
          Si necesitás acceso, contactá a tu abogado para que te envíe un nuevo link.
        </p>
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
          <Scale className="w-3.5 h-3.5" />
          <span>DocuLex — Sistema de Gestión Legal</span>
        </div>
      </div>
    </div>
  );
}

// ─── Expediente Card ──────────────────────────────────────────────────────────

function ExpedienteCard({ exp, showMovimientos }: { exp: PortalData["expedientes"][0]; showMovimientos: boolean }) {
  const cfg = STATUS_CONFIG[exp.status] ?? STATUS_CONFIG.activo;
  const StatusIcon = cfg.icon;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-slate-800 leading-snug">{exp.title}</h3>
            {exp.number && (
              <p className="text-xs text-slate-500 font-mono mt-0.5">Expediente N° {exp.number}</p>
            )}
          </div>
          <span className={cn("flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold", cfg.classes)}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wide">Materia</span>
            <p className="font-medium text-slate-700">{MATTER_LABELS[exp.matter] ?? exp.matter}</p>
          </div>
          {exp.court && (
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Juzgado</span>
              <p className="font-medium text-slate-700 text-sm leading-snug">{exp.court}</p>
            </div>
          )}
          {exp.deadline && (
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wide">Plazo</span>
              <p className="font-medium text-amber-600">{fmtDate(exp.deadline)}</p>
            </div>
          )}
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wide">Iniciado</span>
            <p className="font-medium text-slate-700">{fmtDate(exp.openedAt)}</p>
          </div>
        </div>
      </div>

      {showMovimientos && (exp.portalLastMovimiento || exp.portalStatus) && (
        <div className="px-5 py-3 bg-violet-50 border-t border-violet-100">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-3.5 h-3.5 text-violet-500" />
            <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Último movimiento</span>
          </div>
          {exp.portalLastMovimiento && (
            <p className="text-sm text-slate-700 leading-relaxed">{exp.portalLastMovimiento}</p>
          )}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
            {exp.portalMovimientoAt && <span>{fmtDate(exp.portalMovimientoAt)}</span>}
            {exp.portalStatus && <span>· Estado: {exp.portalStatus}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───��────────────────────────────────────────────────────────────

export default function ClientPortalPage() {
  const params = useParams<{ token: string }>();
  const token  = params?.token;

  const [data, setData]     = useState<PortalData | null>(null);
  const [err, setErr]       = useState<{ code?: string; message: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
    fetch(`${apiUrl}/public/client-portal/${token}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!json.ok) setErr({ code: json.error, message: json.message ?? "Error al cargar el portal." });
        else setData(json.portal);
      })
      .catch(() => setErr({ message: "No se pudo conectar con el servidor." }))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (err || !data) {
    return <ErrorState code={err?.code} message={err?.message ?? "Error desconocido."} />;
  }

  const { tenant, abogado, client, message, expiresAt, config, expedientes, documents, honorarios } = data;
  const totalPendiente = honorarios.reduce((s, h) => s + h.monto, 0);

  return (
    <div className="min-h-screen bg-slate-50">

      {/* ── Top Bar ───────────────────────────────────────────────────────────��� */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-auto rounded" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800 text-sm">{tenant.name}</p>
              <p className="text-xs text-slate-400">Portal del Cliente</p>
            </div>
          </div>
          <span className="text-xs text-slate-400 hidden sm:block">
            Vence: {fmtDate(expiresAt)}
          </span>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Client header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xl flex-shrink-0">
              {client.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{client.name}</h1>
              {client.documentNumber && (
                <p className="text-sm text-slate-500">{client.documentType}: {client.documentNumber}</p>
              )}
            </div>
          </div>

          {message && (
            <div className="mt-4 p-3 rounded-xl bg-violet-50 border border-violet-100">
              <p className="text-sm text-violet-800 leading-relaxed italic">"{message}"</p>
              <p className="text-xs text-violet-500 mt-1">— {abogadoName(abogado)}</p>
            </div>
          )}
        </div>

        {/* Expedientes */}
        {expedientes.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-slate-400" />
              {expedientes.length === 1 ? "Tu expediente" : `Tus expedientes (${expedientes.length})`}
            </h2>
            <div className="space-y-3">
              {expedientes.map((exp) => (
                <ExpedienteCard key={exp.id} exp={exp} showMovimientos={config.showMovimientos} />
              ))}
            </div>
          </section>
        )}

        {/* Documents */}
        {config.showDocuments && documents.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Documentos ({documents.length})
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
              {documents.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {DOC_TYPE_LABELS[doc.type] ?? doc.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-slate-400">{fmtDate(doc.createdAt)}</p>
                  </div>
                  {doc.pdfUrl && (
                    <a
                      href={doc.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Ver PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Honorarios */}
        {config.showHonorarios && honorarios.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              Honorarios pendientes
            </h2>
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {honorarios.map((h) => (
                  <div key={h.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{h.concepto}</p>
                      <p className="text-xs text-slate-400">
                        {HONORARIO_ESTADO[h.estado] ?? h.estado}
                        {h.fechaVencimiento && <> · Vence {fmtDate(h.fechaVencimiento)}</>}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-700 text-sm">
                      {fmtMoney(h.monto, h.moneda)}
                    </span>
                  </div>
                ))}
              </div>
              {honorarios.length > 1 && (
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-100">
                  <span className="text-sm font-semibold text-slate-600">Total pendiente</span>
                  <span className="font-bold text-slate-800">{fmtMoney(totalPendiente, "ARS")}</span>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Contacto */}
        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            Contacto del estudio
          </h2>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center">
                <Scale className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{abogadoName(abogado)}</p>
                <p className="text-xs text-slate-500">{tenant.name}</p>
              </div>
            </div>
            {abogado.email && (
              <a href={`mailto:${abogado.email}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-violet-600 transition-colors">
                <Mail className="w-4 h-4 text-slate-400" />
                {abogado.email}
              </a>
            )}
            {(abogado.phone || tenant.phone) && (
              <a href={`tel:${abogado.phone || tenant.phone}`} className="flex items-center gap-3 text-sm text-slate-600 hover:text-violet-600 transition-colors">
                <Phone className="w-4 h-4 text-slate-400" />
                {abogado.phone || tenant.phone}
              </a>
            )}
            {tenant.address && (
              <div className="flex items-start gap-3 text-sm text-slate-600">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                {tenant.address}
              </div>
            )}
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center space-y-1 pt-2 pb-8">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <Scale className="w-3.5 h-3.5" />
            <span>Powered by <strong>DocuLex</strong> — Sistema de Gestión Legal</span>
          </div>
          <p className="text-xs text-slate-300">Este acceso vence el {fmtDate(expiresAt)}</p>
        </footer>

      </div>
    </div>
  );
}
