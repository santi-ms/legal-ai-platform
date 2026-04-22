"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Link2, Copy, Check, Trash2, Eye, Clock, Loader2, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  createDocumentShare,
  listDocumentShares,
  revokeDocumentShare,
  type DocumentShareLink,
} from "@/app/lib/webApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ share }: { share: DocumentShareLink }) {
  if (share.status === "revoked") {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
        Revocado
      </span>
    );
  }
  if (share.isExpired) {
    return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
        Expirado
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
      Activo
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ShareModal({
  documentId,
  onClose,
}: {
  documentId: string;
  onClose: () => void;
}) {
  const [shares, setShares]         = useState<DocumentShareLink[]>([]);
  const [loading, setLoading]       = useState(true);
  const [creating, setCreating]     = useState(false);
  const [revoking, setRevoking]     = useState<string | null>(null);
  const [copiedId, setCopiedId]     = useState<string | null>(null);
  const [expiresInDays, setExpires] = useState(7);
  const [error, setError]           = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listDocumentShares(documentId);
      setShares(list);
    } catch {
      setError("No se pudieron cargar los links.");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => { load(); }, [load]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const share = await createDocumentShare(documentId, expiresInDays);
      setShares((prev) => [share, ...prev]);
    } catch {
      setError("No se pudo crear el link. Intentá de nuevo.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(shareId: string) {
    setRevoking(shareId);
    try {
      await revokeDocumentShare(shareId);
      setShares((prev) =>
        prev.map((s) => (s.id === shareId ? { ...s, status: "revoked" as const } : s))
      );
    } catch {
      setError("No se pudo revocar el link.");
    } finally {
      setRevoking(null);
    }
  }

  async function handleCopy(share: DocumentShareLink) {
    await navigator.clipboard.writeText(share.shareUrl);
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const activeShares = shares.filter((s) => s.status === "active" && !s.isExpired);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-lg flex flex-col max-h-[92dvh] sm:max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">Compartir documento</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generá un link temporal para que tu cliente pueda ver el documento
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Create new link */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Nuevo link</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  Vigencia
                </label>
                <select
                  value={expiresInDays}
                  onChange={(e) => setExpires(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value={1}>1 día</option>
                  <option value={3}>3 días</option>
                  <option value={7}>7 días</option>
                  <option value={14}>14 días</option>
                  <option value={30}>30 días</option>
                </select>
              </div>
              <div className="pt-5">
                <Button
                  size="sm"
                  onClick={handleCreate}
                  disabled={creating}
                  className="bg-primary text-white hover:bg-primary/90 font-semibold"
                >
                  {creating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-1.5" />
                      Generar link
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Links list */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Links generados
                {activeShares.length > 0 && (
                  <span className="ml-2 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {activeShares.length} activo{activeShares.length > 1 ? "s" : ""}
                  </span>
                )}
              </p>
              <button
                onClick={load}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Actualizar lista"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : shares.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-6">
                No hay links generados todavía.
              </p>
            ) : (
              <div className="space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-3"
                  >
                    <div className="flex-1 min-w-0">
                      {/* URL */}
                      <p className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate mb-1.5">
                        {share.shareUrl}
                      </p>
                      {/* Meta */}
                      <div className="flex items-center gap-3 flex-wrap">
                        <StatusBadge share={share} />
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Clock className="w-2.5 h-2.5" />
                          Vence {formatDate(share.expiresAt)}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Eye className="w-2.5 h-2.5" />
                          {share.viewCount} {share.viewCount === 1 ? "vista" : "vistas"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {share.status === "active" && !share.isExpired && (
                        <>
                          <button
                            onClick={() => handleCopy(share)}
                            title="Copiar link"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            {copiedId === share.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleRevoke(share.id)}
                            disabled={revoking === share.id}
                            title="Revocar link"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
                          >
                            {revoking === share.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 dark:border-slate-700 flex-shrink-0">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            El destinatario puede ver y descargar el PDF sin crear una cuenta.
          </p>
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}
