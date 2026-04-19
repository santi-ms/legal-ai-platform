"use client";

import { Search, Filter, X } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

interface SearchFilterProps {
  onSearch: (query: string) => void;
  onFilter: (filters: Record<string, string>) => void;
  searchPlaceholder?: string;
  filterOptions?: {
    label: string;
    field: string;
    options: FilterOption[];
  }[];
  className?: string;
}

export function SearchFilter({
  onSearch,
  onFilter,
  searchPlaceholder = "Buscar...",
  filterOptions = [],
  className,
}: SearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleFilterChange = (field: string, value: string) => {
    const newFilters = { ...activeFilters, [field]: value };
    // Si el valor está vacío, removemos el filtro
    if (!value) {
      delete newFilters[field];
    }
    setActiveFilters(newFilters);
    onFilter(newFilters);
  };

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    onFilter({});
    onSearch("");
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-neutral-700 bg-neutral-800 text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearchChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Toggle */}
      {filterOptions.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
              showFilters || hasActiveFilters
                ? "border-emerald-500 bg-emerald-600/10 text-emerald-400"
                : "border-neutral-700 bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filtros</span>
            {hasActiveFilters && (
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-xs font-semibold text-black">
                {Object.keys(activeFilters).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700 transition-all text-sm"
            >
              <X className="w-3.5 h-3.5" />
              Limpiar
            </button>
          )}
        </div>
      )}

      {/* Filter Options */}
      {showFilters && filterOptions.length > 0 && (
        <div className="rounded-lg border border-neutral-700 bg-neutral-800 p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
          {filterOptions.map((filter) => (
            <div key={filter.field}>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                {filter.label}
              </label>
              <select
                value={activeFilters[filter.field] || ""}
                onChange={(e) => handleFilterChange(filter.field, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-700 bg-neutral-900 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              >
                <option value="">Todos</option>
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

