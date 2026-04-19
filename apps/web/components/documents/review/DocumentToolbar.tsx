"use client";

import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  List,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";

interface DocumentToolbarProps {
  onShare?: () => void;
  className?: string;
}

export function DocumentToolbar({ onShare, className }: DocumentToolbarProps) {
  return (
    <div
      className={cn(
        "mx-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between shadow-sm sticky top-0 z-40",
        className
      )}
    >
      <div className="flex gap-1">
        <button
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors"
          aria-label="Negrita"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors"
          aria-label="Cursiva"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors"
          aria-label="Subrayado"
        >
          <Underline className="w-4 h-4" />
        </button>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
        <button
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors"
          aria-label="Alinear izquierda"
        >
          <AlignLeft className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors"
          aria-label="Centrar"
        >
          <AlignCenter className="w-4 h-4" />
        </button>
        <button
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 transition-colors"
          aria-label="Lista"
        >
          <List className="w-4 h-4" />
        </button>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onShare}
          variant="ghost"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          Compartir
        </Button>
      </div>
    </div>
  );
}



