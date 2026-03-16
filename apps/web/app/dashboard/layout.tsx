"use client";

import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background-light dark:bg-background-dark font-display">
      <DashboardSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <DashboardHeader />
        {children}
      </main>
    </div>
  );
}


