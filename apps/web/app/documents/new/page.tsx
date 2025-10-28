"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function NewDocumentPage() {
  // estado de carga
  const [loading, setLoading] = useState(false);

  // respuesta de la API
  const [result, setResult] = useState<{
    contrato: string;
    pdfUrl?: string | null;
    documentId?: string;
  } | null>(null);

  // error si falla
  const [error, setError] = useState<string | null>(null);

  // estado local del switch de penalización
  const [penalizacion, setPenalizacion] = useState<boolean>(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData(event.currentTarget);

    // Body plano para matchear el Zod del backend
    const body = {
      type: formData.get("type"),
      jurisdiccion: formData.get("jurisdiccion"),
      tono: formData.get("tono"),

      proveedor_nombre: formData.get("proveedor_nombre"),
      proveedor_doc: formData.get("proveedor_doc"),
      proveedor_domicilio: formData.get("proveedor_domicilio"),

      cliente_nombre: formData.get("cliente_nombre"),
      cliente_doc: formData.get("cliente_doc"),
      cliente_domicilio: formData.get("cliente_domicilio"),

      descripcion_servicio: formData.get("descripcion_servicio"),
      monto_mensual: formData.get("monto_mensual"),
      forma_pago: formData.get("forma_pago"),
      inicio_vigencia: formData.get("inicio_vigencia"),

      plazo_minimo_meses: Number(formData.get("plazo_minimo_meses")),
      penalizacion_rescision: penalizacion, // boolean real

      preferencias_fiscales: formData.get("preferencias_fiscales"),
    };

    try {
      const res = await fetch("http://localhost:4001/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!json.ok) {
        console.error("Respuesta backend:", json);
        throw new Error("Error al generar el documento");
      }

      // json viene con { ok, documentId, contrato, pdfUrl }
      setResult(json);
    } catch (err: any) {
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* HEADER SUPERIOR */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/documents">
              <Button variant="ghost" size="sm">
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Volver
              </Button>
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Generar Nuevo Documento Legal
          </h1>
          <p className="mt-1 text-sm text-gray-500 max-w-2xl">
            Completa los datos del proveedor, cliente y condiciones comerciales. 
            Generaremos el contrato automáticamente con IA.
          </p>
        </div>
      </div>

      {/* GRID CONTENIDO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORMULARIO */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Contrato</CardTitle>
            <CardDescription>
              Ingresa la información necesaria para generar el documento
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo / Jurisdicción / Tono */}
              <div className="space-y-4">
                <div>
                  <Label>Tipo de documento</Label>
                  <Input
                    name="type"
                    placeholder="Ej: contrato_servicios"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Jurisdicción</Label>
                    <Input
                      name="jurisdiccion"
                      placeholder="Ej: corrientes_capital"
                      required
                    />
                  </div>
                  <div>
                    <Label>Tono</Label>
                    <Input
                      name="tono"
                      placeholder="formal / comercial_claro"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Parte Proveedora */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  Parte Proveedora
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre / Razón Social</Label>
                    <Input
                      name="proveedor_nombre"
                      required
                    />
                  </div>

                  <div>
                    <Label>Documento / CUIT</Label>
                    <Input
                      name="proveedor_doc"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Domicilio</Label>
                    <Input
                      name="proveedor_domicilio"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Parte Cliente */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  Parte Cliente
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre / Razón Social</Label>
                    <Input
                      name="cliente_nombre"
                      required
                    />
                  </div>

                  <div>
                    <Label>Documento / CUIT</Label>
                    <Input
                      name="cliente_doc"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label>Domicilio</Label>
                    <Input
                      name="cliente_domicilio"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Condiciones comerciales */}
              <div className="space-y-3 pt-2 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">
                  Condiciones Comerciales
                </h3>

                <div>
                  <Label>Descripción del servicio</Label>
                  <Textarea
                    name="descripcion_servicio"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Monto mensual</Label>
                    <Input
                      name="monto_mensual"
                      placeholder="Ej: $50,000"
                      required
                    />
                  </div>

                  <div>
                    <Label>Forma de pago</Label>
                    <Input
                      name="forma_pago"
                      placeholder="Ej: Transferencia bancaria"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>Inicio de vigencia</Label>
                    <Input
                      type="date"
                      name="inicio_vigencia"
                      required
                    />
                  </div>

                  <div>
                    <Label>Plazo mínimo (meses)</Label>
                    <Input
                      type="number"
                      min={1}
                      name="plazo_minimo_meses"
                      required
                    />
                  </div>
                </div>

                {/* Penalización (switch controlado) */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="hidden"
                    name="penalizacion"
                    value={penalizacion ? "on" : "off"}
                  />

                  <Switch
                    id="penalizacion"
                    checked={penalizacion}
                    onCheckedChange={(checked: boolean) => {
                      setPenalizacion(checked);
                    }}
                  />
                  <div className="space-y-[2px]">
                    <Label
                      htmlFor="penalizacion"
                      className="mb-0 cursor-pointer"
                    >
                      Penalización por rescisión anticipada
                    </Label>
                    <p className="text-xs text-gray-500 leading-tight">
                      Cláusula que cobra una multa si el cliente rescinde antes del plazo mínimo
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferencias fiscales */}
              <div className="space-y-2 pt-2 border-t border-gray-200">
                <Label>Preferencias fiscales</Label>
                <Input
                  name="preferencias_fiscales"
                  placeholder="Ej: Responsable Inscripto"
                  required
                />
              </div>

              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generando documento...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Generar documento
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* RESULTADO / PREVIEW */}
        <Card className="flex flex-col lg:sticky lg:top-6 max-h-[calc(100vh-8rem)]">
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
            <CardDescription>
              El documento generado aparecerá aquí
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Estado vacío */}
            {!result && !error && !loading && (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="mt-4 text-sm font-medium text-gray-900">Sin documento generado</h3>
                  <p className="mt-2 text-sm text-gray-500 max-w-sm">
                    Completa el formulario de la izquierda y genera tu documento legal automáticamente
                  </p>
                </div>
              </div>
            )}

            {/* Loading / generando */}
            {loading && (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="text-center">
                  <svg className="animate-spin h-12 w-12 mx-auto text-primary-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-sm font-medium text-gray-900">Generando documento...</p>
                  <p className="mt-1 text-xs text-gray-500">Esto puede tomar unos segundos</p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error al generar documento</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Resultado OK */}
            {result && (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Success banner */}
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-green-800">¡Documento generado exitosamente!</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p className="text-xs">ID: <span className="font-mono">{result.documentId ?? "—"}</span></p>
                      </div>
                      <div className="mt-3">
                        {result.documentId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(`http://localhost:4001/documents/${result.documentId}/pdf`, '_blank')}
                            className="text-green-800 border-green-300 hover:bg-green-100"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Descargar PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Texto del contrato */}
                <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4 custom-scrollbar">
                  <pre className="text-xs leading-relaxed text-gray-900 font-mono whitespace-pre-wrap">
                    {result.contrato}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
