"use client";

import { TrendingUp, Clock, Target } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  status?: {
    label: string;
    variant: "urgent" | "goal" | "neutral";
  };
  icon?: React.ReactNode;
}

export function DocumentsStatsCards({ stats }: { stats: StatCardProps[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft"
        >
          <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]">
            {stat.label}
          </p>
          <div className="flex items-end justify-between mt-2 gap-2">
            <span className="text-3xl font-extrabold text-ink dark:text-white tracking-tight leading-none">
              {stat.value}
            </span>
            <div className="flex items-center gap-1 pb-0.5">
              {stat.trend && (
                <span
                  className={cn(
                    "text-[11px] font-semibold flex items-center",
                    stat.trend.isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                  )}
                >
                  <TrendingUp className="w-3 h-3 mr-0.5" />
                  {stat.trend.value}
                </span>
              )}
              {stat.status && (
                <span
                  className={cn(
                    "text-[11px] font-semibold flex items-center",
                    stat.status.variant === "urgent" && "text-amber-600 dark:text-amber-400",
                    stat.status.variant === "goal" && "text-primary",
                    stat.status.variant === "neutral" && "text-slate-500"
                  )}
                >
                  {stat.status.variant === "urgent" && <Clock className="w-3 h-3 mr-0.5" />}
                  {stat.status.variant === "goal" && <Target className="w-3 h-3 mr-0.5" />}
                  {stat.status.label}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
