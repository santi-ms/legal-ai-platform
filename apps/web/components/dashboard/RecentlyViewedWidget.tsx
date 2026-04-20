"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, Users, FileText, ScanSearch, History } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { RecentlyViewedItem, RecentlyViewedType } from "@/components/ui/TrackVisit";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<
  RecentlyViewedType,
  { icon: React.ElementType; iconColor: string; bg: string; label: string }
> = {
  expediente: {
    icon: Briefcase,
    iconColor: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
    label: "Expediente",
  },
  client: {
    icon: Users,
    iconColor: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-50 dark:bg-violet-900/20",
    label: "Cliente",
  },
  document: {
    icon: FileText,
    iconColor: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
    label: "Documento",
  },
  analysis: {
    icon: ScanSearch,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    label: "Análisis",
  },
};

// ─── Widget ───────────────────────────────────────────────────────────────────

export const RecentlyViewedWidget = React.memo(function RecentlyViewedWidget() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("docufy_recently_viewed");
      if (raw) {
        const parsed = JSON.parse(raw) as RecentlyViewedItem[];
        setItems(parsed.slice(0, 5));
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <History className="w-4 h-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Visitado recientemente
        </h3>
      </div>

      {/* Item list */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.map((item) => {
          const cfg = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.document;
          const Icon = cfg.icon;
          return (
            <Link
              key={`${item.type}-${item.id}`}
              href={item.href}
              className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
            >
              <div
                className={cn(
                  "size-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  cfg.bg
                )}
              >
                <Icon className={cn("w-4 h-4", cfg.iconColor)} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                  {item.label}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {item.sublabel ?? cfg.label}
                </p>
              </div>

              <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 tabular-nums">
                {formatTimeAgo(item.visitedAt)}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
});
