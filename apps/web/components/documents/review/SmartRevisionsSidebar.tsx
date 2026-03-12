"use client";

import { useState } from "react";
import { Brain, Send } from "lucide-react";
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

interface SmartRevisionsSidebarProps {
  suggestedChanges?: SuggestedChange[];
  comments?: Comment[];
  onApplyChange?: (changeId: string) => void;
  onIgnoreChange?: (changeId: string) => void;
  onAskAI?: (question: string) => void;
  className?: string;
}

export function SmartRevisionsSidebar({
  suggestedChanges = [],
  comments = [],
  onApplyChange,
  onIgnoreChange,
  onAskAI,
  className,
}: SmartRevisionsSidebarProps) {
  const [aiQuestion, setAiQuestion] = useState("");

  const handleSendQuestion = () => {
    if (aiQuestion.trim() && onAskAI) {
      onAskAI(aiQuestion);
      setAiQuestion("");
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
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:ring-2 focus:ring-primary focus:border-transparent resize-none h-20 outline-none transition-all dark:text-white dark:placeholder-slate-500"
              placeholder="Pregunta a la IA sobre el texto..."
            />
            <button
              onClick={handleSendQuestion}
              className="absolute bottom-2 right-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              aria-label="Enviar pregunta"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

