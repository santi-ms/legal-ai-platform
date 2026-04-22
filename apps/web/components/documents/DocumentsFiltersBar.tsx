"use client";

import { useState } from "react";
import { Search, FilterX, Briefcase, ChevronDown, ArrowUpDown, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/app/lib/utils";

interface ExpedienteOption {
  id: string;
  title: string;
  number?: string | null;
}

interface DocumentsFiltersBarProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  documentType?: string;
  onTypeChange?: (type: string) => void;
  status?: string;
  onStatusChange?: (status: string) => void;
  expedienteId?: string;
  onExpedienteChange?: (id: string) => void;
  expedientes?: ExpedienteOption[];
  from?: string;
  to?: string;
  onDateRangeChange?: (from: string | undefined, to: string | undefined) => void;
  sort?: string;
  onSortChange?: (sort: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

const DOCUMENT_TYPES = [
  { value: "all",                       label: "Tipo: Todos" },
  { value: "contrato_servicios",        label: "Contrato de Servicios" },
  { value: "nda",                       label: "Acuerdo de Confidencialidad" },
  { value: "carta_documento",           label: "Carta Documento" },
  { value: "contrato_locacion",         label: "Contrato de Locación" },
  { value: "debt_recognition",          label: "Reconocimiento de Deuda" },
  { value: "simple_authorization",      label: "Poder / Autorización" },
  { value: "legal_notice",              label: "Notificación Legal" },
  { value: "comodato",                  label: "Comodato" },
  { value: "poder_especial",            label: "Poder Especial" },
  { value: "franquicia",                label: "Contrato de Franquicia" },
  { value: "mutuo",                     label: "Mutuo" },
  { value: "cesion_derechos",           label: "Cesión de Derechos" },
  { value: "contrato_trabajo",          label: "Contrato de Trabajo" },
  { value: "convenio_pago",             label: "Convenio de Pago" },
  { value: "demanda",                   label: "Demanda" },
  { value: "recurso_apelacion",         label: "Recurso de Apelación" },
  { value: "memorial",                  label: "Memorial" },
  { value: "escrito_judicial",          label: "Escrito Judicial" },
  { value: "habeas_corpus",             label: "Hábeas Corpus" },
  { value: "medida_cautelar",           label: "Medida Cautelar" },
  { value: "otro",                      label: "Otro" },
];

const STATUS_OPTIONS = [
  { value: "all",           label: "Estado: Todos" },
  { value: "generated",     label: "Generado" },
  { value: "needs_review",  label: "Requiere revisión" },
  { value: "reviewed",      label: "Revisado" },
  { value: "final",         label: "Final" },
  { value: "draft",         label: "Borrador" },
];

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Más recientes primero" },
  { value: "createdAt:asc",  label: "Más antiguos primero" },
];

const SELECT_CLS =
  "appearance-none w-full sm:w-auto pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer outline-none h-10 transition-colors";

const CHEVRON_ICON = (
  <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
  </div>
);

export function DocumentsFiltersBar({
  searchQuery = "",
  onSearchChange,
  documentType = "all",
  onTypeChange,
  status = "all",
  onStatusChange,
  expedienteId = "all",
  onExpedienteChange,
  expedientes = [],
  from,
  to,
  onDateRangeChange,
  sort = "createdAt:desc",
  onSortChange,
  onClearFilters,
  className,
}: DocumentsFiltersBarProps) {
  const [showDateRange, setShowDateRange] = useState(!!(from || to));

  const hasActiveFilters =
    searchQuery ||
    documentType !== "all" ||
    status !== "all" ||
    expedienteId !== "all" ||
    from ||
    to ||
    sort !== "createdAt:desc";

  return (
    <div className={cn(
      "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3",
      className
    )}>
      {/* Row 1: Search + Type + Status + Sort */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        {/* Search — full width en mobile, flex-1 desde sm */}
        <div className="w-full sm:flex-1 sm:min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-9 pr-9 h-10 bg-white dark:bg-slate-900 text-sm"
            placeholder="Buscar por tipo, contenido..."
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Type */}
        <div className="relative w-full sm:w-auto">
          <select
            value={documentType}
            onChange={(e) => onTypeChange?.(e.target.value)}
            className={SELECT_CLS}
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          {CHEVRON_ICON}
        </div>

        {/* Status */}
        <div className="relative w-full sm:w-auto">
          <select
            value={status}
            onChange={(e) => onStatusChange?.(e.target.value)}
            className={SELECT_CLS}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {CHEVRON_ICON}
        </div>

        {/* Sort */}
        <div className="relative w-full sm:w-auto">
          <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none z-10" />
          <select
            value={sort}
            onChange={(e) => onSortChange?.(e.target.value)}
            className={cn(SELECT_CLS, "pl-8")}
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {CHEVRON_ICON}
        </div>
      </div>

      {/* Row 2: Expediente filter + Date range toggle + Clear */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Expediente Filter */}
        {expedientes.length > 0 && (
          <div className="relative w-full sm:w-auto">
            <Briefcase className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none z-10",
              expedienteId !== "all" ? "text-primary" : "text-slate-400"
            )} />
            <select
              value={expedienteId}
              onChange={(e) => onExpedienteChange?.(e.target.value)}
              className={cn(SELECT_CLS, "pl-9", expedienteId !== "all" && "border-primary/40 text-primary")}
            >
              <option value="all">Expediente: Todos</option>
              {expedientes.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.number ? `[${exp.number}] ` : ""}{exp.title}
                </option>
              ))}
            </select>
            {CHEVRON_ICON}
          </div>
        )}

        {/* Date range toggle */}
        <button
          onClick={() => {
            if (showDateRange) {
              setShowDateRange(false);
              onDateRangeChange?.(undefined, undefined);
            } else {
              setShowDateRange(true);
            }
          }}
          className={cn(
            "h-10 px-3 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors",
            (from || to)
              ? "border-primary/40 bg-primary/5 text-primary"
              : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
          )}
        >
          {(from || to) ? (
            <>
              <span className="text-xs">
                {from ? new Date(from).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) : "∞"}
                {" — "}
                {to ? new Date(to).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) : "∞"}
              </span>
              <X className="w-3 h-3" onClick={(e) => { e.stopPropagation(); onDateRangeChange?.(undefined, undefined); setShowDateRange(false); }} />
            </>
          ) : (
            <>
              <span>Rango de fechas</span>
            </>
          )}
        </button>

        {/* Active filter count + clear */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="h-10 px-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <FilterX className="w-3.5 h-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Date range inputs (expanded) */}
      {showDateRange && (
        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
              Desde
            </label>
            <input
              type="date"
              value={from ? from.slice(0, 10) : ""}
              onChange={(e) => onDateRangeChange?.(e.target.value || undefined, to)}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
              Hasta
            </label>
            <input
              type="date"
              value={to ? to.slice(0, 10) : ""}
              onChange={(e) => onDateRangeChange?.(from, e.target.value || undefined)}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
          {(from || to) && (
            <button
              onClick={() => { onDateRangeChange?.(undefined, undefined); setShowDateRange(false); }}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Limpiar fechas
            </button>
          )}
        </div>
      )}
    </div>
  );
}
