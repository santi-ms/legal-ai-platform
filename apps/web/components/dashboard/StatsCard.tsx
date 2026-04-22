"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  change?: {
    value: string;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
  /** Optional small text shown below the value — e.g. "3 urgentes" */
  subText?: string;
  subTextColor?: string;
  /** If provided, the card becomes a clickable link */
  href?: string;
}

/**
 * StatsCard editorial — número grande extrabold tracking-tight, label en
 * eyebrow uppercase. Layout airy estilo landing.
 */
export const StatsCard = React.memo(function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  iconBgColor = "bg-blue-50 dark:bg-blue-900/30",
  iconColor   = "text-blue-600 dark:text-blue-400",
  subText,
  subTextColor = "text-slate-500 dark:text-slate-500",
  href,
}: StatsCardProps) {
  const inner = (
    <div
      className={cn(
        "relative bg-white dark:bg-slate-900 p-3 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft transition-all duration-200",
        href && "hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-hover cursor-pointer group",
      )}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-4">
        <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center", iconBgColor, iconColor)}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
        </div>
        {change && (
          <span
            className={cn(
              "text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full",
              change.isPositive
                ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
                : "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10",
            )}
          >
            {change.value}
          </span>
        )}
      </div>
      <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.1em] sm:tracking-[0.12em] line-clamp-1">
        {label}
      </p>
      <p
        className={cn(
          "text-2xl sm:text-3xl font-extrabold mt-1 text-ink dark:text-white tracking-tight leading-none",
          href && "group-hover:text-primary transition-colors duration-200",
        )}
      >
        {value}
      </p>
      {subText && (
        <p className={cn("text-[10px] sm:text-[11px] font-medium mt-1 sm:mt-1.5 line-clamp-2", subTextColor)}>{subText}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }

  return inner;
});
