"use client";

/**
 * VersionHistoryCard — muestra el historial de versiones de un documento
 * y permite comparar dos versiones lado a lado.
 *
 * Features:
 *  - Lista de versiones con estado, fecha y badge de "actual"
 *  - Click en una versión para ver su contenido en un panel lateral
 *  - Botón "Comparar" para ver diff lado a lado entre la versión seleccionada
 *    y la versión actual (word-level diff simple en CSS)
 */

import { useState, useEffect } from "react";
import { History, ChevronDown, ChevronUp, Eye, GitCompare, X, Loader2 } from "lucide-react";
import { getDocumentVersions, type DocumentVersion } from "@/app/lib/webApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  draft:        "Borrador",
  generated:    "Generado",
  needs_review: "Requiere revisión",
  reviewed:     "Revisado",
  final:        "Final",
};

const STATUS_COLOR: Record<string, string> = {
  draft:        "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400",
  generated:    "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  needs_review: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  reviewed:     "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  final:        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
};

/** Word-level diff: returns array of {text, type: "same"|"added"|"removed"} */
function wordDiff(
  oldText: string,
  newText: string
): Array<{ text: string; type: "same" | "added" | "removed" }> {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  // Simple LCS-based diff (greedy)
  const result: Array<{ text: string; type: "same" | "added" | "removed" }> = [];
  let oi = 0, ni = 0;

  while (oi < oldWords.length || ni < newWords.length) {
    if (oi >= oldWords.length) {
      result.push({ text: newWords[ni++]!, type: "added" });
    } else if (ni >= newWords.length) {
      result.push({ text: oldWords[oi++]!, type: "removed" });
    } else if (oldWords[oi] === newWords[ni]) {
      result.push({ text: oldWords[oi]!, type: "same" });
      oi++; ni++;
    } else {
      // Check ahead for match within 3 words
      let foundInNew = -1, foundInOld = -1;
      for (let ahead = 1; ahead <= 3; ahead++) {
        if (ni + ahead < newWords.length && newWords[ni + ahead] === oldWords[oi]) {
          foundInNew = ahead;
          break;
        }
        if (oi + ahead < oldWords.length && oldWords[oi + ahead] === newWords[ni]) {
          foundInOld = ahead;
          break;
        }
      }
      if (foundInNew !== -1) {
        for (let k = 0; k < foundInNew; k++) result.push({ text: newWords[ni++]!, type: "added" });
      } else if (foundInOld !== -1) {
        for (let k = 0; k < foundInOld; k++) result.push({ text: oldWords[oi++]!, type: "removed" });
      } else {
        result.push({ text: oldWords[oi++]!, type: "removed" });
        result.push({ text: newWords[ni++]!, type: "added" });
      }
    }
  }
  return result;
}

// ─── Diff View ────────────────────────────────────────────────────────────────

function DiffView({ baseText, compareText }: { baseText: string; compareText: string }) {
  const diff = wordDiff(baseText, compareText);
  return (
    <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg max-h-[500px] overflow-y-auto">
      {diff.map((chunk, i) => {
        if (chunk.type === "same") {
          return <span key={i}>{chunk.text}</span>;
        }
        if (chunk.type === "added") {
          return (
            <span key={i} className="bg-emerald-200 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 rounded px-0.5">
              {chunk.text}
            </span>
          );
        }
        return (
          <span key={i} className="bg-red-200 dark:bg-red-900/60 text-red-900 dark:text-red-200 rounded px-0.5 line-through opacity-70">
            {chunk.text}
          </span>
        );
      })}
    </div>
  );
}

// ─── Compare Modal ────────────────────────────────────────────────────────────

function CompareModal({
  versionA,
  versionB,
  onClose,
}: {
  versionA: DocumentVersion;
  versionB: DocumentVersion;
  onClose: () => void;
}) {
  const textA = versionA.editedContent ?? versionA.rawText ?? "";
  const textB = versionB.editedContent ?? versionB.rawText ?? "";

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-16 bg-black/50 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl w-full max-w-5xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-primary" />
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Comparación de versiones</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-red-200 dark:bg-red-900/60 inline-block" />
              Eliminado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-200 dark:bg-emerald-900/60 inline-block" />
              Agregado
            </span>
          </div>

          {/* Side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLOR[versionA.status ?? "draft"]}`}>
                  {STATUS_LABEL[versionA.status ?? "draft"]}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(versionA.createdAt).toLocaleString("es-AR")}
                </span>
              </div>
              <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg max-h-[400px] overflow-y-auto border border-slate-200 dark:border-slate-700">
                {textA}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLOR[versionB.status ?? "draft"]}`}>
                  {STATUS_LABEL[versionB.status ?? "draft"]}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(versionB.createdAt).toLocaleString("es-AR")}
                </span>
              </div>
              <div className="font-mono text-xs leading-relaxed whitespace-pre-wrap break-words p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg max-h-[400px] overflow-y-auto border border-slate-200 dark:border-slate-700">
                {textB}
              </div>
            </div>
          </div>

          {/* Inline diff */}
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Vista de cambios (inline)</p>
            <DiffView baseText={textA} compareText={textB} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VersionHistoryCard({ documentId }: { documentId: string }) {
  const [versions, setVersions]         = useState<DocumentVersion[]>([]);
  const [loading, setLoading]           = useState(false);
  const [open, setOpen]                 = useState(false);
  const [previewId, setPreviewId]       = useState<string | null>(null);
  const [compareIds, setCompareIds]     = useState<[string, string] | null>(null);

  useEffect(() => {
    if (!open || versions.length > 0) return;
    setLoading(true);
    getDocumentVersions(documentId)
      .then(setVersions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, documentId, versions.length]);

  const previewVersion = previewId ? versions.find((v) => v.id === previewId) : null;
  const compareVersions =
    compareIds
      ? ([versions.find((v) => v.id === compareIds[0]), versions.find((v) => v.id === compareIds[1])] as [
          DocumentVersion | undefined,
          DocumentVersion | undefined,
        ])
      : null;

  const toggleCompare = (id: string) => {
    setPreviewId(null);
    if (!compareIds) {
      setCompareIds([id, versions[0]!.id]);
    } else {
      setCompareIds(null);
    }
  };

  return (
    <>
      <section className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        {/* Header — click to expand */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Historial de versiones</h2>
          </div>
          {open ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {open && (
          <div className="border-t border-slate-100 dark:border-slate-700/50">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Sin versiones guardadas</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {versions.map((v, i) => {
                  const isLatest = i === 0;
                  const text = v.editedContent ?? v.rawText ?? "";
                  const preview = text.slice(0, 120).replace(/\n+/g, " ").trim();
                  return (
                    <li key={v.id} className="px-5 py-3 flex items-start justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_COLOR[v.status ?? "draft"]}`}>
                            {STATUS_LABEL[v.status ?? "draft"]}
                          </span>
                          {isLatest && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary">
                              Actual
                            </span>
                          )}
                          <span className="text-xs text-slate-400">
                            {new Date(v.createdAt).toLocaleString("es-AR")}
                          </span>
                        </div>
                        {preview && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 font-mono">
                            {preview}…
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => { setPreviewId(previewId === v.id ? null : v.id); setCompareIds(null); }}
                          title="Ver contenido"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {!isLatest && (
                          <button
                            onClick={() => toggleCompare(v.id)}
                            title="Comparar con versión actual"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            <GitCompare className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Inline preview */}
            {previewVersion && (
              <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Contenido de la versión — {new Date(previewVersion.createdAt).toLocaleString("es-AR")}
                  </p>
                  <button
                    onClick={() => setPreviewId(null)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words font-mono p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg max-h-72 overflow-y-auto border border-slate-200 dark:border-slate-700">
                  {previewVersion.editedContent ?? previewVersion.rawText}
                </pre>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Compare modal */}
      {compareVersions && compareVersions[0] && compareVersions[1] && (
        <CompareModal
          versionA={compareVersions[1]}
          versionB={compareVersions[0]}
          onClose={() => setCompareIds(null)}
        />
      )}
    </>
  );
}
