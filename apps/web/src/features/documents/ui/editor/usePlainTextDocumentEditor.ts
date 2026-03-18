"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type DocumentEditorSaveStatus = "idle" | "saved" | "error";

const AUTOSAVE_RETRY_DELAYS_MS = [1500, 4000] as const;

interface UsePlainTextDocumentEditorOptions {
  documentId?: string | null;
  initialContent: string;
  originalContent: string;
  enabled?: boolean;
  autosaveDebounceMs?: number;
}

function normalizeEditableText(value: string): string {
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/\u200b/g, "")
    .replace(/\n$/, "");
}

function insertTextAtCursor(text: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  range.deleteContents();

  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);

  selection.removeAllRanges();
  selection.addRange(range);
}

function setCursorFromPoint(x: number, y: number): boolean {
  const selection = window.getSelection();
  if (!selection) return false;

  if ("caretPositionFromPoint" in document) {
    const caretPosition = (document as Document & {
      caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    }).caretPositionFromPoint?.(x, y);

    if (caretPosition) {
      const range = document.createRange();
      range.setStart(caretPosition.offsetNode, caretPosition.offset);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return true;
    }
  }

  if ("caretRangeFromPoint" in document) {
    const caretRange = (document as Document & {
      caretRangeFromPoint?: (x: number, y: number) => Range | null;
    }).caretRangeFromPoint?.(x, y);

    if (caretRange) {
      selection.removeAllRanges();
      selection.addRange(caretRange);
      return true;
    }
  }

  return false;
}

function extractPlainTextFromDrop(dataTransfer: DataTransfer): string {
  const plainText = dataTransfer.getData("text/plain");
  if (plainText) return normalizeEditableText(plainText);

  const uriList = dataTransfer.getData("text/uri-list");
  if (uriList) return normalizeEditableText(uriList);

  const html = dataTransfer.getData("text/html");
  if (html) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return normalizeEditableText(doc.body.textContent ?? "");
  }

  if (dataTransfer.files.length > 0) {
    return normalizeEditableText(Array.from(dataTransfer.files).map((file) => file.name).join("\n"));
  }

  return "";
}

export function usePlainTextDocumentEditor({
  documentId,
  initialContent,
  originalContent,
  enabled = true,
  autosaveDebounceMs = 1200,
}: UsePlainTextDocumentEditorOptions) {
  const router = useRouter();

  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutosaveRetrying, setIsAutosaveRetrying] = useState(false);
  const [saveStatus, setSaveStatus] = useState<DocumentEditorSaveStatus>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [pdfDownloadError, setPdfDownloadError] = useState<string | null>(null);
  const [confirmNavigationOpen, setConfirmNavigationOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const lastSyncedEditorContentRef = useRef("");
  const latestIsDirtyRef = useRef(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const historyGuardActiveRef = useRef(false);
  const allowNextHistoryNavigationRef = useRef(false);
  const autosaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveRetryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosaveRetryTokenRef = useRef(0);
  const saveStatusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef(initialContent);
  const lastPersistedContentRef = useRef(initialContent);
  const inFlightSavePromiseRef = useRef<Promise<boolean> | null>(null);

  const clearAutosaveTimeout = useCallback(() => {
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
      autosaveTimeoutRef.current = null;
    }
  }, []);

  const clearAutosaveRetryTimeout = useCallback((invalidateToken: boolean = false) => {
    if (autosaveRetryTimeoutRef.current) {
      clearTimeout(autosaveRetryTimeoutRef.current);
      autosaveRetryTimeoutRef.current = null;
    }

    if (invalidateToken) {
      autosaveRetryTokenRef.current += 1;
    }
  }, []);

  const clearSaveStatusTimeout = useCallback(() => {
    if (saveStatusTimeoutRef.current) {
      clearTimeout(saveStatusTimeoutRef.current);
      saveStatusTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    setContent(initialContent);
    setIsDirty(false);
    setIsSaving(false);
    setIsAutosaveRetrying(false);
    setSaveStatus("idle");
    setSaveError(null);
    setLastSavedAt(null);
    setPdfDownloadError(null);
    latestContentRef.current = initialContent;
    lastPersistedContentRef.current = initialContent;
    lastSyncedEditorContentRef.current = initialContent;

    if (editorRef.current) {
      editorRef.current.textContent = initialContent;

        setIsAutosaveRetrying(false);
    }

    clearAutosaveTimeout();
    clearAutosaveRetryTimeout(true);
    clearSaveStatusTimeout();
  }, [clearAutosaveRetryTimeout, clearAutosaveTimeout, clearSaveStatusTimeout, documentId, initialContent]);

  const performSave = useCallback(async ({
    source,
    retryAttempt = 0,
    retryToken,
    contentSnapshot,
  }: {
    source: "manual" | "autosave";
    retryAttempt?: number;
    retryToken?: number;
    contentSnapshot?: string;
  }): Promise<boolean> => {
    if (!enabled || !documentId) return true;

    clearAutosaveTimeout();

    if (source === "manual") {
      clearAutosaveRetryTimeout(true);
    }

    const effectiveRetryToken = retryToken ?? autosaveRetryTokenRef.current;
    const contentToSave = source === "autosave"
      ? (contentSnapshot ?? latestContentRef.current)
      : latestContentRef.current;

    if (source === "autosave") {
      if (effectiveRetryToken !== autosaveRetryTokenRef.current) return false;
      if (contentToSave !== latestContentRef.current) return false;
    }

    if (inFlightSavePromiseRef.current) {
      const inFlightResult = await inFlightSavePromiseRef.current;
      if (latestContentRef.current === lastPersistedContentRef.current) {
        return inFlightResult;
      }

      if (source === "autosave") {
        if (effectiveRetryToken !== autosaveRetryTokenRef.current) return false;
        if (contentToSave !== latestContentRef.current) return false;
      }
    }

    if (contentToSave === lastPersistedContentRef.current) {
      if (latestContentRef.current === lastPersistedContentRef.current) {
        setIsDirty(false);
      }
      if (source === "autosave") {
        setIsAutosaveRetrying(false);
      }
      return true;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveStatus("idle");
    clearSaveStatusTimeout();

    const savePromise = (async () => {
      try {
        const { saveEditedContent } = await import("@/app/lib/webApi");
        await saveEditedContent(documentId, contentToSave);
        const savedAt = new Date();

        lastPersistedContentRef.current = contentToSave;
        setLastSavedAt(savedAt);
        setIsAutosaveRetrying(false);
        setSaveError(null);

        if (latestContentRef.current === contentToSave) {
          setIsDirty(false);
          setSaveStatus("saved");
          saveStatusTimeoutRef.current = setTimeout(() => {
            setSaveStatus("idle");
          }, 4000);
        } else {
          setIsDirty(true);
          setSaveStatus("idle");
          setIsAutosaveRetrying(true);
        }

        return true;
      } catch (err: any) {
        const canRetryAutosave =
          source === "autosave" &&
          retryAttempt < AUTOSAVE_RETRY_DELAYS_MS.length &&
          effectiveRetryToken === autosaveRetryTokenRef.current &&
          contentToSave === latestContentRef.current;

        if (canRetryAutosave) {
          const nextRetryAttempt = retryAttempt + 1;
          const retryDelay = AUTOSAVE_RETRY_DELAYS_MS[retryAttempt];

          setIsDirty(latestContentRef.current !== lastPersistedContentRef.current);
          setSaveStatus("idle");
          setSaveError(null);

          autosaveRetryTimeoutRef.current = setTimeout(() => {
            autosaveRetryTimeoutRef.current = null;

            if (effectiveRetryToken !== autosaveRetryTokenRef.current) return;
            if (contentToSave !== latestContentRef.current) return;

            void performSave({
              source: "autosave",
              retryAttempt: nextRetryAttempt,
              retryToken: effectiveRetryToken,
              contentSnapshot: contentToSave,
            });
          }, retryDelay);

          return false;
        }

        setIsAutosaveRetrying(false);
        setSaveError(
          source === "autosave"
            ? "No se pudo guardar. Intenta nuevamente."
            : (err?.message || "Error al guardar los cambios"),
        );
        setSaveStatus("error");
        setIsDirty(latestContentRef.current !== lastPersistedContentRef.current);
        return false;
      } finally {
        inFlightSavePromiseRef.current = null;
        setIsSaving(false);
      }
    })();

    inFlightSavePromiseRef.current = savePromise;
    return savePromise;
  }, [clearAutosaveRetryTimeout, clearAutosaveTimeout, clearSaveStatusTimeout, documentId, enabled]);

  const save = useCallback(async (): Promise<boolean> => {
    return performSave({ source: "manual" });
  }, [performSave]);

  useEffect(() => {
    if (!enabled) return;

    const editor = editorRef.current;
    if (!editor) return;
    if (lastSyncedEditorContentRef.current === content) return;

    editor.textContent = content;
    lastSyncedEditorContentRef.current = content;
  }, [content, enabled]);

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  useEffect(() => {
    latestIsDirtyRef.current = isDirty;
  }, [isDirty]);

  const triggerAutosave = useCallback(() => {
    clearAutosaveRetryTimeout(true);
    const retryToken = autosaveRetryTokenRef.current;

    void performSave({
      source: "autosave",
      retryAttempt: 0,
      retryToken,
      contentSnapshot: latestContentRef.current,
    });
  }, [clearAutosaveRetryTimeout, performSave]);

  useEffect(() => {
    if (!enabled || !documentId) {
      clearAutosaveTimeout();
      clearAutosaveRetryTimeout(true);
      return;
    }

    if (!isDirty || isSaving) {
      clearAutosaveTimeout();
      return;
    }

    if (autosaveRetryTimeoutRef.current) {
      clearAutosaveTimeout();
      return;
    }

    if (content === lastPersistedContentRef.current) {
      setIsDirty(false);
      clearAutosaveTimeout();
      return;
    }

    autosaveTimeoutRef.current = setTimeout(() => {
      triggerAutosave();
    }, autosaveDebounceMs);

    return clearAutosaveTimeout;
  }, [
    autosaveDebounceMs,
    clearAutosaveRetryTimeout,
    clearAutosaveTimeout,
    content,
    documentId,
    enabled,
    isDirty,
    isSaving,
    triggerAutosave,
  ]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled, isDirty]);

  useEffect(() => {
    if (!enabled) {
      historyGuardActiveRef.current = false;
      allowNextHistoryNavigationRef.current = false;
      return;
    }

    if (isDirty && !historyGuardActiveRef.current) {
      window.history.pushState(
        {
          ...(window.history.state ?? {}),
          __documentEditorGuard: true,
        },
        "",
        window.location.href,
      );
      historyGuardActiveRef.current = true;
    }

    const handlePopState = () => {
      if (!historyGuardActiveRef.current) return;

      if (allowNextHistoryNavigationRef.current) {
        allowNextHistoryNavigationRef.current = false;
        historyGuardActiveRef.current = false;
        return;
      }

      if (!latestIsDirtyRef.current) {
        historyGuardActiveRef.current = false;
        allowNextHistoryNavigationRef.current = true;
        window.history.back();
        return;
      }

      const confirmed = window.confirm(
        "Hay cambios sin guardar. Si salís ahora, podés perder ediciones recientes. ¿Querés continuar?",
      );

      if (confirmed) {
        historyGuardActiveRef.current = false;
        allowNextHistoryNavigationRef.current = true;
        window.history.back();
        return;
      }

      window.history.pushState(
        {
          ...(window.history.state ?? {}),
          __documentEditorGuard: true,
        },
        "",
        window.location.href,
      );
      historyGuardActiveRef.current = true;
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled, isDirty]);

  useEffect(() => {
    if (!enabled || !isDirty) return;

    const handleDocumentClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      const targetUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (targetUrl.origin !== currentUrl.origin) return;
      if (
        targetUrl.pathname === currentUrl.pathname &&
        targetUrl.search === currentUrl.search &&
        targetUrl.hash === currentUrl.hash
      ) {
        return;
      }

      e.preventDefault();
      pendingNavigationRef.current = () => {
        router.push(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
      };
      setConfirmNavigationOpen(true);
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [enabled, isDirty, router]);

  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, save]);

  useEffect(() => {
    return () => {
      clearAutosaveTimeout();
      clearAutosaveRetryTimeout(true);
      clearSaveStatusTimeout();
    };
  }, [clearAutosaveRetryTimeout, clearAutosaveTimeout, clearSaveStatusTimeout]);

  const requestNavigation = useCallback((navigate: () => void) => {
    if (!enabled || !isDirty) {
      navigate();
      return;
    }

    pendingNavigationRef.current = navigate;
    setConfirmNavigationOpen(true);
  }, [enabled, isDirty]);

  const confirmNavigation = useCallback(() => {
    const pendingNavigation = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setConfirmNavigationOpen(false);
    pendingNavigation?.();
  }, []);

  const cancelNavigation = useCallback(() => {
    pendingNavigationRef.current = null;
    setConfirmNavigationOpen(false);
  }, []);

  const restoreOriginal = useCallback(() => {
    if (!originalContent) return;
    if (!window.confirm("¿Restaurar el texto original generado por IA? Se perderán los cambios realizados.")) return;

    clearSaveStatusTimeout();
    clearAutosaveRetryTimeout(true);
    setContent(originalContent);
    latestContentRef.current = originalContent;
    setIsDirty(originalContent !== lastPersistedContentRef.current);
    setSaveStatus("idle");
    setSaveError(null);
  }, [clearAutosaveRetryTimeout, clearSaveStatusTimeout, originalContent]);

  const downloadPdf = useCallback(async () => {
    if (!enabled || !documentId) return;

    if (isDirty) {
      const saved = await save();
      if (!saved) return;
    }

    setIsDownloadingPdf(true);
    setPdfDownloadError(null);
    try {
      const response = await fetch(`/api/_proxy/documents/${documentId}/pdf`);
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        setPdfDownloadError((json as any).message || "No se pudo generar el PDF.");
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${documentId}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch {
      setPdfDownloadError("Error al descargar el PDF. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setIsDownloadingPdf(false);
    }
  }, [documentId, enabled, isDirty, save]);

  const handleEditorInput = useCallback(() => {
    const nextContent = normalizeEditableText(editorRef.current?.innerText ?? "");
    lastSyncedEditorContentRef.current = nextContent;
    latestContentRef.current = nextContent;
    clearAutosaveRetryTimeout(true);
    setContent((currentContent) => (currentContent === nextContent ? currentContent : nextContent));
    setIsDirty(nextContent !== lastPersistedContentRef.current);
    setSaveStatus("idle");
    setSaveError(null);
    clearSaveStatusTimeout();
  }, [clearAutosaveRetryTimeout, clearSaveStatusTimeout]);

  const handleEditorPaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = normalizeEditableText(e.clipboardData.getData("text/plain"));
    insertTextAtCursor(text);
    handleEditorInput();
  }, [handleEditorInput]);

  const handleEditorDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const text = extractPlainTextFromDrop(e.dataTransfer);
    if (!text) return;

    editorRef.current?.focus();
    setCursorFromPoint(e.clientX, e.clientY);
    insertTextAtCursor(text);
    handleEditorInput();
  }, [handleEditorInput]);

  const handleEditorKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter") return;

    e.preventDefault();
    insertTextAtCursor("\n");
    handleEditorInput();
  }, [handleEditorInput]);

  return {
    content,
    originalContent,
    isDirty,
    isSaving,
    isAutosaveRetrying,
    saveStatus,
    saveError,
    lastSavedAt,
    isDownloadingPdf,
    pdfDownloadError,
    confirmNavigationOpen,
    editorRef,
    save,
    restoreOriginal,
    downloadPdf,
    requestNavigation,
    confirmNavigation,
    cancelNavigation,
    dismissPdfDownloadError: () => setPdfDownloadError(null),
    handleEditorInput,
    handleEditorPaste,
    handleEditorDrop,
    handleEditorKeyDown,
  };
}