/**
 * Legacy Document Creation Wizard
 * 
 * This page now redirects to the new guided flow at /documents/new/guided.
 * The old wizard code has been removed to fix build errors.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewDocumentPage() {
  const router = useRouter();
  
  // Redirect to new guided flow immediately
  useEffect(() => {
    router.replace("/documents/new/guided");
  }, [router]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-background-dark">
      <div className="animate-pulse text-slate-400">Redirigiendo al nuevo flujo guiado...</div>
    </div>
  );
}
