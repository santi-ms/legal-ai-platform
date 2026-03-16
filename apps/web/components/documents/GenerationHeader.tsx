"use client";

import { Gavel, HelpCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface GenerationHeaderProps {
  onCancel?: () => void;
}

export function GenerationHeader({ onCancel }: GenerationHeaderProps) {
  const router = useRouter();

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-6 md:px-10 py-4 bg-white dark:bg-slate-900">
      <div className="flex items-center gap-4">
        <div className="text-primary size-6 flex items-center justify-center">
          <Gavel className="w-8 h-8" />
        </div>
        <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-[-0.015em]">
          LegalTech AR
        </h2>
      </div>
      <div className="flex gap-3">
        <button
          className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Ayuda"
        >
          <HelpCircle className="w-5 h-5" />
        </button>
        <button
          onClick={handleClose}
          className="flex items-center justify-center rounded-lg h-10 w-10 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}


