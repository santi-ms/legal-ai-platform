"use client";

import { useState } from "react";
import { Sparkles, MessageSquare, History, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

type AssistantTab = "suggestions" | "comments" | "history" | "settings";

interface AIAssistantSidebarProps {
  readability?: number;
  readabilityFeedback?: string;
  onApplyAll?: () => void;
}

export function AIAssistantSidebar({
  readability = 85,
  readabilityFeedback = "Tu texto es claro y profesional. Considera simplificar el segundo párrafo.",
  onApplyAll,
}: AIAssistantSidebarProps) {
  const [activeTab, setActiveTab] = useState<AssistantTab>("suggestions");

  const tabs = [
    { id: "suggestions" as AssistantTab, label: "Sugerencias Pro", icon: Sparkles },
    { id: "comments" as AssistantTab, label: "Comentarios", icon: MessageSquare },
    { id: "history" as AssistantTab, label: "Historial", icon: History },
    { id: "settings" as AssistantTab, label: "Ajustes", icon: Settings },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col p-4 gap-6 shrink-0">
      <div className="flex flex-col gap-1">
        <h1 className="text-slate-900 dark:text-white text-base font-bold">Asistente AI</h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs">Mejora tu redacción al instante</p>
      </div>

      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium text-sm text-left transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center px-1">
            <p className="text-slate-900 dark:text-slate-100 text-xs font-semibold">Legibilidad AI</p>
            <p className="text-primary text-xs font-bold">{readability}%</p>
          </div>
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${readability}%` }}
            ></div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-[10px] italic">
            "{readabilityFeedback}"
          </p>
        </div>
        {onApplyAll && (
          <Button
            onClick={onApplyAll}
            className="w-full mt-4 flex items-center justify-center rounded-lg h-10 px-4 bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-colors"
          >
            Aplicar Todo
          </Button>
        )}
      </div>
    </aside>
  );
}



