"use client";

import { Search, Calendar, FilterX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/app/lib/utils";

interface DocumentsFiltersBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  documentType?: string;
  onTypeChange?: (type: string) => void;
  status?: string;
  onStatusChange?: (status: string) => void;
  onDateFilter?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

// Values must match what is stored in Document.type in the DB.
// New types (debt_recognition, simple_authorization) use their canonical English ID directly.
// Legacy types use the Spanish slug that was stored when they were created.
const documentTypes = [
  { value: "all",                  label: "Tipo: Todos" },
  { value: "contrato_servicios",   label: "Contrato de Servicios" },
  { value: "nda",                  label: "Acuerdo de Confidencialidad" },
  { value: "carta_documento",      label: "Carta Documento" },
  { value: "contrato_locacion",    label: "Contrato de Locación" },
  { value: "debt_recognition",     label: "Reconocimiento de Deuda" },
  { value: "simple_authorization", label: "Poder / Autorización" },
];

const statusOptions = [
  { value: "all",           label: "Estado: Todos" },
  { value: "generated_text", label: "Generado" },
  { value: "needs_review",  label: "Requiere revisión" },
  { value: "PENDIENTE",     label: "Pendiente de firma" },
  { value: "FIRMADO",       label: "Firmado" },
];

export function DocumentsFiltersBar({
  searchQuery = "",
  onSearchChange,
  documentType = "all",
  onTypeChange,
  status = "all",
  onStatusChange,
  onDateFilter,
  onClearFilters,
  className,
}: DocumentsFiltersBarProps) {
  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 mb-6 shadow-sm",
        className
      )}
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              placeholder="Buscar por nombre, cliente o ID de documento..."
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Type Filter */}
          <div className="relative group">
            <select
              value={documentType}
              onChange={(e) => onTypeChange?.(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer outline-none"
            >
              {documentTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Status Filter */}
          <div className="relative group">
            <select
              value={status}
              onChange={(e) => onStatusChange?.(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Date Filter */}
          <Button
            variant="ghost"
            onClick={onDateFilter}
            className="flex items-center gap-2 pl-4 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Calendar className="w-4 h-4 text-slate-400" />
            Fecha
          </Button>

          {/* Clear Filters */}
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="p-2.5 text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              title="Limpiar filtros"
            >
              <FilterX className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


