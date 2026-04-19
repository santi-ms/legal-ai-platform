"use client";

import { FileText, Lock, Mail, Home, Receipt, UserCheck } from "lucide-react";
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
  lease: Home,
  debt_recognition: Receipt,
  simple_authorization: UserCheck,
};

export function DocumentTypeCard({ schema, onSelect, className }: DocumentTypeCardProps) {
  const Icon = documentIcons[schema.id] || FileText;

  return (
    <button
      onClick={onSelect}
      className={cn(
        "group relative p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-primary/50 hover:shadow-lg transition-all text-left focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:bg-primary/20 dark:group-hover:bg-primary/30 transition-colors">
            <Icon className="w-6 h-6 text-primary" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-primary transition-colors">
            {schema.label}
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            {schema.description}
          </p>

          {/* Use Cases */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-500 uppercase tracking-wider mb-2">
              CUÁNDO USARLO:
            </p>
            <ul className="space-y-1.5">
              {schema.useCases.slice(0, 2).map((useCase, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
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
