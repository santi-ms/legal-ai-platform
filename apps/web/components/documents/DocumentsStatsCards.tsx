"use client";

import { TrendingUp, Clock, Target, FileText } from "lucide-react";
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
            {stat.label}
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</span>
            <div className="flex items-center gap-1">
              {stat.trend && (
                <span
                  className={cn(
                    "text-xs font-medium flex items-center",
                    stat.trend.isPositive ? "text-emerald-500" : "text-rose-500"
                  )}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.trend.value}
                </span>
              )}
              {stat.status && (
                <span
                  className={cn(
                    "text-xs font-medium flex items-center",
                    stat.status.variant === "urgent" && "text-amber-500",
                    stat.status.variant === "goal" && "text-primary",
                    stat.status.variant === "neutral" && "text-slate-400"
                  )}
                >
                  {stat.status.variant === "urgent" && <Clock className="w-3 h-3 mr-1" />}
                  {stat.status.variant === "goal" && <Target className="w-3 h-3 mr-1" />}
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



