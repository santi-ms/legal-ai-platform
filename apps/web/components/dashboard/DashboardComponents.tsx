"use client";

import { FileText, AlertCircle, RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function EmptyState({ onCreateClick }: { onCreateClick?: () => void }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto w-24 h-24 rounded-full bg-neutral-800 flex items-center justify-center mb-6">
        <FileText className="w-12 h-12 text-neutral-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        No hay documentos aún
      </h3>
      <p className="text-neutral-400 mb-6 max-w-sm mx-auto">
        Comenzá creando tu primer documento legal con IA
      </p>
      {onCreateClick ? (
        <Button onClick={onCreateClick}>
          <Plus className="w-4 h-4 mr-2" />
          Crear documento
        </Button>
      ) : (
        <Link href="/documents/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Crear documento
          </Button>
        </Link>
      )}
    </div>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto w-24 h-24 rounded-full bg-red-900/20 flex items-center justify-center mb-6">
        <AlertCircle className="w-12 h-12 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">
        Error al cargar documentos
      </h3>
      <p className="text-neutral-400 mb-6 max-w-sm mx-auto">
        {message || "Ocurrió un error. Por favor, intentá nuevamente."}
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-neutral-800 rounded-lg h-20 border border-neutral-700"
        />
      ))}
    </div>
  );
}
