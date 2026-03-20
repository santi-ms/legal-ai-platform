"use client";

/**
 * Chat Document Creation Page
 *
 * Permite generar documentos legales a través de una conversación natural con IA.
 * El asistente hace preguntas, recopila los datos y llama al pipeline de generación
 * existente cuando tiene toda la información necesaria.
 */

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Send,
  Loader2,
  Sparkles,
  CheckCircle2,
  FileText,
  LayoutDashboard,
  RotateCcw,
  MessageSquare,
} from "lucide-react";
// FileText usado en GeneratingStep
import { Button } from "@/components/ui/button";
import { PlainTextDocumentEditor } from "@/src/features/documents/ui/editor/PlainTextDocumentEditor";
import { usePlainTextDocumentEditor } from "@/src/features/documents/ui/editor/usePlainTextDocumentEditor";

// Registrar todos los schemas de documentos
import "@/src/features/documents/schemas/service-contract";
import "@/src/features/documents/schemas/nda";
import "@/src/features/documents/schemas/legal-notice";
import "@/src/features/documents/schemas/lease-agreement";
import "@/src/features/documents/schemas/debt-recognition";
import "@/src/features/documents/schemas/simple-authorization";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step = "chat" | "generating" | "result";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface GenerationResult {
  documentId: string;
  contrato: string;
  pdfUrl?: string | null;
  warnings?: unknown[];
  incompleteDocument?: boolean;
  outputWarnings?: unknown[];
  metadata?: {
    documentType: string;
    templateVersion: string;
    aiModel?: string;
    aiCostUsd?: number;
  };
}

// Mapa de tipos de documentos a labels legibles
const DOC_TYPE_LABELS: Record<string, string> = {
  service_contract: "Contrato de Prestación de Servicios",
  nda: "Acuerdo de Confidencialidad",
  legal_notice: "Carta Documento",
  lease: "Contrato de Locación",
  debt_recognition: "Reconocimiento de Deuda",
  simple_authorization: "Autorización Simple",
};

// Mensaje inicial del asistente
const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content:
    "¡Hola! Soy tu asistente legal. 👋\n\nPodés decirme en tus palabras qué documento necesitás y yo te voy guiando. Por ejemplo:\n\n• \"Necesito un contrato de alquiler\"\n• \"Quiero hacer un NDA con un socio\"\n• \"Necesito intimar a alguien por una deuda\"\n\n¿Qué documento necesitás hoy?",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ChatDocumentCreationPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("chat");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [generatingLabel, setGeneratingLabel] = useState("Generando documento...");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Editor de documento — se activa solo cuando hay resultado.
  // enabled=false mientras no haya resultado para evitar side-effects prematuros.
  const documentEditor = usePlainTextDocumentEditor({
    documentId: result?.documentId ?? null,
    initialContent: result?.contrato ?? "",
    originalContent: result?.contrato ?? "",
    enabled: step === "result" && Boolean(result?.documentId),
  });

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatLoading, step]);

  // Foco automático en el input
  useEffect(() => {
    if (step === "chat") {
      inputRef.current?.focus();
    }
  }, [step]);

  // ─── Llamada al endpoint de chat ────────────────────────────────────────────

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || chatLoading) return;

    const userMessage: Message = { role: "user", content: trimmed };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/_proxy/documents/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await res.json();

      if (!data.ok) {
        throw new Error(data.message || "Error al procesar el mensaje");
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: data.reply || "Entendido, continuemos.",
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Si la IA tiene todos los datos, iniciamos la generación
      if (data.ready && data.extractedData) {
        const docLabel =
          DOC_TYPE_LABELS[data.documentType as string] || "documento";
        setGeneratingLabel(`Generando tu ${docLabel}...`);

        // Pequeña pausa para que el usuario lea el último mensaje del asistente
        setTimeout(() => {
          setStep("generating");
          generateDocument(data.extractedData);
        }, 1200);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Ocurrió un error al procesar tu mensaje. ¿Podés intentarlo de nuevo?",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  }, [input, messages, chatLoading]);

  // ─── Llamada al endpoint de generación ──────────────────────────────────────

  const generateDocument = async (extractedData: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/_proxy/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(extractedData),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Error al generar el documento");
      }

      setResult(data);
      setStep("result");
    } catch (err) {
      // Volvemos al chat con mensaje de error
      setStep("chat");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Tuve un problema al generar el documento: ${err instanceof Error ? err.message : "error desconocido"}. ¿Querés que lo intentemos de nuevo?`,
        },
      ]);
    }
  };

  // ─── Manejo de teclado ───────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Reiniciar conversación ──────────────────────────────────────────────────

  const handleReset = () => {
    setStep("chat");
    setMessages([INITIAL_MESSAGE]);
    setInput("");
    setResult(null);
    setChatLoading(false);
  };

  // ─── Renders condicionales ────────────────────────────────────────────────────

  if (step === "generating") {
    return <GeneratingStep label={generatingLabel} />;
  }

  if (step === "result" && result) {
    return (
      <ResultStep
        result={result}
        documentEditor={documentEditor}
        onNewDocument={handleReset}
        onDashboard={() => router.push("/dashboard")}
        onViewDocument={() =>
          router.push(`/documents/${result.documentId}`)
        }
      />
    );
  }

  return (
    <ChatStep
      messages={messages}
      input={input}
      loading={chatLoading}
      messagesEndRef={messagesEndRef}
      inputRef={inputRef}
      onInputChange={setInput}
      onSend={sendMessage}
      onKeyDown={handleKeyDown}
      onBack={() => router.push("/documents/new")}
    />
  );
}

// ─── Paso: Chat ───────────────────────────────────────────────────────────────

interface ChatStepProps {
  messages: Message[];
  input: string;
  loading: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInputChange: (val: string) => void;
  onSend: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBack: () => void;
}

function ChatStep({
  messages,
  input,
  loading,
  messagesEndRef,
  inputRef,
  onInputChange,
  onSend,
  onKeyDown,
  onBack,
}: ChatStepProps) {
  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="flex items-center gap-4 px-4 md:px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </button>

        <div className="flex items-center gap-3 flex-1">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
              Asistente Legal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Generación por chat · GPT-4o
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            En línea
          </span>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} />
          ))}

          {/* Indicador de escritura */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0 mt-0.5">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-8 py-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Escribí qué documento necesitás... (Enter para enviar)"
              rows={1}
              disabled={loading}
              className="flex-1 bg-transparent resize-none text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none disabled:opacity-50 max-h-32 leading-relaxed"
              style={{ fieldSizing: "content" } as React.CSSProperties}
            />
            <button
              onClick={onSend}
              disabled={!input.trim() || loading}
              className="flex items-center justify-center w-8 h-8 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 dark:text-slate-600 mt-2">
            Shift + Enter para nueva línea · Este asistente no reemplaza asesoramiento legal profesional
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Burbuja de mensaje ───────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-primary text-white rounded-2xl rounded-tr-sm px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0 mt-0.5">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="max-w-[80%] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
          {message.content}
        </p>
      </div>
    </div>
  );
}

// ─── Paso: Generando ──────────────────────────────────────────────────────────

function GeneratingStep({ label }: { label: string }) {
  const steps = [
    { icon: MessageSquare, text: "Procesando información recopilada..." },
    { icon: Sparkles, text: "Redactando con IA..." },
    { icon: FileText, text: "Armando el documento..." },
  ];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Ícono animado */}
        <div className="relative mx-auto w-20 h-20">
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/30">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {label}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Esto toma unos segundos
          </p>
        </div>

        {/* Pasos de progreso */}
        <div className="space-y-3 text-left">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isDone = idx < activeStep;
            const isActive = idx === activeStep;
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-500 ${
                  isDone
                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                    : isActive
                    ? "bg-primary/5 text-primary border border-primary/20"
                    : "text-slate-400 dark:text-slate-600"
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0" />
                ) : isActive ? (
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin" />
                ) : (
                  <Icon className="h-5 w-5 shrink-0 opacity-40" />
                )}
                <span className="text-sm font-medium">{s.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Paso: Resultado ──────────────────────────────────────────────────────────

interface ResultStepProps {
  result: GenerationResult;
  documentEditor: ReturnType<typeof usePlainTextDocumentEditor>;
  onNewDocument: () => void;
  onDashboard: () => void;
  onViewDocument: () => void;
}

function ResultStep({
  result,
  documentEditor,
  onNewDocument,
  onDashboard,
}: ResultStepProps) {
  const docTypeLabel =
    DOC_TYPE_LABELS[result.metadata?.documentType ?? ""] || "Documento";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="px-4 md:px-8 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                {docTypeLabel}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Generado con IA · Podés editarlo antes de descargar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onNewDocument}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <RotateCcw className="h-4 w-4 mr-1.5" />
              Nuevo documento
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDashboard}
              className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              <LayoutDashboard className="h-4 w-4 mr-1.5" />
              Dashboard
            </Button>
          </div>
        </div>
      </header>

      {/* Advertencia si el documento está incompleto */}
      {result.incompleteDocument && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-4 md:px-8 py-3">
          <div className="max-w-5xl mx-auto">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              ⚠️ El documento puede tener campos sin completar. Revisalo antes de descargarlo.
            </p>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 px-4 md:px-8 py-6">
        <div className="max-w-5xl mx-auto">
          <PlainTextDocumentEditor
            content={documentEditor.content}
            originalContent={documentEditor.originalContent}
            isDirty={documentEditor.isDirty}
            isManualSaving={documentEditor.isManualSaving}
            isSaving={documentEditor.isSaving}
            isAutosaveRetrying={documentEditor.isAutosaveRetrying}
            saveStatus={documentEditor.saveStatus}
            saveError={documentEditor.saveError}
            lastSavedAt={documentEditor.lastSavedAt}
            isDownloadingPdf={documentEditor.isDownloadingPdf}
            pdfDownloadError={documentEditor.pdfDownloadError}
            editorRef={documentEditor.editorRef}
            onSave={documentEditor.save}
            onRestoreOriginal={documentEditor.restoreOriginal}
            onDownloadPdf={documentEditor.downloadPdf}
            onDismissPdfDownloadError={documentEditor.dismissPdfDownloadError}
            onEditorInput={documentEditor.handleEditorInput}
            onEditorPaste={documentEditor.handleEditorPaste}
            onEditorDrop={documentEditor.handleEditorDrop}
            onEditorKeyDown={documentEditor.handleEditorKeyDown}
          />
        </div>
      </div>
    </div>
  );
}
