"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KeyboardShortcutsModal } from "@/components/ui/KeyboardShortcutsModal";

// Sequence shortcut helper: detect G → D, G → L, G → S
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

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const router = useRouter();

  const handleSequence = useCallback(
    (seq: string) => {
      if (seq === "gd") router.push("/dashboard");
      if (seq === "gl") router.push("/documents");
      if (seq === "gs") router.push("/settings");
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

      // ? → show shortcuts modal
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }

      // N → new document
      if ((e.key === "n" || e.key === "N") && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        router.push("/documents/new");
        return;
      }

      // G + D / L / S sequences
      if (
        (e.key === "g" || e.key === "G" ||
         e.key === "d" || e.key === "D" ||
         e.key === "l" || e.key === "L" ||
         e.key === "s" || e.key === "S") &&
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
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-display">
      <DashboardSidebar
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuToggle={() => setIsMobileMenuOpen((v) => !v)} />
        {children}
      </main>
      <KeyboardShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}



