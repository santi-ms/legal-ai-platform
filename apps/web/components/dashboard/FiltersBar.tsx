"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { DocumentsParams } from "@/app/lib/webApi";

interface FiltersBarProps {
  filters: DocumentsParams;
  onFiltersChange: (filters: DocumentsParams) => void;
}

const documentTypes = [
  { value: "", label: "Todos los tipos" },
  { value: "contrato_servicios", label: "Contrato de Servicios" },
  { value: "contrato_suministro", label: "Contrato de Suministro" },
  { value: "nda", label: "Acuerdo de Confidencialidad" },
  { value: "carta_documento", label: "Carta Documento" },
  { value: "contrato_locacion", label: "Contrato de Locación" },
];

const sortOptions = [
  { value: "createdAt:desc", label: "Más recientes" },
  { value: "createdAt:asc", label: "Más antiguos" },
];

export function FiltersBar({ filters, onFiltersChange }: FiltersBarProps) {
  const [query, setQuery] = useState(filters.query || "");
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, query: query || undefined, page: 1 });
    }, 400);

    setDebounceTimer(timer);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleReset = () => {
    setQuery("");
    onFiltersChange({
      page: 1,
      pageSize: filters.pageSize || 20,
      sort: "createdAt:desc",
    });
  };

  const hasActiveFilters =
    filters.query ||
    filters.type ||
    filters.jurisdiccion ||
    filters.from ||
    filters.to;

  return (
    <div className="space-y-4 p-4 bg-neutral-900 rounded-lg border border-neutral-800">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Búsqueda */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <Input
            placeholder="Buscar..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Tipo */}
        <Select
          value={filters.type || ""}
          onChange={(e) =>
            onFiltersChange({ ...filters, type: e.target.value || undefined, page: 1 })
          }
          options={documentTypes}
        />

        {/* Jurisdicción */}
        <Input
          placeholder="Jurisdicción"
          value={filters.jurisdiccion || ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              jurisdiccion: e.target.value || undefined,
              page: 1,
            })
          }
        />

        {/* Orden */}
        <Select
          value={filters.sort || "createdAt:desc"}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              sort: e.target.value as "createdAt:asc" | "createdAt:desc",
            })
          }
          options={sortOptions}
        />
      </div>

      {/* Rango de fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="date"
          placeholder="Desde"
          value={filters.from ? filters.from.split("T")[0] : ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              from: e.target.value ? `${e.target.value}T00:00:00Z` : undefined,
              page: 1,
            })
          }
        />
        <Input
          type="date"
          placeholder="Hasta"
          value={filters.to ? filters.to.split("T")[0] : ""}
          onChange={(e) =>
            onFiltersChange({
              ...filters,
              to: e.target.value ? `${e.target.value}T23:59:59Z` : undefined,
              page: 1,
            })
          }
        />
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={handleReset}>
            <X className="w-4 h-4 mr-2" />
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
}
