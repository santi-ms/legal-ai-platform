"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { TOKENS, type GradientKey, type StatusKey } from "@/app/lib/design-tokens";

export interface StatItem {
  icon?: LucideIcon;
  label: string;
  value: string | number;
  /** Optional tone — drives icon gradient and subText color */
  tone?: GradientKey;
  /** Optional urgent flag — adds ring around card */
  urgent?: boolean;
  subText?: string;
  subTone?: StatusKey;
  href?: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
}

interface StatsGridProps {
  items: StatItem[];
  /** Number of columns on large viewport */
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const COLS: Record<NonNullable<StatsGridProps["columns"]>, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
};

function StatCardInner({ item }: { item: StatItem }) {
  const { icon: Icon, label, value, tone = "primary", urgent, subText, subTone, change, href } = item;
  const subToneClass = subTone ? TOKENS.status[subTone].text : "text-slate-400 dark:text-slate-500";

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-white dark:bg-slate-900 p-5 rounded-2xl border transition-all duration-200",
        urgent
          ? "border-rose-200 dark:border-rose-900/50 ring-1 ring-rose-100 dark:ring-rose-900/30"
          : "border-slate-200 dark:border-slate-800 shadow-sm",
        href && "hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer group"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        {Icon ? (
          <div
            className={cn(
              "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm",
              TOKENS.gradients[tone]
            )}
          >
            <Icon className="w-5 h-5 text-white" strokeWidth={2} />
          </div>
        ) : (
          <div />
        )}
        {change && (
          <span
            className={cn(
              "text-[11px] font-bold px-2 py-0.5 rounded-full",
              change.isPositive
                ? "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10"
                : "text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10"
            )}
          >
            {change.value}
          </span>
        )}
      </div>

      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.12em]">
        {label}
      </p>
      <p
        className={cn(
          "text-3xl font-extrabold mt-1 text-ink dark:text-white tracking-tight leading-none",
          href && "group-hover:text-primary transition-colors"
        )}
      >
        {value}
      </p>
      {subText && (
        <p className={cn("text-[11px] font-medium mt-1", subToneClass)}>{subText}</p>
      )}
    </div>
  );
}

export const StatsGrid = React.memo(function StatsGrid({
  items,
  columns = 4,
  className,
}: StatsGridProps) {
  return (
    <div className={cn("grid gap-3", COLS[columns], className)}>
      {items.map((item, i) => {
        if (item.href) {
          return (
            <Link key={`${item.label}-${i}`} href={item.href} className="block">
              <StatCardInner item={item} />
            </Link>
          );
        }
        return <StatCardInner key={`${item.label}-${i}`} item={item} />;
      })}
    </div>
  );
});
