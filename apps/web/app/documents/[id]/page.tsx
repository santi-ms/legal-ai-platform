"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type LastVersion = {
  id: string;
  rawText: string;
  pdfUrl: string | null;
  createdAt: string;
};

type DocumentResponse = {
  ok: boolean;
  document: {
    id: string;
    type: string;
    jurisdiccion: string;
    tono: string;
    estado: string;
    costUsd: number | null;
    lastVersion: LastVersion | null;
  };
};

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const [data, setData] = useState<DocumentResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // cargar el documento
  useEffect(() => {
    async function load() {
      if (!id) return;

      try {
        const res = await fetch(`http://localhost:4001/documents/${id}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          setError("No se pudo cargar el documento");
          setLoading(false);
          return;
        }

        const json = (await res.json()) as DocumentResponse;
        setData(json);
        setLoading(false);
      } catch {
        setError("Error de red al cargar el documento");
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // abrir el PDF en nueva pestaña usando el endpoint público de la API
  function handleDownload() {
    if (!id) return;
    window.open(
      `http://localhost:4001/documents/${id}/pdf`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // estados iniciales
  if (!id) {
    return (
      <main className="p-8 flex justify-center text-sm text-neutral-400 bg-black min-h-screen">
        Cargando id…
      </main>
    );
  }

  if (loading) {
    return (
      <main className="p-8 flex justify-center text-sm text-neutral-400 bg-black min-h-screen">
        Cargando documento...
      </main>
    );
  }

  if (error) {
    return (
      <main className="p-8 flex justify-center bg-black min-h-screen">
        <div className="max-w-md w-full rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      </main>
    );
  }

  if (!data?.document) {
    return (
      <main className="p-8 flex justify-center text-sm text-neutral-400 bg-black min-h-screen">
        Documento no encontrado.
      </main>
    );
  }

  // data lista
  const doc = data.document;
  const last = doc.lastVersion;

  return (
    <main className="p-6 md:p-10 max-w-4xl mx-auto flex flex-col gap-8 text-neutral-100 bg-black min-h-screen">
      {/* HEADER / TITULO */}
      <section className="flex flex-col gap-2">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
              Documento #{doc.id.slice(0, 8)}
            </h1>
            <p className="text-xs text-neutral-500">
              Última actualización:{" "}
              {last
                ? new Date(last.createdAt).toLocaleString()
                : "— sin versiones —"}
            </p>
          </div>

          {/* Botón Descargar */}
          {last && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-black hover:bg-emerald-400 active:bg-emerald-300 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.4)]"
            >
              Descargar PDF
            </button>
          )}
        </div>
      </section>

      {/* META CARD */}
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-4 md:p-5 shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex flex-col">
            <span className="text-neutral-500 text-[11px] uppercase font-medium">
              Tipo de documento
            </span>
            <span className="text-neutral-200 font-medium">{doc.type}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-neutral-500 text-[11px] uppercase font-medium">
              Jurisdicción
            </span>
            <span className="text-neutral-200 font-medium">
              {doc.jurisdiccion}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-neutral-500 text-[11px] uppercase font-medium">
              Estado
            </span>
            <span
              className={`text-neutral-200 font-medium ${
                doc.estado === "GENERATED"
                  ? "text-emerald-400"
                  : doc.estado === "DRAFT"
                  ? "text-yellow-400"
                  : ""
              }`}
            >
              {doc.estado}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-neutral-500 text-[11px] uppercase font-medium">
              Tono
            </span>
            <span className="text-neutral-200 font-medium">{doc.tono}</span>
          </div>

          <div className="flex flex-col">
            <span className="text-neutral-500 text-[11px] uppercase font-medium">
              Costo estimado (USD)
            </span>
            <span className="text-neutral-200 font-medium">
              {doc.costUsd !== null ? `$${doc.costUsd}` : "—"}
            </span>
          </div>

          {last?.pdfUrl && (
            <div className="flex flex-col">
              <span className="text-neutral-500 text-[11px] uppercase font-medium">
                Ruta interna PDF
              </span>
              <span className="text-neutral-400 text-[11px] break-all leading-normal">
                {last.pdfUrl}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* CONTENIDO DEL CONTRATO */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="text-sm font-medium text-neutral-300 uppercase tracking-wide">
            Contenido legal
          </h2>

          {last && (
            <span className="text-[11px] text-neutral-500">
              Versión #{last.id.slice(0, 6)}
            </span>
          )}
        </div>

        {last ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 text-sm leading-relaxed text-neutral-200 font-mono whitespace-pre-wrap max-h-[70vh] overflow-y-auto shadow-inner shadow-black/40">
            {last.rawText}
          </div>
        ) : (
          <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-sm text-yellow-300">
            Todavía no hay una versión generada para este documento.
          </div>
        )}
      </section>
    </main>
  );
}
