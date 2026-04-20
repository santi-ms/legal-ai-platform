"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Globe, Shield, RefreshCw, CheckCircle2, AlertCircle, Clock,
  Toggle, ChevronRight, Loader2, Eye, EyeOff, Save, Trash2,
  Wifi, WifiOff, Bell, FileText, Swords, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/app/lib/utils";
import {
  getPortalConfig, savePortalConfig, deletePortalConfig, testPortalCredentials,
  triggerPortalSync, getPortalLogs, getPortalExpedientes,
  toggleExpedienteSync, dismissPortalActivity,
  PortalConfig, PortalSyncLog, PortalExpediente,
} from "@/app/lib/webApi";

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

// ─── Credential Form ──────────────────────────────────────────────────────────

function CredentialCard({
  config,
  onSaved,
  onDeleted,
}: {
  config: PortalConfig | null;
  onSaved: () => void;
  onDeleted: () => void;
}) {
  const { success, error: showError, info } = useToast();
  const [username, setUsername] = useState(config?.credential?.username ?? "");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [testing, setTesting]   = useState(false);
  const [delConfirm, setDelConfirm] = useState(false);

  const hasCredential = Boolean(config?.credential);

  async function handleSave() {
    if (!username.trim() || !password.trim()) {
      showError("Completá usuario y contraseña");
      return;
    }
    setSaving(true);
    try {
      await savePortalConfig(username.trim(), password);
      success("Credenciales guardadas");
      setPassword("");
      onSaved();
    } catch (e: any) {
      showError(e?.message ?? "Error al guardar credenciales");
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
      const res = await testPortalCredentials(username.trim(), password);
      if (res.ok) success("✅ Conexión exitosa con el portal MEV Misiones");
      else showError(res.message ?? "Credenciales inválidas");
    } catch (e: any) {
      showError(e?.message ?? "Error al probar conexión");
    } finally {
      setTesting(false);
    }
  }

  async function handleDelete() {
    try {
      await deletePortalConfig();
      success("Credenciales eliminadas");
      setDelConfirm(false);
      onDeleted();
    } catch (e: any) {
      showError(e?.message ?? "Error al eliminar");
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-slate-100">Portal MEV Misiones</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Mesa de Entradas Virtual — Poder Judicial de Misiones</p>
        </div>
        <div className="ml-auto">
          {hasCredential ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Wifi className="w-3 h-3" />
              Configurado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              <WifiOff className="w-3 h-3" />
              Sin configurar
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {hasCredential && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/40 text-sm text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              Usuario configurado: <strong>{config?.credential?.username}</strong>
              {config?.credential?.lastValidAt && (
                <> · Última verificación exitosa: {fmtDate(config.credential.lastValidAt)}</>
              )}
            </span>
          </div>
        )}

        {config?.credential?.lastError && (
          <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/40 text-sm text-red-700 dark:text-red-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>Último error: {config.credential.lastError}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              Usuario MEV
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tu usuario del portal MEV Misiones"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30"
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
              {hasCredential ? "Nueva contraseña (dejá en blanco para no cambiar)" : "Contraseña MEV"}
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={hasCredential ? "••••••••" : "Tu contraseña del portal"}
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

        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleTest}
            disabled={testing || !username || !password}
            variant="outline"
            className="gap-2"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
            Probar conexión
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !username || !password}
            className="gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {hasCredential ? "Actualizar credenciales" : "Guardar credenciales"}
          </Button>
          {hasCredential && (
            <Button
              variant="ghost"
              onClick={() => setDelConfirm(true)}
              className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-auto"
            >
              <Trash2 className="w-4 h-4" />
              Eliminar
            </Button>
          )}
        </div>

        <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Shield className="w-3 h-3" />
          Tu contraseña se cifra con AES-256-GCM y nunca se almacena en texto plano.
        </p>
      </div>

      <ConfirmDialog
        open={delConfirm}
        onOpenChange={setDelConfirm}
        title="Eliminar credenciales"
        description="Se eliminarán las credenciales guardadas del portal MEV. Los expedientes dejarán de sincronizarse."
        confirmLabel="Eliminar"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}

// ─── Sync Panel ───────────────────────────────────────────────────────────────

function SyncPanel({ tenantId, lastSync, hasCredential, onSynced }: {
  tenantId?: string;
  lastSync: PortalConfig["lastSync"];
  hasCredential: boolean;
  onSynced: () => void;
}) {
  const { success, error: showError } = useToast();
  const [syncing, setSyncing] = useState(false);

  async function handleSync() {
    setSyncing(true);
    try {
      await triggerPortalSync();
      success("Sincronización iniciada. Los datos se actualizarán en unos segundos.");
      setTimeout(onSynced, 10_000);
    } catch (e: any) {
      showError(e?.message ?? "Error al iniciar sincronización");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-violet-500" />
            Estado de sincronización
          </h3>
          {lastSync ? (
            <div className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-400">
              <p>
                Último sync:{" "}
                <span className={cn(
                  "font-medium",
                  lastSync.status === "success" ? "text-emerald-600 dark:text-emerald-400" :
                  lastSync.status === "error"   ? "text-red-600 dark:text-red-400" :
                  "text-amber-600 dark:text-amber-400"
                )}>
                  {lastSync.status === "success" ? "✅ Exitoso" :
                   lastSync.status === "error"   ? "❌ Error" : "⏳ En curso"}
                </span>
              </p>
              <p>Fecha: {fmtDate(lastSync.startedAt)}</p>
              {lastSync.status === "success" && (
                <p>
                  {lastSync.expedientesChecked} revisados · {lastSync.expedientesUpdated} actualizados ·{" "}
                  {duration(lastSync.startedAt, lastSync.finishedAt)}
                </p>
              )}
              {lastSync.errorMessage && (
                <p className="text-red-500">{lastSync.errorMessage}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Aún no se realizó ninguna sincronización.
            </p>
          )}
          <p className="text-xs text-slate-400 mt-2">
            Sync automático: todos los días a las 7:00 AM, 1:00 PM y 7:00 PM (hora AR)
          </p>
        </div>
        <Button
          onClick={handleSync}
          disabled={syncing || !hasCredential}
          className="gap-2 flex-shrink-0"
        >
          {syncing
            ? <><Loader2 className="w-4 h-4 animate-spin" />Sincronizando...</>
            : <><RefreshCw className="w-4 h-4" />Sincronizar ahora</>
          }
        </Button>
      </div>
    </div>
  );
}

// ─── Expediente Row ───────────────────────────────────────────────────────────

function ExpedienteRow({ exp, onToggle, onDismiss }: {
  exp: PortalExpediente;
  onToggle: (id: string, enabled: boolean) => void;
  onDismiss: (id: string) => void;
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
          "flex-shrink-0 mt-0.5 w-9 h-5 rounded-full transition-colors relative",
          exp.portalSyncEnabled
            ? "bg-violet-500"
            : "bg-slate-300 dark:bg-slate-600"
        )}
        title={exp.portalSyncEnabled ? "Desactivar sync" : "Activar sync"}
      >
        <span className={cn(
          "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
          exp.portalSyncEnabled ? "translate-x-4" : "translate-x-0.5"
        )} />
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
            {exp.title}
          </span>
          {exp.number && (
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              #{exp.number}
            </span>
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

      {/* Dismiss button */}
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

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            <th className="pb-2 pr-4 font-medium">Fecha</th>
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
                <span className="capitalize">{log.trigger === "manual" ? "Manual" : "Automático"}</span>
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

  const [config, setConfig]         = useState<PortalConfig | null>(null);
  const [expedientes, setExpedientes] = useState<PortalExpediente[]>([]);
  const [logs, setLogs]             = useState<PortalSyncLog[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState<"expedientes" | "logs">("expedientes");

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

  const enabledCount = expedientes.filter((e) => e.portalSyncEnabled).length;
  const newActivityCount = expedientes.filter((e) => e.portalNewActivity).length;

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-500" />
            Portal Judicial
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Sincronización automática con el portal MEV del Poder Judicial de Misiones
          </p>
        </div>
        {newActivityCount > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 text-sm font-semibold">
            <Bell className="w-4 h-4" />
            {newActivityCount} expediente{newActivityCount !== 1 ? "s" : ""} con actividad nueva
          </span>
        )}
      </div>

      {/* ── Credential Card ──────────────────────────────────────────────────── */}
      <CredentialCard
        config={config}
        onSaved={fetchAll}
        onDeleted={() => { fetchAll(); }}
      />

      {/* ── Sync Panel ───────────────────────────────────────────────────────── */}
      <SyncPanel
        lastSync={config?.lastSync ?? null}
        hasCredential={Boolean(config?.credential)}
        onSynced={fetchAll}
      />

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Expedientes totales", value: expedientes.length, icon: FileText, color: "text-slate-500" },
          { label: "Con sync activo",      value: enabledCount,       icon: Wifi,     color: "text-violet-500" },
          { label: "Con actividad nueva",  value: newActivityCount,   icon: Bell,     color: "text-amber-500" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <Icon className={cn("w-5 h-5 mb-2", stat.color)} />
              <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
            </div>
          );
        })}
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
              {tab === "expedientes" ? `Expedientes (${expedientes.length})` : `Historial de sync (${logs.length})`}
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
                    Activá el toggle para cada expediente que querés sincronizar con el portal MEV.
                    El número de expediente debe coincidir con el número en el portal.
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

          {activeTab === "logs" && (
            <LogsTable logs={logs} />
          )}
        </div>
      </div>

    </div>
  );
}
