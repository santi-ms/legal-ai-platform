"use client";

import { useEffect, useState, type React } from "react";
import { AlertTriangle, CheckCircle2, Download, Loader2, RotateCcw, Save } from "lucide-react";
import type { DocumentEditorSaveStatus } from "./usePlainTextDocumentEditor";

function formatLastSavedLabel(lastSavedAt: Date | null, nowMs: number): string | null {
  if (!lastSavedAt) return null;

  const diffSeconds = Math.max(0, Math.floor((nowMs - lastSavedAt.getTime()) / 1000));

  if (diffSeconds < 10) return "Guardado recien";
  if (diffSeconds < 60) return `Ultimo guardado hace ${diffSeconds} s`;

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `Ultimo guardado hace ${diffMinutes} min`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  return `Ultimo guardado hace ${diffHours} h`;
}

function getNextLastSavedUpdateDelay(lastSavedAt: Date | null, nowMs: number): number | null {
  if (!lastSavedAt) return null;

  const diffSeconds = Math.max(0, Math.floor((nowMs - lastSavedAt.getTime()) / 1000));

  if (diffSeconds < 60) {
    return 1000;
  }

  if (diffSeconds < 3600) {
    return 30000;
  }

  return 60000;
}

interface PlainTextDocumentEditorProps {
  content: string;
  originalContent: string;
  isDirty: boolean;
  isManualSaving: boolean;
  isSaving: boolean;
  isAutosaveRetrying: boolean;
  saveStatus: DocumentEditorSaveStatus;
  saveError: string | null;
  lastSavedAt: Date | null;
  isDownloadingPdf: boolean;
  pdfDownloadError: string | null;
  editorRef: React.RefObject<HTMLDivElement | null>;
  onSave: () => void | Promise<boolean>;
  onRestoreOriginal: () => void;
  onDownloadPdf: () => void | Promise<void>;
  onDismissPdfDownloadError: () => void;
  onEditorInput: () => void;
  onEditorPaste: (e: React.ClipboardEvent<HTMLDivElement>) => void;
  onEditorDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onEditorKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

export function PlainTextDocumentEditor({
  content,
  originalContent,
  isDirty,
  isManualSaving,
  isSaving,
  isAutosaveRetrying,
  saveStatus,
  saveError,
  lastSavedAt,
  isDownloadingPdf,
  pdfDownloadError,
  editorRef,
  onSave,
  onRestoreOriginal,
  onDownloadPdf,
  onDismissPdfDownloadError,
  onEditorInput,
  onEditorPaste,
  onEditorDrop,
  onEditorKeyDown,
}: PlainTextDocumentEditorProps) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const delay = getNextLastSavedUpdateDelay(lastSavedAt, nowMs);
    if (!delay) return;

    const timeout = setTimeout(() => {
      setNowMs(Date.now());
    }, delay);

    return () => clearTimeout(timeout);
  }, [lastSavedAt, nowMs]);

  const lastSavedLabel = formatLastSavedLabel(lastSavedAt, nowMs);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Contenido del documento</h2>
          {isAutosaveRetrying && !isSaving && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-2 py-0.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Reintentando
            </span>
          )}
          {isSaving && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full px-2 py-0.5">
              <Loader2 className="h-3 w-3 animate-spin" /> {isAutosaveRetrying ? "Reintentando" : "Guardando"}
            </span>
          )}
          {isDirty && (
            <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-full px-2 py-0.5">
              Sin guardar
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-full px-2 py-0.5">
              <CheckCircle2 className="h-3 w-3" /> Guardado
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {originalContent && content !== originalContent && (
            <button
              type="button"
              onClick={onRestoreOriginal}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar original
            </button>
          )}
          <button
            type="button"
            onClick={onSave}
            disabled={isManualSaving || isDownloadingPdf || !isDirty}
            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-3.5 w-3.5" />
            {isManualSaving ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={onDownloadPdf}
            disabled={isDownloadingPdf || isManualSaving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary hover:bg-primary/90 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Download className="h-3.5 w-3.5" />
            {isDownloadingPdf ? "Generando PDF…" : "Descargar PDF"}
          </button>
        </div>
      </div>

      {saveStatus === "error" && saveError && (
        <div className="flex items-center gap-2 px-6 py-2.5 bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {saveError}
        </div>
      )}

      {pdfDownloadError && (
        <div className="flex items-center justify-between gap-2 px-6 py-2.5 bg-red-50 dark:bg-red-950/30 border-b border-red-100 dark:border-red-900/50 text-sm text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {pdfDownloadError}
          </div>
          <button type="button" onClick={onDismissPdfDownloadError} className="text-xs underline shrink-0">
            Cerrar
          </button>
        </div>
      )}

      <div className="overflow-y-auto max-h-[72vh] bg-slate-100 dark:bg-slate-800/40 px-6 py-8">
        <div className="mx-auto max-w-[760px] bg-white dark:bg-slate-900 rounded shadow-md border border-slate-200/70 dark:border-slate-700/50">
          <div className="border-b border-slate-100 dark:border-slate-800 px-10 py-4 bg-[linear-gradient(180deg,rgba(248,250,252,0.95),rgba(255,255,255,0))] dark:bg-none">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
              Documento editable
            </p>
          </div>
          <div className="relative px-10 py-10">
            {content.length === 0 && (
              <p className="pointer-events-none absolute left-10 top-10 text-[15px] italic text-slate-300 dark:text-slate-600">
                El contenido del documento aparecerá aqui...
              </p>
            )}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              role="textbox"
              aria-label="Contenido del documento"
              aria-multiline="true"
              spellCheck
              onKeyDown={onEditorKeyDown}
              onInput={onEditorInput}
              onBlur={onEditorInput}
              onPaste={onEditorPaste}
              onDrop={onEditorDrop}
              onDragOver={(e) => e.preventDefault()}
              className="min-h-[55vh] whitespace-pre-wrap break-words text-[15px] leading-[1.9] text-slate-800 dark:text-slate-200 focus:outline-none"
              style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-6 py-3 border-t-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex flex-col gap-1">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {isAutosaveRetrying ? (
              "Reintentando guardado..."
            ) : isSaving ? (
              "Guardando cambios automaticamente..."
            ) : saveStatus === "error" ? (
              "No se pudo guardar. Intenta nuevamente."
            ) : saveStatus === "saved" ? (
              "Cambios guardados automaticamente."
            ) : isDirty ? (
              <>
                Cambios sin guardar {"-"}{" "}
                <kbd className="px-1 py-px rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                  Ctrl+S
                </kbd>
                {" "}para guardar, o descarga el PDF para guardar y descargar en un paso.
              </>
            ) : (
              "El PDF se generara usando este contenido."
            )}
          </p>
          {lastSavedLabel && !isSaving && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
              {lastSavedLabel}
            </p>
          )}
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 tabular-nums shrink-0">
          {content.length.toLocaleString("es-AR")} car.
        </p>
      </div>
    </div>
  );
}