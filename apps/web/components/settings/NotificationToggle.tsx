"use client";

import { cn } from "@/app/lib/utils";

interface NotificationToggleProps {
  id: string;
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function NotificationToggle({
  id,
  title,
  description,
  checked,
  onChange,
  className,
}: NotificationToggleProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
        className
      )}
    >
      <div className="flex flex-col">
        <span className="font-semibold text-slate-900 dark:text-white">{title}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary"></div>
      </label>
    </div>
  );
}

