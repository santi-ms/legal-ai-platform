"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KeyboardShortcutsModal } from "@/components/ui/KeyboardShortcutsModal";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { DeadlineProvider } from "@/app/lib/contexts/DeadlineContext";

function useSequenceShortcut(onMatch: (seq: string) => void) {
  const lastKey = { value: "", time: 0 };
  return useCallback(
    (key: string) => {
      const now = Date.now();
      if (lastKey.value === "g" && now - lastKey.time < 1000) {
        onMatch(`g${key}`);
        lastKey.value = "";
      } else {
        lastKey.value = key.toLowerCase();
        lastKey.time = now;
      }
    },
    [onMatch]
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showShortcuts,    setShowShortcuts]    = useState(false);
  const [showSearch,       setShowSearch]       = useState(false);
  const router = useRouter();

  const handleSequence = useCallback(
    (seq: string) => {
      if (seq === "gd") router.push("/dashboard");
      if (seq === "gl") router.push("/documents");
      if (seq === "gs") router.push("/settings");
      if (seq === "gc") router.push("/clients");
      if (seq === "ge") router.push("/expedientes");
    },
    [router]
  );

  const checkSequence = useSequenceShortcut(handleSequence);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isTyping =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isTyping) return;

      // Ctrl+K / Cmd+K — global search
      if (e.key === "k" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setShowSearch((v) => !v);
        return;
      }

      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }

      if ((e.key === "n" || e.key === "N") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push("/documents/new");
        return;
      }

      if (
        (e.key === "g" || e.key === "G" ||
         e.key === "d" || e.key === "D" ||
         e.key === "l" || e.key === "L" ||
         e.key === "s" || e.key === "S" ||
         e.key === "c" || e.key === "C" ||
         e.key === "e" || e.key === "E") &&
        !e.metaKey && !e.ctrlKey
      ) {
        checkSequence(e.key);
      }
    },
    [router, checkSequence]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <DeadlineProvider>
      <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-display">
        <DashboardSidebar
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <main className="flex-1 flex flex-col min-w-0">
          <DashboardHeader
          onMenuToggle={() => setIsMobileMenuOpen((v) => !v)}
          onSearchOpen={() => setShowSearch(true)}
        />
          {children}
        </main>
        <KeyboardShortcutsModal
          open={showShortcuts}
          onClose={() => setShowShortcuts(false)}
        />
        <GlobalSearch
          open={showSearch}
          onClose={() => setShowSearch(false)}
        />
      </div>
    </DeadlineProvider>
  );
}
