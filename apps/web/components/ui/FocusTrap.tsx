"use client";

import { useEffect, useRef } from "react";

const FOCUSABLE_SELECTORS = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ");

interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
  onEscape?: () => void;
  /** Whether to auto-focus the first focusable element on mount */
  autoFocus?: boolean;
}

/**
 * FocusTrap — keeps keyboard focus inside a container while active.
 * Tab/Shift+Tab cycle through focusable elements. Escape fires onEscape().
 */
export function FocusTrap({
  children,
  active = true,
  onEscape,
  autoFocus = true,
}: FocusTrapProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    // Auto-focus first focusable element
    if (autoFocus) {
      const focusable = el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS);
      const first = focusable[0];
      if (first) {
        // Small defer so the element is painted before focus
        const t = setTimeout(() => first.focus(), 30);
        return () => clearTimeout(t);
      }
    }
  }, [active, autoFocus]);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onEscape?.();
        return;
      }

      if (e.key !== "Tab") return;

      const focusable = Array.from(
        el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [active, onEscape]);

  return (
    <div ref={ref} style={{ display: "contents" }}>
      {children}
    </div>
  );
}
