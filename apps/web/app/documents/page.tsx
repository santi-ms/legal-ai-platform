"use client";

import Link from "next/link";
import { useState } from "react";

/**
 * Usar SIEMPRE IDs reales de la base.
 * Ahora vamos a usar sólo el último:
 * 3047ae32-b143-4d3f-8b26-b942b03a4155
 */
const mockDocs = [
  "3047ae32-b143-4d3f-8b26-b942b03a4155",
];

export default function DocumentsListPage() {
  const [docs] = useState(mockDocs);

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-gray-900">
          Documentos legales generados
        </h1>
        <p className="text-sm text-gray-600">
          Contratos generados con IA y guardados en tu workspace.
        </p>
      </header>

      <section className="space-y-4">
        {docs.length === 0 ? (
          <p className="text-sm text-gray-500">
            Todavía no hay documentos.
          </p>
        ) : (
          <ul className="space-y-3">
            {docs.map((id) => (
              <li
                key={id}
                className="border rounded p-4 flex items-center justify-between bg-white shadow-sm"
              >
                <div className="text-sm">
                  <div className="font-medium text-gray-800">
                    Documento #{id.slice(0, 8)}
                  </div>
                  <div className="text-gray-500 text-xs break-all">
                    {id}
                  </div>
                </div>

                <Link
                  className="text-xs px-3 py-2 rounded bg-black text-white"
                  href={`/documents/${id}`}
                >
                  Ver detalles
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
