"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Globe, Shield, RefreshCw, CheckCircle2, AlertCircle, Clock,
  Loader2, Eye, EyeOff, Save, Trash2, Wifi, WifiOff, Bell,
  FileText, Activity, ChevronDown, ChevronUp, Building2,
  Scale, Landmark, Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/app/lib/utils";
import {
  getPortalConfig, savePortalConfig, deletePortalConfig, testPortalCredentials,
  triggerPortalSync, getPortalLogs, getPortalExpedientes,
  toggleExpedienteSync, dismissPortalActivity,
  PortalConfig, PortalInfo, PortalSyncLog, PortalExpediente,
} from "@/app/lib/webApi";

// ─── Portal metadata ──────────────────────────────────────────────────────────

const PORTAL_META: Record<string, {
  icon: React.ElementType;
  color:    string;
  bg:       string;
  border:   string;
  userLabel: string;
  hint:     string;
}> = {
  justi_misiones: {
    icon: Building2,
    color:  "text-blue-600 dark:text-blue-400",
    bg:     "bg-blue-100 dark:bg-blue-900/30",
    border: "border-blue-200 dark:border-blue-800",
    userLabel: "Usuario MEV / Matrícula",
    hint: "Usá tu usuario del portal JUSTI del Poder Judicial de Misiones (pwa.jusmisiones.gov.ar)",
  },
  iurix_corrientes: {
    icon: Scale,
    color:  "text-teal-600 dark:text-teal-400",
    bg:     "bg-teal-100 dark:bg-teal-900/30",
    border: "border-teal-200 dark:border-teal-800",
    userLabel: "Matrícula CFPC",
    hint: "Matrícula del Colegio de Abogados de Corrientes (iurix.juscorrientes.gov.ar)",
  },
  mev_scba: {
    icon: Landmark,
    color:  "text-violet-600 dark:text-violet-400",
    bg:     "bg-violet-100 dark:bg-violet-900/30",
    border: "border-violet-200 dark:border-violet-800",
    userLabel: "CUIL / CUIT",
    hint: "CUIL/CUIT del abogado con matrícula CPACF o JUBA (mev.scba.gov.ar)",
  },
  pjn: {
    icon: Gavel,
    color:  "text-amber-600 dark:text-amber-400",
    bg:     "bg-amber-100 dark:bg-amber-900/30",
    border: "border-amber-200 dark:border-amber-800",
    userLabel: "Usuario PJN",
    hint: "Credenciales del Portal del Poder Judicial de la Nación (pjn.gov.ar)",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtDateShort(d: string | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function duration(start: string, end: string | null | undefined): string {
  if (!end) return "...";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

// ─── Portal Card ──────────────────────────────────────────────────────────────

function PortalCard({
  portal,
  onRefresh,
}: {
  portal:    PortalInfo;
  onRefresh: () => void;
}) {
  const { success, error: showError } = useToast();
  const meta = PORTAL_META[portal.portalId] ?? PORTAL_META["justi_misiones"];
  const Icon = meta.icon;

  const [expanded, setExpanded]   = useState(false);
  const [username, setUsername]   = useState(portal.credential?.username ?? "");
  const [password, setPassword]   = useState("");
  const [showPass, setShowPass]   = useState(false);
  const [saving, setSaving]       = useState(false);
  const [testing, setTesting]     = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const hasCred = Boolean(portal.credential);
  const ls      = portal.lastSync;

  async function handleSave() {
    if (!username.trim() || !password.trim()) {
      showError("Completá usuario y contraseña");
      return;
    }
    setSaving(true);
    try {
      await savePortalConfig(portal.portalId, username.trim(), password);
      success("Credenciales guardadas");
      setPassword("");
      onRefresh();
    } catch (e: any) {
      showError(e?.message ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    if (!username.trim() || !password.trim()) {
      showError("Completá usuario y contraseña para probar");
      return;
    }
    setTesting(true);
    try {
      const res = await testPortalCredentials(portal.portalId, username.trim(), password);
      if (res.ok) success(`✅ Conexión exitosa con ${portal.label}`);
      else showError(res.message ?? "Credenciales inválidas");
    } catch (e: any) {
      showError(e?.message ?? "Error al probar conexión");
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    try {
      await deletePortalConfig(portal.portalId);
      success("Credenciales eliminadas");
      setDelConfirm(false);
      setUsername("");
      onRefresh();
    } catch (e: any) {
      showError(e?.message ?? "Error al eliminar");
    }
  }

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 rounded-2xl border shadow-sm overflow-hidden transition-all",
      hasCred
        ? `border-slate-200 dark:border-slate-800`
        : "border-dashed border-slate-300 dark:border-slate-700"
    )}>
      {/* ── Card Header (always visible) ──────────────────────────────────── */}
      <button
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", meta.bg)}>
          <Icon className={cn("w-5 h-5", meta.color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{portal.label}</p>
          {ls ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Último sync: {fmtDate(ls.startedAt)}
              {ls.status === "success" && (
                <> · {ls.expedientesUpdated} act.</>
              )}
            </p>
          ) : (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Sin sincronizaciones</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasCred ? (
            <span className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
              ls?.status === "error"
                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
            )}>
              {ls?.status === "error" ? (
                <><AlertCircle className="w-3 h-3" />Error</>
              ) : (
                <><Wifi className="w-3 h-3" />Activo</>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <WifiOff className="w-3 h-3" />
              Sin configurar
            </span>
          )}
          {expanded
            ? <ChevronUp className="w-4 h-4 text-slate-400" />
            : <ChevronDown className="w-4 h-4 text-slate-400" />
          }
        </div>
      </button>

      {/* ── Expanded Body ──────────────────────────────────────────────────── */}
      {expanded && (
        <div className="px-5 pb-5 space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
          {/* Current credential banner */}
          {hasCred && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/40 text-sm text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                Configurado como <strong>{portal.credential!.username}</strong>
                {portal.credential!.lastValidAt && (
                  <> · Verificado {fmtDate(portal.credential!.lastValidAt)}</>
                )}
              </span>
            </div>
          )}

          {/* Last error */}
          {portal.credential?.lastError && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/40 text-sm text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{portal.credential.lastError}</span>
            </div>
          )}

          {/* Last sync info */}
          {ls && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
              <p className="font-medium text-slate-700 dark:text-slate-300">Último sync</p>
              <p>
                Estado:{" "}
                <span className={cn(
                  "font-medium",
                  ls.status === "success" ? "text-emerald-600 dark:text-emerald-400" :
                  ls.status === "error"   ? "text-red-600 dark:text-red-400" :
                  "text-amber-600 dark:text-amber-400"
                )}>
                  {ls.status === "success" ? "Exitoso" : ls.status === "error" ? "Error" : "En curso"}
                </span>
                {" · "}{fmtDate(ls.startedAt)}
                {ls.status === "success" && (
                  <> · {ls.expedientesChecked} revisados · {ls.expedientesUpdated} actualizados · {duration(ls.startedAt, ls.finishedAt)}</>
                )}
              </p>
              {ls.errorMessage && <p className="text-red-500">{ls.errorMessage}</p>}
            </div>
          )}

          {/* Hint */}
          <p className="text-xs text-slate-400 dark:text-slate-500">{meta.hint}</p>

          {/* Form */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                {meta.userLabel}
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={`Tu ${meta.userLabel.toLowerCase()}`}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
                {hasCred ? "Nueva contraseña (dejá en blanco para no cambiar)" : "Contraseña"}
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={hasCred ? "••••••••" : "Tu contraseña del portal"}
                  className="w-full px-3 py-2.5 pr-10 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={handleTest}
              disabled={testing || !username || !password}
              variant="outline"
              className="gap-2"
              size="sm"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
              Probar conexión
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !username || !password}
              className="gap-2"
              size="sm"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {hasCred ? "Actualizar" : "Guardar credenciales"}
            </Button>
            {hasCred && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDelConfirm(true)}
                className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
              </Button>
            )}
          </div>

          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            Contraseña cifrada con AES-256-GCM. Nunca se almacena en texto plano.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={delConfirm}
        onCancel={() => setDelConfirm(false)}
        title="Eliminar credenciales"
        description={`Se eliminarán las credenciales de ${portal.label}. Los expedientes de este portal dejarán de sincronizarse.`}
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── Expediente Row ───────────────────────────────────────────────────────────

function ExpedienteRow({ exp, onToggle, onDismiss }: {
  exp:      PortalExpediente;
  onToggle: (id: string, enabled: boolean) => void;
  onDismiss:(id: string) => void;
}) {
  const [toggling, setToggling] = useState(false);

  async function handleToggle() {
    setToggling(true);
    await onToggle(exp.id, !exp.portalSyncEnabled);
    setToggling(false);
  }

  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-xl border transition-colors",
      exp.portalNewActivity
        ? "border-violet-200 bg-violet-50 dark:border-violet-800 dark:bg-violet-900/10"
        : "border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/30"
    )}>
      {/* Toggle */}
      <button
        onClick={handleToggle}
        disabled={toggling}
        className={cn(
          "flex-shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors relative overflow-hidden",
          exp.portalSyncEnabled ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-600"
        )}
        title={exp.portalSyncEnabled ? "Desactivar sync" : "Activar sync"}
      >
        <span className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          exp.portalSyncEnabled ? "translate-x-4" : "translate-x-0"
        )} />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/expedientes/${exp.id}`}
            className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate hover:text-primary transition-colors"
          >
            {exp.title}
          </Link>
          {exp.number && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">#{exp.number}</span>
          )}
          {exp.portalNewActivity && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400 uppercase">
              Nuevo
            </span>
          )}
        </div>
        {exp.portalSyncEnabled && (
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            {exp.portalLastMovimiento && (
              <p className="truncate">
                <span className="font-medium">Último mov.:</span> {exp.portalLastMovimiento}
                {exp.portalMovimientoAt && <> · {fmtDateShort(exp.portalMovimientoAt)}</>}
              </p>
            )}
            {exp.portalStatus && (
              <p><span className="font-medium">Estado portal:</span> {exp.portalStatus}</p>
            )}
            {exp.portalLastSync && (
              <p><span className="font-medium">Sync:</span> {fmtDate(exp.portalLastSync)}</p>
            )}
          </div>
        )}
      </div>

      {/* Dismiss */}
      {exp.portalNewActivity && (
        <button
          onClick={() => onDismiss(exp.id)}
          className="flex-shrink-0 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
        >
          Marcar visto
        </button>
      )}
    </div>
  );
}

// ─── Logs Table ───────────────────────────────────────────────────────────────

function LogsTable({ logs }: { logs: PortalSyncLog[] }) {
  if (!logs.length) {
    return (
      <p className="text-sm text-slate-400 text-center py-6">
        No hay registros de sincronización todavía.
      </p>
    );
  }

  const PORTAL_LABELS: Record<string, string> = {
    justi_misiones:   "JUSTI Misiones",
    iurix_corrientes: "IURIX Corrientes",
    mev_scba:         "MEV SCBA",
    pjn:              "PJN",
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <th className="pb-2 pr-4 font-medium">Fecha</th>
            <th className="pb-2 pr-4 font-medium">Portal</th>
            <th className="pb-2 pr-4 font-medium">Disparado por</th>
            <th className="pb-2 pr-4 font-medium">Estado</th>
            <th className="pb-2 pr-4 font-medium">Revisados</th>
            <th className="pb-2 pr-4 font-medium">Actualizados</th>
            <th className="pb-2 font-medium">Duración</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {logs.map((log) => (
            <tr key={log.id} className="text-slate-700 dark:text-slate-300">
              <td className="py-2 pr-4 font-mono whitespace-nowrap">{fmtDate(log.startedAt)}</td>
              <td className="py-2 pr-4">
                <span className="font-medium">{PORTAL_LABELS[log.portal] ?? log.portal}</span>
              </td>
              <td className="py-2 pr-4">
                {log.trigger === "manual" ? "Manual" : "Automático"}
              </td>
              <td className="py-2 pr-4">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-medium",
                  log.status === "success" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                  log.status === "error"   ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" :
                  "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                )}>
                  {log.status === "success" ? "Éxito" : log.status === "error" ? "Error" : "En curso"}
                </span>
                {log.errorMessage && (
                  <p className="text-red-500 text-[10px] mt-0.5 max-w-[200px] truncate" title={log.errorMessage}>
                    {log.errorMessage}
                  </p>
                )}
              </td>
              <td className="py-2 pr-4">{log.expedientesChecked}</td>
              <td className="py-2 pr-4">{log.expedientesUpdated}</td>
              <td className="py-2">{duration(log.startedAt, log.finishedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortalPage() {
  const { success, error: showError } = useToast();

  const [config, setConfig]           = useState<PortalConfig | null>(null);
  const [expedientes, setExpedientes] = useState<PortalExpediente[]>([]);
  const [logs, setLogs]               = useState<PortalSyncLog[]>([]);
  const [loading, setLoading]         = useState(true);
  const [syncing, setSyncing]         = useState(false);
  const [activeTab, setActiveTab]     = useState<"expedientes" | "logs">("expedientes");

  const fetchAll = useCallback(async () => {
    try {
      const [cfg, exps, syncLogs] = await Promise.all([
        getPortalConfig(),
        getPortalExpedientes({ pageSize: 50 }),
        getPortalLogs(),
      ]);
      setConfig(cfg);
      setExpedientes(exps.items);
      setLogs(syncLogs);
    } catch (e: any) {
      showError(e?.message ?? "Error al cargar configuración del portal");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function handleSyncAll() {
    setSyncing(true);
    try {
      await triggerPortalSync();
      success("Sincronización iniciada. Los datos se actualizarán en unos segundos.");
      setTimeout(fetchAll, 12_000);
    } catch (e: any) {
      showError(e?.message ?? "Error al iniciar sincronización");
    } finally {
      setSyncing(false);
    }
  }

  async function handleToggle(id: string, enabled: boolean) {
    try {
      await toggleExpedienteSync(id, enabled);
      setExpedientes((prev) =>
        prev.map((e) => e.id === id ? { ...e, portalSyncEnabled: enabled } : e)
      );
    } catch (e: any) {
      showError(e?.message ?? "Error al cambiar sincronización");
    }
  }

  async function handleDismiss(id: string) {
    try {
      await dismissPortalActivity(id);
      setExpedientes((prev) =>
        prev.map((e) => e.id === id ? { ...e, portalNewActivity: false } : e)
      );
    } catch (e: any) {
      showError(e?.message ?? "Error al descartar actividad");
    }
  }

  const configuredCount  = config?.portals.filter((p) => Boolean(p.credential)).length ?? 0;
  const enabledCount     = expedientes.filter((e) => e.portalSyncEnabled).length;
  const newActivityCount = expedientes.filter((e) => e.portalNewActivity).length;
  const hasAnyCred       = configuredCount > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-500" />
            Portales Judiciales
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sincronización automática con los portales del Poder Judicial de Misiones, Corrientes, Buenos Aires y Nación
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {newActivityCount > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-sm font-semibold">
              <Bell className="w-4 h-4" />
              {newActivityCount} expediente{newActivityCount !== 1 ? "s" : ""} con actividad nueva
            </span>
          )}
          <Button
            onClick={handleSyncAll}
            disabled={syncing || !hasAnyCred}
            className="gap-2"
          >
            {syncing
              ? <><Loader2 className="w-4 h-4 animate-spin" />Sincronizando...</>
              : <><RefreshCw className="w-4 h-4" />Sincronizar todos</>
            }
          </Button>
        </div>
      </div>

      {/* ── Info banner: sync schedule ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 text-xs text-blue-700 dark:text-blue-400">
        <Clock className="w-3.5 h-3.5 flex-shrink-0" />
        Sync automático todos los días a las <strong>7:00 AM</strong>, <strong>1:00 PM</strong> y <strong>7:00 PM</strong> (hora Argentina).
        Configurá las credenciales de cada portal para activarlo.
      </div>

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Portales configurados", value: `${configuredCount}/4`,       icon: Globe,     color: "text-blue-500" },
          { label: "Expedientes totales",   value: expedientes.length,            icon: FileText,  color: "text-slate-500" },
          { label: "Con sync activo",        value: enabledCount,                 icon: Wifi,      color: "text-violet-500" },
          { label: "Con actividad nueva",   value: newActivityCount,              icon: Bell,      color: "text-amber-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Portal Cards ─────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
          Credenciales por portal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(config?.portals ?? []).map((portal) => (
            <PortalCard
              key={portal.portalId}
              portal={portal}
              onRefresh={fetchAll}
            />
          ))}
        </div>
      </div>

      {/* ── Tabs: Expedientes / Logs ──────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Tab Bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          {(["expedientes", "logs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-3 text-sm font-medium transition-colors",
                activeTab === tab
                  ? "border-b-2 border-violet-500 text-violet-600 dark:text-violet-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              )}
            >
              {tab === "expedientes"
                ? `Expedientes (${expedientes.length})`
                : `Historial de sync (${logs.length})`
              }
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === "expedientes" && (
            <>
              {expedientes.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">No tenés expedientes cargados.</p>
                  <p className="text-xs mt-1">Agregá expedientes en la sección Expedientes para activar el sync.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                    Activá el toggle para cada expediente que querés sincronizar con el portal.
                    El número de expediente debe coincidir exactamente con el número en el portal judicial.
                  </p>
                  {expedientes.map((exp) => (
                    <ExpedienteRow
                      key={exp.id}
                      exp={exp}
                      onToggle={handleToggle}
                      onDismiss={handleDismiss}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "logs" && <LogsTable logs={logs} />}
        </div>
      </div>

    </div>
  );
}
