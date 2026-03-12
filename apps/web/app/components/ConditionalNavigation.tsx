"use client";

import { usePathname } from "next/navigation";
import { Navigation } from "@/components/ui/navigation";

export function ConditionalNavigation() {
  const pathname = usePathname();
  
  // Don't show Navigation on landing page, dashboard, or settings (they have their own headers)
  if (
    pathname === "/" ||
    pathname?.startsWith("/dashboard") ||
    pathname?.startsWith("/settings") ||
    pathname?.startsWith("/documents/new") ||
    pathname?.startsWith("/documents/generating") ||
    pathname?.startsWith("/documents/[id]/review")
  ) {
    return null;
  }
  
  return <Navigation />;
}

