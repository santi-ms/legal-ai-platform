"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Document = {
  id: string;
  type: string;
  jurisdiccion: string;
  estado: string;
  createdAt: string;
};

export default function DocumentsListPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar documentos reales desde el backend
  useEffect(() => {
    async function loadDocuments() {
      try {
        const res = await fetch("http://localhost:4001/documents");
        const data = await res.json();
        
        if (data.ok) {
          setDocs(data.documents);
        }
      } catch (error) {
        console.error("Error cargando documentos:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadDocuments();
  }, []);

  const filteredDocs = docs.filter(doc => 
    doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos Legales</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gestiona todos tus documentos generados con IA
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Link href="/documents/new">
            <Button>
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo documento
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <Input
              type="search"
              placeholder="Buscar documentos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="md">
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filtros
          </Button>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <svg className="animate-spin h-12 w-12 mx-auto text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-sm font-medium text-gray-900">Cargando documentos...</p>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                {searchQuery ? "No se encontraron documentos" : "No hay documentos"}
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                {searchQuery 
                  ? "Intenta con otros términos de búsqueda" 
                  : "Comienza creando tu primer documento legal con IA"}
              </p>
              {!searchQuery && (
                <div className="mt-6">
                  <Link href="/documents/new">
                    <Button>
                      <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Crear primer documento
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-lg transition-all">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    doc.estado === 'GENERATED' ? 'bg-green-100 text-green-800' :
                    doc.estado === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {doc.estado}
                  </span>
                </div>
                <CardTitle className="mt-4 text-base">{doc.type}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fecha de creación</p>
                    <p className="text-sm text-gray-900">
                      {new Date(doc.createdAt).toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Jurisdicción</p>
                    <p className="text-sm text-gray-900">{doc.jurisdiccion}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ID</p>
                    <p className="text-xs text-gray-900 font-mono truncate">{doc.id}</p>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <Link href={`/documents/${doc.id}`} className="flex-1">
                      <Button variant="primary" className="w-full" size="sm">
                        Ver detalles
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(`http://localhost:4001/documents/${doc.id}/pdf`, '_blank')}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats footer */}
      <div className="mt-8 border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div>
            Mostrando <span className="font-medium text-gray-900">{filteredDocs.length}</span> de{" "}
            <span className="font-medium text-gray-900">{docs.length}</span> documentos
          </div>
          <div className="flex items-center gap-2">
            <span>Ordenar por:</span>
            <select className="border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500">
              <option>Más reciente</option>
              <option>Más antiguo</option>
              <option>Tipo</option>
              <option>Estado</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
