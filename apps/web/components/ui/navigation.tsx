"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, Plus, List, LogOut, User } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { useSession, signOut } from "next-auth/react";

const navigation = [
  {
    name: "Inicio",
    href: "/",
  },
  {
    name: "Dashboard",
    href: "/dashboard",
  },
  {
    name: "Documentos",
    href: "/documents",
  },
];

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div className="w-full">
      {/* top bar */}
      <div className="flex items-center justify-between">
        {/* brand */}
        <Link
          href="/"
          className="flex items-center gap-2 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-md group-hover:bg-emerald-500 transition-colors">
            <Scale className="h-5 w-5" />
          </div>

          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-white">
              Legal AI Platform
            </span>
            <span className="text-[11px] text-neutral-400">
              Documentos listos para firmar
            </span>
          </div>
        </Link>

        {/* desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          {session && (
            <nav className="flex items-center gap-4 text-sm">
              {navigation.map((item) => {
                const active =
                  pathname === item.href ||
                  (pathname.startsWith(item.href) && item.href !== "/");

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "px-2 py-1.5 rounded-md font-medium transition-colors",
                      active
                        ? "text-white bg-emerald-600/20"
                        : "text-neutral-300 hover:text-white hover:bg-neutral-800"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* Botones según sesión */}
          {session ? (
            <>
              <Link
                href="/documents/new"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-emerald-700/30 hover:bg-emerald-500 hover:shadow-md transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo documento</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  className="h-9 w-9 flex items-center justify-center rounded-full border border-neutral-700 bg-neutral-800 text-[11px] font-semibold text-white hover:bg-neutral-700"
                  aria-label="Cuenta"
                >
                  <User className="h-4 w-4" />
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-700 hover:text-white transition-all"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden lg:inline">Cerrar sesión</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-neutral-300 hover:text-white transition-colors"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 transition-all"
              >
                Registrarse
              </Link>
            </div>
          )}
        </div>

        {/* mobile menu button */}
        <button
          type="button"
          className="md:hidden flex h-10 w-10 items-center justify-center rounded-md border border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span className="sr-only">Abrir menú</span>
          <div className="flex flex-col gap-1">
            <span className="block h-0.5 w-5 bg-white"></span>
            <span className="block h-0.5 w-5 bg-white"></span>
            <span className="block h-0.5 w-5 bg-white"></span>
          </div>
        </button>
      </div>

      {/* mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-4 rounded-lg border border-neutral-700 bg-neutral-900 shadow-lg">
          <nav className="flex flex-col p-2 text-sm">
            {session ? (
              <>
                {navigation.map((item) => {
                  const active =
                    pathname === item.href ||
                    (pathname.startsWith(item.href) && item.href !== "/");

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 font-medium transition-colors",
                        active
                          ? "bg-emerald-600/20 text-white"
                          : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name === "Documentos" ? (
                        <List className="h-4 w-4 text-neutral-400" />
                      ) : (
                        <Scale className="h-4 w-4 text-neutral-400" />
                      )}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}

                <Link
                  href="/documents/new"
                  className="mt-2 flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-emerald-700/30 hover:bg-emerald-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Nuevo documento</span>
                </Link>

                <button
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="mt-2 flex items-center justify-center gap-2 rounded-md border border-neutral-700 bg-neutral-800 text-xs font-semibold text-white hover:bg-neutral-700"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Cerrar sesión</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Iniciar Sesión
                </Link>
                <Link
                  href="/auth/register"
                  className="mt-2 flex items-center justify-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}
