"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
    <main className="min-h-screen bg-black text-white px-4 py-10 md:px-10">
      {/* HEADER SUPERIOR */}
      <header className="max-w-5xl mx-auto mb-8 flex flex-col gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
            Generar nuevo documento legal
          </h1>
          <p className="text-sm text-neutral-500 max-w-lg">
            Completá los datos del proveedor, cliente y condiciones
            comerciales. Vamos a generar el contrato automáticamente y darte
            el PDF listo.
          </p>
        </div>
      </header>

      {/* GRID CONTENIDO */}
      <section className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORMULARIO */}
        <Card className="bg-neutral-900 border border-neutral-800 shadow-[0_20px_80px_rgba(0,0,0,0.8)]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-white flex items-center gap-2">
              <span className="text-emerald-400">✍</span>
              Datos del contrato
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo / Jurisdicción / Tono */}
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-neutral-300">
                    Tipo de documento
                  </Label>
                  <Input
                    className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                    name="type"
                    placeholder="Ej: contrato_servicios"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-neutral-300">
                      Jurisdicción
                    </Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="jurisdiccion"
                      placeholder="Ej: corrientes_capital"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-neutral-300">Tono</Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="tono"
                      placeholder="formal / comercial_claro"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Parte Proveedora */}
              <div className="space-y-3">
                <h3 className="text-[13px] font-semibold text-neutral-400 uppercase tracking-wide">
                  Parte Proveedora
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-neutral-300">
                      Nombre / Razón Social
                    </Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="proveedor_nombre"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-neutral-300">
                      Documento / CUIT
                    </Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="proveedor_doc"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-sm text-neutral-300">
                      Domicilio
                    </Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="proveedor_domicilio"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Parte Cliente */}
              <div className="space-y-3">
                <h3 className="text-[13px] font-semibold text-neutral-400 uppercase tracking-wide">
                  Parte Cliente
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-neutral-300">
                      Nombre / Razón Social
                    </Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="cliente_nombre"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-neutral-300">
                      Documento / CUIT
                    </Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="cliente_doc"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Label className="text-sm text-neutral-300">
                      Domicilio
                    </Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="cliente_domicilio"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Condiciones comerciales */}
              <div className="space-y-3">
                <h3 className="text-[13px] font-semibold text-neutral-400 uppercase tracking-wide">
                  Condiciones comerciales
                </h3>

                <div>
                  <Label className="text-sm text-neutral-300">
                    Descripción del servicio
                  </Label>
                  <Textarea
                    className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40 min-h-[72px] text-sm"
                    name="descripcion_servicio"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-neutral-300">
                      Monto mensual
                    </Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="monto_mensual"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-neutral-300">
                      Forma de pago
                    </Label>
                    <Input
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="forma_pago"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-neutral-300">
                      Inicio de vigencia
                    </Label>
                    <Input
                      type="date"
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="inicio_vigencia"
                      required
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-neutral-300">
                      Plazo mínimo (meses)
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                      name="plazo_minimo_meses"
                      required
                    />
                  </div>
                </div>

                {/* Penalización (switch controlado) */}
                <div className="flex items-start gap-3 pt-2">
                  {/* hidden sólo como debug/inspección */}
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
                      className="text-sm text-neutral-300 leading-none"
                    >
                      Penalización por rescisión anticipada
                    </Label>
                    <p className="text-[11px] text-neutral-500 leading-tight">
                      Cláusula que cobra una multa si el cliente corta antes
                      de tiempo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preferencias fiscales */}
              <div className="space-y-2">
                <Label className="text-sm text-neutral-300">
                  Preferencias fiscales
                </Label>
                <Input
                  className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-600 focus-visible:ring-emerald-500/40"
                  name="preferencias_fiscales"
                  placeholder="Ej: Responsable Inscripto"
                  required
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className={`w-full text-black font-medium shadow-[0_0_20px_rgba(16,185,129,0.4)] ${
                  loading
                    ? "bg-emerald-800 hover:bg-emerald-800"
                    : "bg-emerald-500 hover:bg-emerald-400"
                }`}
              >
                {loading ? "Generando..." : "Generar documento"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* RESULTADO / PREVIEW */}
        <Card className="bg-neutral-900 border border-neutral-800 shadow-[0_20px_80px_rgba(0,0,0,0.8)] flex flex-col max-h-[80vh]">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-medium text-white flex items-center gap-2">
              <span className="text-emerald-400">📄</span>
              Resultado
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col overflow-hidden">
            {/* Estado vacío */}
            {!result && !error && !loading && (
              <div className="text-sm text-neutral-600">
                Completá el formulario y generamos el contrato acá mismo.
                Vas a poder descargar el PDF listo para enviarle al cliente.
              </div>
            )}

            {/* Loading / generando */}
            {loading && (
              <div className="text-sm text-neutral-400 animate-pulse">
                Generando documento legal...
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-red-400 text-sm">
                ❌ {error}
              </div>
            )}

            {/* Resultado OK */}
            {result && (
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Info documento / link PDF */}
                <div className="text-sm text-neutral-300">
                  <div className="text-emerald-400 font-semibold text-xs flex items-center gap-2">
                    ✅ Documento generado
                  </div>

                  <div className="mt-2 text-xs text-neutral-400 space-y-1">
                    <div>
                      ID del documento:{" "}
                      <span className="text-neutral-200 font-mono">
                        {result.documentId ?? "—"}
                      </span>
                    </div>

                    <div>
                      PDF:{" "}
                      {result.documentId ? (
                        <a
                          href={`http://localhost:4001/documents/${result.documentId}/pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline text-blue-400 break-all"
                        >
                          Descargar / Ver
                        </a>
                      ) : (
                        <span className="text-neutral-500">
                          todavía no disponible
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Texto del contrato */}
                <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-neutral-800 bg-neutral-950/60 p-4 text-[11px] leading-relaxed text-neutral-200 font-mono whitespace-pre-wrap shadow-inner shadow-black/40">
                  {result.contrato}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
