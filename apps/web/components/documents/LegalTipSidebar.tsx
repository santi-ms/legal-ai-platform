"use client";

import { Info } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface LegalTipSidebarProps {
  tip: string;
  onViewMore?: () => void;
  className?: string;
}

export function LegalTipSidebar({
  tip,
  onViewMore,
  className,
}: LegalTipSidebarProps) {
  return (
    <div
      className={cn(
        "glass-card fixed bottom-8 right-8 hidden xl:flex max-w-xs flex-col gap-3 rounded-xl p-5 shadow-2xl",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-primary/10 pb-3">
        <div className="size-2 rounded-full bg-green-500"></div>
        <span className="text-sm font-bold uppercase tracking-tight">Consejo Legal</span>
      </div>
      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{tip}</p>
      {onViewMore && (
        <button
          onClick={onViewMore}
          className="text-left text-xs font-bold text-primary hover:underline"
        >
          Ver más consejos →
        </button>
      )}
    </div>
  );
}

