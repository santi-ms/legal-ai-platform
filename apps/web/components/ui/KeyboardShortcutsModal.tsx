"use client";

import { useEffect } from "react";
import { Keyboard, X } from "lucide-react";

interface Shortcut {
  keys: string[];
  description: string;
}

const SHORTCUTS: { category: string; items: Shortcut[] }[] = [
  {
    category: "Documentos",
    items: [
      { keys: ["N"], description: "Crear nuevo documento" },
    ],
  },
  {
    category: "Navegación",
    items: [
      { keys: ["G", "D"], description: "Ir al panel de control" },
      { keys: ["G", "L"], description: "Ir a mis documentos" },
      { keys: ["G", "C"], description: "Ir a clientes" },
      { keys: ["G", "E"], description: "Ir a expedientes" },
      { keys: ["G", "S"], description: "Ir a ajustes" },
    ],
  },
  {
    category: "Interfaz",
    items: [
      { keys: ["Ctrl", "K"], description: "Búsqueda global" },
      { keys: ["?"],         description: "Ver atajos de teclado" },
      { keys: ["Esc"],       description: "Cerrar modal o panel" },
    ],
  },
];

interface KeyboardShortcutsModalProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ open, onClose }: KeyboardShortcutsModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-slate-900 dark:text-white">Atajos de Teclado</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 space-y-5">
          {SHORTCUTS.map((group) => (
            <div key={group.category}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                {group.category}
              </h3>
              <div className="space-y-1">
                {group.items.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {s.description}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-4">
                      {s.keys.map((k, j) => (
                        <span
                          key={j}
                          className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 shadow-sm"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <div className="px-5 pb-5">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center bg-slate-50 dark:bg-slate-800/50 rounded-lg px-3 py-2">
            Los atajos no se activan cuando estás escribiendo en un campo de texto.
          </p>
        </div>
      </div>
    </div>
  );
}
