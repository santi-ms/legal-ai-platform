"use client";

import {
  useState, useRef, useEffect, useCallback,
} from "react";
import { useSession } from "next-auth/react";
import {
  Bot, X, Send, Loader2, Trash2, ChevronDown,
  Sparkles, AlertCircle,
} from "lucide-react";
import { cn } from "@/app/lib/utils";
import { sendAssistantMessage, type AssistantMessage } from "@/app/lib/webApi";

// ─── Storage ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = "doku_messages";
const MAX_STORED  = 30; // mensajes máximos en localStorage

function loadMessages(userId: string): AssistantMessage[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveMessages(userId: string, msgs: AssistantMessage[]) {
  try {
    localStorage.setItem(
      `${STORAGE_KEY}_${userId}`,
      JSON.stringify(msgs.slice(-MAX_STORED))
    );
  } catch {}
}

// ─── Suggested prompts ────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "¿Qué vencimientos tengo esta semana?",
  "¿Qué expedientes están vencidos?",
  "Mostrá mis últimos documentos",
  "¿Cuántos clientes activos tengo?",
];

// ─── Message renderer ─────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: AssistantMessage }) {
  const isUser = msg.role === "user";

  // Render line breaks and simple bold (**text**)
  const lines = msg.content.split("\n");

  return (
    <div className={cn("flex gap-2", isUser && "flex-row-reverse")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-white rounded-tr-sm"
            : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-tl-sm"
        )}
      >
        {lines.map((line, i) => {
          if (!line.trim()) return <div key={i} className="h-1.5" />;
          // **bold** support
          const parts = line.split(/(\*\*[^*]+\*\*)/g);
          return (
            <p key={i}>
              {parts.map((part, j) =>
                part.startsWith("**") && part.endsWith("**")
                  ? <strong key={j}>{part.slice(2, -2)}</strong>
                  : part
              )}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FloatingAssistant() {
  const { data: session, status } = useSession();
  const userId = session?.user?.email ?? "anon"; // email is always available

  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [hasNew, setHasNew]     = useState(false); // unread badge when closed

  const bottomRef  = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);
  const loadedRef  = useRef(false);

  // Load messages from localStorage on mount (client only)
  useEffect(() => {
    if (status === "authenticated" && !loadedRef.current) {
      loadedRef.current = true;
      setMessages(loadMessages(userId));
    }
  }, [status, userId]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Auto-focus textarea when opened
  useEffect(() => {
    if (open) {
      setHasNew(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput("");
    setError(null);

    const userMsg: AssistantMessage = { role: "user", content: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    saveMessages(userId, newMessages);
    setLoading(true);

    try {
      // Send last N messages to avoid huge payloads
      const toSend = newMessages.slice(-20);
      const reply = await sendAssistantMessage(toSend);

      const assistantMsg: AssistantMessage = { role: "assistant", content: reply };
      const withReply = [...newMessages, assistantMsg];
      setMessages(withReply);
      saveMessages(userId, withReply);

      // If panel is closed, show unread badge
      if (!open) setHasNew(true);
    } catch (err: any) {
      setError(err.message ?? "Error al consultar al asistente");
    } finally {
      setLoading(false);
    }
  }, [messages, loading, userId, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    saveMessages(userId, []);
    setError(null);
  };

  // Don't render if not authenticated
  if (status !== "authenticated") return null;

  return (
    <>
      {/* ── Floating button ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-xl",
          "flex items-center justify-center transition-all duration-200",
          open
            ? "bg-slate-700 dark:bg-slate-600 hover:bg-slate-600 dark:hover:bg-slate-500"
            : "bg-primary hover:bg-primary/90"
        )}
        aria-label={open ? "Cerrar Doku" : "Abrir Doku"}
      >
        {open ? (
          <ChevronDown className="w-6 h-6 text-white" />
        ) : (
          <>
            <Bot className="w-6 h-6 text-white" />
            {hasNew && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                1
              </span>
            )}
          </>
        )}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          className={cn(
            "fixed bottom-24 right-6 z-50",
            "w-[360px] sm:w-[400px] max-h-[70vh]",
            "flex flex-col rounded-2xl shadow-2xl overflow-hidden",
            "border border-slate-200 dark:border-slate-700",
            "bg-slate-50 dark:bg-slate-900"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-white flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">Doku</p>
                <p className="text-[10px] text-white/70 leading-tight flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Tu asistente legal IA
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  title="Limpiar historial"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white/80" />
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {messages.length === 0 ? (
              <div className="space-y-4">
                {/* Welcome */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-300 max-w-[82%]">
                    ¡Hola! Soy <strong>Doku</strong>, tu asistente legal IA. Tengo acceso a tus expedientes, clientes y documentos en tiempo real. ¿En qué te puedo ayudar?
                  </div>
                </div>
                {/* Suggestions */}
                <div className="pl-9 flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="text-xs text-primary border border-primary/30 bg-primary/5 rounded-xl px-3 py-1.5 hover:bg-primary/10 transition-colors text-left"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))
            )}

            {/* Loading bubble */}
            {loading && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                </div>
              </div>
            )}

            {/* Error */}
            {error && !loading && (
              <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Preguntá sobre expedientes, clientes..."
                rows={1}
                disabled={loading}
                className={cn(
                  "flex-1 resize-none rounded-xl border border-slate-200 dark:border-slate-700",
                  "bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200",
                  "px-3 py-2.5 placeholder:text-slate-400",
                  "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary",
                  "disabled:opacity-50 max-h-28 overflow-y-auto",
                  "transition-colors"
                )}
                style={{ lineHeight: "1.4" }}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                  "bg-primary text-white transition-all",
                  "hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                )}
                aria-label="Enviar"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
            <p className="text-[10px] text-slate-400 mt-1.5 text-center">
              Enter para enviar · Shift+Enter para nueva línea
            </p>
          </div>
        </div>
      )}
    </>
  );
}
