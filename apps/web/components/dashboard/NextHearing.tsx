"use client";

import { useEffect, useState } from "react";
import { Users, Building2, User, ArrowRight } from "lucide-react";
import Link from "next/link";
import { listClients, Client } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function NextHearing() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listClients({ sort: "createdAt:desc", pageSize: 4 })
      .then((res) => setClients(res.clients))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-xl relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm">Clientes Recientes</h3>
          </div>
          <Link
            href="/clients"
            className="text-xs text-slate-400 hover:text-white transition-colors flex items-center gap-1"
          >
            Ver todos <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="size-8 rounded-full bg-white/10 flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-white/10" />
                  <div className="h-2.5 w-20 rounded bg-white/10" />
                </div>
              </div>
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-slate-400 text-sm">Todavía no hay clientes.</p>
            <Link
              href="/clients"
              className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
            >
              Agregar el primero
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {clients.map((client) => {
              const isJuridica = client.type === "persona_juridica";
              const initials = getInitials(client.name);
              return (
                <Link
                  key={client.id}
                  href={`/clients/${client.id}`}
                  className="flex items-center gap-3 group"
                >
                  <div className={cn(
                    "size-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    isJuridica
                      ? "bg-violet-500/20 text-violet-300"
                      : "bg-sky-500/20 text-sky-300"
                  )}>
                    {initials || (isJuridica ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate group-hover:text-primary transition-colors">
                      {client.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isJuridica ? "Persona Jurídica" : "Persona Física"}
                      {client.province ? ` · ${client.province}` : ""}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
