"use client";

import React from "react";

/**
 * FinanceSummaryWidget — Muestra un resumen financiero mensual con tendencia.
 * Obtiene los datos de /stats/overview y muestra:
 * - Total cobrado este mes
 * - % de cambio vs el mes anterior
 * - Mini sparkline de los últimos 3 meses
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, TrendingUp, TrendingDown, ArrowRight, Minus } from "lucide-react";
import { getStatsOverview, type StatsOverview } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtARS(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${Math.round(n / 1_000)}k`;
  return `$${Math.round(n).toLocaleString("es-AR")}`;
}

function pctChange(current: number, prev: number): number | null {
  if (prev === 0 && current === 0) return null;
  if (prev === 0) return 100;
  return Math.round(((current - prev) / prev) * 100);
}

// ─── Mini Sparkline (pure CSS bars) ─────────────────────────────────────────

function Sparkline({ values, color = "bg-emerald-400" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {values.map((v, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 rounded-t-sm transition-all duration-500 opacity-60",
            i === values.length - 1 ? "opacity-100" : "",
            color
          )}
          style={{ height: `${Math.max(4, Math.round((v / max) * 100))}%`, minHeight: v > 0 ? "3px" : "0" }}
          title={fmtARS(v)}
        />
      ))}
    </div>
  );
}

// ─── Widget ───────────────────────────────────────────────────────────────────

export const FinanceSummaryWidget = React.memo(function FinanceSummaryWidget() {
  const [data,    setData]    = useState<StatsOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStatsOverview()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 animate-pulse">
        <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-700 mb-3" />
        <div className="h-7 w-20 rounded bg-slate-200 dark:bg-slate-700 mb-2" />
        <div className="h-3 w-16 rounded bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!data) return null;

  const months = data.ingresosPorMes.slice(-4); // last 4 months
  const current  = months[months.length - 1];
  const previous = months[months.length - 2];

  if (!current) return null;

  const cobradoActual  = current.cobrado   ?? 0;
  const cobradoPrev    = previous?.cobrado ?? 0;
  const facturadoActual = current.facturado ?? 0;
  const change = pctChange(cobradoActual, cobradoPrev);

  const sparkValues = months.map((m) => m.cobrado ?? 0);

  const trendPositive = change !== null && change > 0;
  const trendNegative = change !== null && change < 0;
  const TrendIcon = trendPositive ? TrendingUp : trendNegative ? TrendingDown : Minus;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 overflow-hidden relative">
      {/* Subtle background glow */}
      <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {current.label}
            </span>
          </div>
          <Link
            href="/finanzas"
            className="text-xs text-slate-400 hover:text-primary transition-colors flex items-center gap-0.5"
          >
            Ver <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Main number */}
        <p className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
          {fmtARS(cobradoActual)}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">cobrado este mes</p>

        {/* Trend */}
        <div className="flex items-center gap-3 mt-3">
          {change !== null && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full",
              trendPositive
                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400"
                : trendNegative
                ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
            )}>
              <TrendIcon className="w-3 h-3" />
              {change > 0 ? "+" : ""}{change}% vs anterior
            </div>
          )}
          {facturadoActual > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {fmtARS(facturadoActual)} facturado
            </span>
          )}
        </div>

        {/* Sparkline */}
        {sparkValues.some((v) => v > 0) && (
          <div className="mt-4">
            <Sparkline values={sparkValues} color="bg-emerald-500" />
            <div className="flex items-center justify-between mt-1">
              {months.map((m, i) => (
                <span
                  key={i}
                  className={cn(
                    "text-[10px] flex-1 text-center",
                    i === months.length - 1
                      ? "text-emerald-600 dark:text-emerald-400 font-semibold"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {m.label.slice(0, 3)}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
