"use client";

import type { ReactNode } from "react";
import { DocumentsPageFooter } from "@/components/documents/DocumentsPageFooter";
import { DocumentsPageHeader } from "@/components/documents/DocumentsPageHeader";

interface DocumentWorkspaceShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function DocumentWorkspaceShell({
  title,
  description,
  actions,
  children,
}: DocumentWorkspaceShellProps) {
  return (
    <div className="layout-container flex min-h-screen flex-col bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100">
      <DocumentsPageHeader />

      <main className="max-w-[1280px] mx-auto w-full px-4 md:px-10 py-8 flex-1">
        <header className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex flex-col gap-2">
            <h1 className="text-slate-900 dark:text-white text-3xl font-extrabold tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-slate-500 dark:text-slate-400 text-base max-w-3xl">
                {description}
              </p>
            )}
          </div>

          {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
        </header>

        {children}
      </main>

      <DocumentsPageFooter />
    </div>
  );
}