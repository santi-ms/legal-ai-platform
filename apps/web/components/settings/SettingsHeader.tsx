"use client";

import Link from "next/link";
import { Settings, Bell, User } from "lucide-react";
import { useSession } from "next-auth/react";

export function SettingsHeader() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 dark:border-slate-800 px-4 md:px-10 py-3">
      <div className="flex items-center gap-4">
        <div className="size-8 flex items-center justify-center text-primary">
          <Settings className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold leading-tight tracking-tight text-slate-900 dark:text-white">
          Configuración
        </h2>
      </div>
      <div className="flex flex-1 justify-end gap-4 md:gap-8 items-center">
        <div className="flex gap-2">
          <button
            className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary opacity-50 cursor-not-allowed"
            aria-label="Notificaciones (próximamente)"
            aria-disabled="true"
            tabIndex={-1}
            title="Próximamente"
          >
            <Bell className="w-5 h-5" />
          </button>
          <Link
            href="/settings"
            className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            aria-label="Perfil"
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
        <Link
          href="/settings"
          className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 border-2 border-primary/20 flex items-center justify-center text-primary font-semibold"
        >
          {user?.image ? (
            <img
              src={user.image}
              alt={user.name || "Usuario"}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <span className="text-sm">{user?.name?.charAt(0).toUpperCase() || "U"}</span>
          )}
        </Link>
      </div>
    </header>
  );
}

