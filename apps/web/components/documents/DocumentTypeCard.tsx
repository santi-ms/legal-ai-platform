"use client";

import { FileText, Lock, Mail } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { DocumentSchemaDefinition } from "@/src/features/documents/core/types";

interface DocumentTypeCardProps {
  schema: DocumentSchemaDefinition;
  onSelect: () => void;
  className?: string;
}

const documentIcons: Record<string, typeof FileText> = {
  service_contract: FileText,
  nda: Lock,
  legal_notice: Mail,
};

export function DocumentTypeCard({ schema, onSelect, className }: DocumentTypeCardProps) {
  const Icon = documentIcons[schema.id] || FileText;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative p-6 rounded-xl border border-slate-700 bg-slate-900/50 hover:bg-slate-800/50 hover:border-primary/50 transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-slate-900",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors">
            {schema.label}
          </h3>
          <p className="text-sm text-slate-400 mb-4 leading-relaxed">
            {schema.description}
          </p>

          {/* Use Cases */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Cuándo usarlo:
            </p>
            <ul className="space-y-1.5">
              {schema.useCases.slice(0, 2).map((useCase, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-primary mt-1">•</span>
                  <span>{useCase}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </button>
  );
}

