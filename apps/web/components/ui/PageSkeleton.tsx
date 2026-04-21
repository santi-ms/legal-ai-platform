"use client";

import React from "react";
import { cn } from "@/app/lib/utils";

interface PageSkeletonProps {
  variant?: "dashboard" | "list" | "cards" | "detail" | "stats";
  className?: string;
  /** Number of items to render when applicable (list/cards) */
  count?: number;
}

function Bar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80",
        className
      )}
    />
  );
}

function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        "grid gap-3",
        count <= 3
          ? "grid-cols-1 sm:grid-cols-3"
          : "grid-cols-2 lg:grid-cols-4"
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6"
        >
          <Bar className="h-8 w-8 rounded-lg mb-4" />
          <Bar className="h-3 w-24 mb-2" />
          <Bar className="h-7 w-16" />
        </div>
      ))}
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <div className="flex items-start gap-4">
        <Bar className="w-12 h-12 rounded-2xl" />
        <div className="space-y-2">
          <Bar className="h-7 w-48" />
          <Bar className="h-4 w-64" />
        </div>
      </div>
      <Bar className="h-10 w-36 rounded-xl" />
    </div>
  );
}

export function PageSkeleton({
  variant = "list",
  className,
  count,
}: PageSkeletonProps) {
  if (variant === "stats") {
    return <StatsSkeleton count={count ?? 4} />;
  }

  if (variant === "dashboard") {
    return (
      <div className={cn("space-y-6", className)}>
        <HeaderSkeleton />
        <StatsSkeleton count={count ?? 4} />
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-3"
            >
              <Bar className="h-5 w-40" />
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-5/6" />
              <Bar className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "cards") {
    return (
      <div className={cn("space-y-6", className)}>
        <HeaderSkeleton />
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: count ?? 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Bar className="h-10 w-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-4 w-3/4" />
                  <Bar className="h-3 w-1/2" />
                </div>
              </div>
              <Bar className="h-3 w-full" />
              <Bar className="h-3 w-5/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className={cn("space-y-6", className)}>
        <HeaderSkeleton />
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Bar
              key={i}
              className={cn(
                "h-4",
                i % 3 === 0 ? "w-full" : i % 3 === 1 ? "w-5/6" : "w-3/4"
              )}
            />
          ))}
        </div>
      </div>
    );
  }

  // default: list
  return (
    <div className={cn("space-y-6", className)}>
      <HeaderSkeleton />
      <div className="space-y-2">
        {Array.from({ length: count ?? 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
          >
            <Bar className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Bar className="h-4 w-1/3" />
              <Bar className="h-3 w-2/3" />
            </div>
            <Bar className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
