"use client";

import Link from "next/link";
import {
  ArrowLeft, Pencil, FileText, Briefcase, CalendarClock,
  Archive, ArchiveRestore,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Client, ClientType } from "@/app/lib/webApi";

const TYPE_LABELS: Record<ClientType, string> = {
  persona_fisica: "Persona Física",
  persona_juridica: "Persona Jurídica",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

interface ClientHeaderProps {
  client: Client;
  clientId: string;
  onEdit: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
}

export function ClientHeader({
  client,
  clientId,
  onEdit,
  onArchive,
  onUnarchive,
}: ClientHeaderProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-10 py-4">
      <div className="max-w-[960px] mx-auto flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <Breadcrumb
            items={[{ label: "Clientes", href: "/clients" }, { label: client.name }]}
            className="mb-1"
          />
          <h1 className="text-lg font-bold text-slate-900 dark:text-white truncate">{client.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cliente desde {formatDate(client.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {!client.archivedAt && (
            <>
              <Link href={`/documents/new`}>
                <Button size="sm" className="text-xs flex items-center gap-1.5 hidden sm:flex">
                  <FileText className="w-3.5 h-3.5" />
                  Nuevo Doc
                </Button>
              </Link>
              <Link href={`/expedientes?clientId=${clientId}&create=1`}>
                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 hidden sm:flex">
                  <Briefcase className="w-3.5 h-3.5" />
                  Nuevo Exp.
                </Button>
              </Link>
              <Link href={`/vencimientos?create=1&clientId=${clientId}`}>
                <Button variant="outline" size="sm" className="text-xs flex items-center gap-1.5 hidden sm:flex">
                  <CalendarClock className="w-3.5 h-3.5" />
                  Nuevo Venc.
                </Button>
              </Link>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 hidden sm:block" />
            </>
          )}

          {client.archivedAt ? (
            <Button
              variant="outline"
              onClick={onUnarchive}
              className="text-sm text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
            >
              <ArchiveRestore className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Restaurar</span>
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onEdit}
                className="text-sm"
              >
                <Pencil className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Editar</span>
              </Button>
              <Button
                variant="outline"
                onClick={onArchive}
                className="text-sm text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/20"
              >
                <Archive className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Archivar</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
