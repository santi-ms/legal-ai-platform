"use client";

import { useState } from "react";
import { Brain, Send, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

interface SuggestedChange {
  id: string;
  section: string;
  original: string;
  suggested: string;
  explanation: string;
}

interface Comment {
  id: string;
  author: string;
  avatar?: string;
  content: string;
  timeAgo: string;
}

interface AIAnswer {
  question: string;
  answer: string;
}

interface SmartRevisionsSidebarProps {
  suggestedChanges?: SuggestedChange[];
  comments?: Comment[];
  loadingRevisions?: boolean;
  onApplyChange?: (changeId: string) => void;
  onIgnoreChange?: (changeId: string) => void;
  onAskAI?: (question: string) => Promise<string>;
  className?: string;
}

export function SmartRevisionsSidebar({
  suggestedChanges = [],
  comments = [],
  loadingRevisions = false,
  onApplyChange,
  onIgnoreChange,
  onAskAI,
  className,
}: SmartRevisionsSidebarProps) {
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswers, setAiAnswers] = useState<AIAnswer[]>([]);
  const [isAsking, setIsAsking] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);

  const handleSendQuestion = async () => {
    if (!aiQuestion.trim() || !onAskAI) return;
    const question = aiQuestion.trim();
    setAiQuestion("");
    setAskError(null);
    setIsAsking(true);
    try {
      const answer = await onAskAI(question);
      setAiAnswers((prev) => [{ question, answer }, ...prev]);
    } catch (err: any) {
      setAskError(err?.message || "Error al procesar la pregunta");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <aside
      className={cn(
        "w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col hidden xl:flex",
        className
      )}
    >
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-bold text-slate-900 dark:text-white">Revisiones Inteligentes</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Answers */}
        {aiAnswers.map((item, idx) => (
          <div
            key={idx}
            className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800"
          >
            <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-2">
              Tu pregunta
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 mb-3 italic">{item.question}</p>
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">
              Respuesta IA
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{item.answer}</p>
          </div>
        ))}

        {/* Loading state */}
        {isAsking && (
          <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Consultando a la IA...</span>
          </div>
        )}

        {/* Error */}
        {askError && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-400">{askError}</p>
          </div>
        )}

        {/* Loading revisions */}
        {loadingRevisions && (
          <div className="flex items-center gap-2 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Analizando documento con IA...</span>
          </div>
        )}

        {/* Empty state when done and no suggestions */}
        {!loadingRevisions && suggestedChanges.length === 0 && aiAnswers.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Brain className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
              Sin sugerencias pendientes.<br />Usá el campo de abajo para consultar sobre el documento.
            </p>
          </div>
        )}

        {/* Suggested Changes */}
        {suggestedChanges.map((change) => (
          <div
            key={change.id}
            className="bg-background-light dark:bg-slate-800/50 p-4 rounded-xl border border-primary/20"
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-5 h-5 text-primary" />
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Cambio sugerido
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              En el apartado de "{change.section}":
            </p>
            <div className="text-sm bg-white dark:bg-slate-900 p-2 rounded border border-slate-100 dark:border-slate-800 mb-2">
              <span className="text-red-500 line-through">{change.original}</span>
              <span className="text-green-600 dark:text-green-400 font-medium ml-2">
                {change.suggested}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              {change.explanation}
            </p>
            <div className="flex gap-2">
              {onApplyChange && (
                <Button
                  onClick={() => onApplyChange(change.id)}
                  size="sm"
                  className="flex-1 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg shadow-sm h-auto"
                >
                  Aplicar
                </Button>
              )}
              {onIgnoreChange && (
                <Button
                  onClick={() => onIgnoreChange(change.id)}
                  variant="ghost"
                  size="sm"
                  className="flex-1 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-[10px] font-bold rounded-lg h-auto"
                >
                  Ignorar
                </Button>
              )}
            </div>
          </div>
        ))}

        {/* Comments */}
        {comments.map((comment) => (
          <div
            key={comment.id}
            className="p-4 rounded-xl border border-slate-100 dark:border-slate-800"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="size-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 font-semibold text-xs">
                {comment.avatar ? (
                  <img
                    src={comment.avatar}
                    alt={comment.author}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  comment.author.charAt(0)
                )}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {comment.author}
              </span>
              <span className="text-[10px] text-slate-400 ml-auto">{comment.timeAgo}</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">{comment.content}</p>
          </div>
        ))}
      </div>

      {/* AI Quick Prompt */}
      {onAskAI && (
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-wider font-semibold">
            Preguntá sobre el documento
          </p>
          <div className="relative">
            <textarea
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendQuestion();
                }
              }}
              disabled={isAsking}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 pr-10 text-xs focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-20 outline-none transition-all dark:text-white dark:placeholder-slate-500 disabled:opacity-60"
              placeholder="Ej: ¿Cuál es el plazo del contrato? ¿Qué obligaciones tiene el locatario?"
            />
            <button
              onClick={handleSendQuestion}
              disabled={isAsking || !aiQuestion.trim()}
              className="absolute bottom-2 right-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Enviar pregunta"
            >
              {isAsking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5">
            Enter para enviar · Shift+Enter para nueva línea
          </p>
        </div>
      )}
    </aside>
  );
}



