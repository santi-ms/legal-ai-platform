"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2, Bot, User } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantSidebarProps {
  documentId?: string;
  documentContent?: string;
  // props legacy — se ignoran pero se mantienen para no romper nada
  readability?: number;
  readabilityFeedback?: string;
  onApplyAll?: () => void;
}

const SUGGESTED_QUESTIONS = [
  "¿Hay alguna cláusula problemática?",
  "Explicame la cláusula de rescisión",
  "¿Qué obligaciones tiene cada parte?",
  "¿Hay riesgos legales en este documento?",
];

export function AIAssistantSidebar({
  documentId,
  documentContent,
}: AIAssistantSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (question: string) => {
    if (!question.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: question.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/_proxy/documents/${documentId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          documentContent,
          history: messages.slice(-10),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.ok) {
        throw new Error(data.message || "Error al consultar el asistente");
      }

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer },
      ]);
    } catch (err: any) {
      setError(err.message || "Error de conexión. Intentá de nuevo.");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <aside className="w-72 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-none">
            Asistente Legal IA
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">Preguntá sobre este documento</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl rounded-tl-sm px-3 py-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Hola! Puedo ayudarte a entender este documento. Haceme cualquier pregunta sobre su contenido.
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                Sugerencias
              </p>
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all duration-150 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={cn("flex gap-2", msg.role === "user" && "flex-row-reverse")}
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                  msg.role === "assistant"
                    ? "bg-primary/10"
                    : "bg-slate-200 dark:bg-slate-700"
                )}
              >
                {msg.role === "assistant" ? (
                  <Bot className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <User className="w-3.5 h-3.5 text-slate-500" />
                )}
              </div>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap",
                  msg.role === "assistant"
                    ? "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm"
                    : "bg-primary text-white rounded-tr-sm"
                )}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl rounded-tl-sm px-3 py-2.5">
              <div className="flex gap-1 items-center">
                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-primary/50 rounded-full animate-bounce" />
              </div>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-500 px-1">{error}</p>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 dark:border-slate-800">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Preguntá sobre el documento..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-slate-400 disabled:opacity-50 max-h-24 overflow-y-auto"
            style={{ minHeight: "36px" }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Enviar pregunta"
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 px-0.5">
          Enter para enviar · No reemplaza asesoramiento legal profesional
        </p>
      </form>
    </aside>
  );
}
