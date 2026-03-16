"use client";

import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface DocumentSectionProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}

export function DocumentSection({
  icon: Icon,
  title,
  description,
  children,
  className,
}: DocumentSectionProps) {
  return (
    <div
      className={cn(
        "glass-card rounded-xl p-8 shadow-sm",
        className
      )}
    >
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}


