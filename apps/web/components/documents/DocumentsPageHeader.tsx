"use client";

import Link from "next/link";
import { Gavel, Search, Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { cn } from "@/app/lib/utils";

export function DocumentsPageHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const user = session?.user;

  const navItems = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/documents", label: "Documentos" },
    { href: "#", label: "Plantillas" },
    { href: "#", label: "Firmas" },
  ];

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 md:px-10 py-3 sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/dashboard" className="flex items-center gap-3 text-primary">
          <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
            <Gavel className="w-5 h-5" />
          </div>
          <h2 className="text-slate-900 dark:text-white text-xl font-bold leading-tight tracking-tight">
            LegalTech AR
          </h2>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  isActive
                    ? "text-primary font-semibold border-b-2 border-primary py-1"
                    : "text-slate-600 dark:text-slate-300 hover:text-primary"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-1 justify-end gap-4 items-center">
        <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-1.5 w-64 border border-transparent focus-within:border-primary/50 transition-all">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 outline-none ml-2"
            placeholder="Buscar globalmente..."
            type="text"
          />
        </div>
        <button
          className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
          aria-label="Notificaciones"
        >
          <Bell className="w-5 h-5" />
        </button>
        <Link
          href="/profile"
          className="bg-primary/10 border border-primary/20 rounded-full size-9 flex items-center justify-center overflow-hidden"
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "Usuario"}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary font-semibold text-sm">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}


