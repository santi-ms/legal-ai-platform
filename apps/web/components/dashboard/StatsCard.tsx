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

export const StatsCard = React.memo(function StatsCard({
  icon: Icon,
  label,
  value,
  change,
  iconBgColor = "bg-blue-100 dark:bg-blue-900/30",
  iconColor   = "text-blue-600 dark:text-blue-400",
  subText,
  subTextColor = "text-slate-400 dark:text-slate-500",
  href,
}: StatsCardProps) {
  const inner = (
    <div className={cn(
      "bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm",
      href && "hover:border-primary/40 hover:shadow-md transition-all duration-150 cursor-pointer group"
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2 rounded-lg", iconBgColor, iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        {change && (
          <span
            className={cn(
              "text-sm font-bold px-2 py-1 rounded",
              change.isPositive
                ? "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                : "text-rose-500 bg-rose-50 dark:bg-rose-500/10"
            )}
          >
            {change.value}
          </span>
        )}
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{label}</p>
      <p className={cn(
        "text-2xl font-bold mt-1 text-slate-900 dark:text-white",
        href && "group-hover:text-primary transition-colors duration-150"
      )}>
        {value}
      </p>
      {subText && (
        <p className={cn("text-xs font-medium mt-1", subTextColor)}>{subText}</p>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }

  return inner;
});



