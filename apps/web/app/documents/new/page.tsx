"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wizard, WizardStep, WizardStepContent } from "@/components/ui/wizard";
import {
  Scale,
  Users,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  Download,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { DashboardShell } from "@/app/components/DashboardShell";
import { useToast } from "@/components/ui/toast";
import confetti from "canvas-confetti";

// Tipos del formulario
interface FormData {
  // Paso 1
  type: string;
  jurisdiccion: string;
  tono: string;

  // Paso 2
  proveedor_nombre: string;
  proveedor_doc: string;
  proveedor_domicilio: string;
  cliente_nombre: string;
  cliente_doc: string;
  cliente_domicilio: string;

  // Paso 3
  descripcion_servicio: string;
  monto_mensual: string;
  forma_pago: string;
  inicio_vigencia: string;
  plazo_minimo_meses: number;
  penalizacion_rescision: boolean;
  penalizacion_monto?: string;
  preferencias_fiscales: string;
}

const initialFormData: FormData = {
  type: "",
  jurisdiccion: "",
  tono: "",
  proveedor_nombre: "",
  proveedor_doc: "",
  proveedor_domicilio: "",
  cliente_nombre: "",
  cliente_doc: "",
  cliente_domicilio: "",
  descripcion_servicio: "",
  monto_mensual: "",
  forma_pago: "",
  inicio_vigencia: "",
  plazo_minimo_meses: 1,
  penalizacion_rescision: false,
  preferencias_fiscales: "",
};

export default function NewDocumentPage() {
  // Toast para notificaciones
  const { success, error: showError } = useToast();
  
  // Estado del wizard
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Estados remotos
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState<{
    contrato: string;
    pdfUrl?: string | null;
    documentId?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-guardar borrador
  useEffect(() => {
    const draftKey = "document-draft";
    
    // Cargar borrador al montar
    const saved = localStorage.getItem(draftKey);
    if (saved && !result) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
      } catch (e) {
        // Ignorar errores de parseo
      }
    }
  }, []);

  useEffect(() => {
    // Guardar borrador cada 2 segundos
    const timeout = setTimeout(() => {
      if (!result && !loading) {
        localStorage.setItem("document-draft", JSON.stringify(formData));
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [formData, result, loading]);

  // Limpiar borrador al generar
  useEffect(() => {
    if (result) {
      localStorage.removeItem("document-draft");
    }
  }, [result]);

  // Config de pasos
  const wizardSteps: WizardStep[] = [
    {
      id: "document-type",
      title: "Tipo de Documento",
      description: "Seleccioná el tipo de documento y configuración legal",
      isCompleted:
        formData.type && formData.jurisdiccion && formData.tono ? true : false,
    },
    {
      id: "parties-info",
      title: "Información de las Partes",
      description: "Datos del proveedor y cliente del contrato",
      isCompleted:
        formData.proveedor_nombre && formData.cliente_nombre ? true : false,
    },
    {
      id: "commercial-terms",
      title: "Condiciones Comerciales",
      description: "Términos económicos y cláusulas específicas",
      isCompleted:
        formData.descripcion_servicio && formData.monto_mensual ? true : false,
    },
    {
      id: "review-generate",
      title: "Revisar y Generar",
      description: "Confirmá los datos y generá el documento",
      isCompleted: false,
    },
  ];

  // Validación por paso
  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 0:
        return !!(formData.type && formData.jurisdiccion && formData.tono);
      case 1:
        return !!(
          formData.proveedor_nombre &&
          formData.proveedor_doc &&
          formData.proveedor_domicilio &&
          formData.cliente_nombre &&
          formData.cliente_doc &&
          formData.cliente_domicilio
        );
      case 2:
        return !!(
          formData.descripcion_servicio &&
          formData.monto_mensual &&
          formData.forma_pago &&
          formData.inicio_vigencia &&
          formData.preferencias_fiscales
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  // Mutador de formulario
  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Acción final: generar documento
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingProgress(0);
    setLoadingStep("Validando datos...");

    try {
      setLoadingProgress(25);
      setLoadingStep("Generando contenido con IA...");

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001";
      const res = await fetch(`${apiUrl}/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      setLoadingProgress(70);
      setLoadingStep("Creando PDF...");

      const json = await res.json();

      setLoadingProgress(90);
      setLoadingStep("Guardando documento...");

      if (!json.ok) {
        throw new Error("Error al generar el documento");
      }

      setLoadingProgress(100);
      setLoadingStep("¡Completado!");
      
      // Pequeño delay para mostrar 100%
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setResult(json);
      success("¡Documento generado exitosamente!");
      
      // 🎉 Confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10b981", "#059669", "#047857"],
      });
    } catch (err: any) {
      const errorMsg = err.message || "Error desconocido";
      setError(errorMsg);
      showError(`No se pudo generar el documento: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Contenido de cada paso (reestilizado claro)
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <WizardStepContent>
            <SectionTitle
              icon={<Scale className="h-5 w-5 text-emerald-500" />}
              label="Configuración Legal"
            />

            <Card>
              <div className="space-y-6">
                <div>
                  <Label className="text-sm text-neutral-300 mb-2 block">
                    Tipo de documento *
                  </Label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      updateFormData("type", e.target.value)
                    }
                    className={inputSelectClass}
                  >
                    <option value="">Seleccioná un tipo</option>
                    <option value="contrato_servicios">
                      Contrato de Servicios
                    </option>
                    <option value="contrato_suministro">
                      Contrato de Suministro
                    </option>
                    <option value="nda">
                      Acuerdo de Confidencialidad (NDA)
                    </option>
                    <option value="carta_documento">Carta Documento</option>
                    <option value="contrato_locacion">
                      Contrato de Locación
                    </option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-neutral-300 mb-2 block">
                      Jurisdicción *
                    </Label>
                    <select
                      value={formData.jurisdiccion}
                      onChange={(e) =>
                        updateFormData(
                          "jurisdiccion",
                          e.target.value
                        )
                      }
                      className={inputSelectClass}
                    >
                      <option value="">Seleccioná jurisdicción</option>
                      <option value="caba">
                        Ciudad Autónoma de Buenos Aires
                      </option>
                      <option value="buenos_aires">Buenos Aires</option>
                      <option value="cordoba">Córdoba</option>
                      <option value="santa_fe">Santa Fe</option>
                      <option value="mendoza">Mendoza</option>
                      <option value="corrientes_capital">
                        Corrientes Capital
                      </option>
                      <option value="posadas_misiones">
                        Posadas, Misiones
                      </option>
                    </select>
                  </div>

                  <div>
                    <Label className="text-sm text-neutral-300 mb-2 block">
                      Tono del documento *
                    </Label>
                    <select
                      value={formData.tono}
                      onChange={(e) =>
                        updateFormData("tono", e.target.value)
                      }
                      className={inputSelectClass}
                    >
                      <option value="">Seleccioná el tono</option>
                      <option value="formal">Formal y técnico</option>
                      <option value="comercial_claro">
                        Comercial y claro
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>
          </WizardStepContent>
        );

      case 1:
        return (
          <WizardStepContent>
            <SectionTitle
              icon={<Users className="h-5 w-5 text-emerald-500" />}
              label="Información de las Partes"
            />

            <Card className="space-y-6">
              {/* Parte Proveedora */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide border-b border-neutral-700 pb-2">
                  Parte Proveedora
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Nombre / Razón Social *"
                    placeholder="Ej: Estudio Contable Pérez"
                    value={formData.proveedor_nombre}
                    onChange={(v) =>
                      updateFormData("proveedor_nombre", v)
                    }
                  />

                  <Field
                    label="Documento / CUIT *"
                    placeholder="Ej: CUIT 20-12345678-9"
                    value={formData.proveedor_doc}
                    onChange={(v) =>
                      updateFormData("proveedor_doc", v)
                    }
                  />

                  <Field
                    label="Domicilio *"
                    placeholder="Ej: San Martín 123, Corrientes Capital"
                    value={formData.proveedor_domicilio}
                    onChange={(v) =>
                      updateFormData("proveedor_domicilio", v)
                    }
                    colSpan
                  />
                </div>
              </div>

              {/* Parte Cliente */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wide border-b border-neutral-700 pb-2">
                  Parte Cliente
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Nombre / Razón Social *"
                    placeholder="Ej: Transporte Gomez SRL"
                    value={formData.cliente_nombre}
                    onChange={(v) =>
                      updateFormData("cliente_nombre", v)
                    }
                  />

                  <Field
                    label="Documento / CUIT *"
                    placeholder="Ej: CUIT 30-99999999-7"
                    value={formData.cliente_doc}
                    onChange={(v) =>
                      updateFormData("cliente_doc", v)
                    }
                  />

                  <Field
                    label="Domicilio *"
                    placeholder="Ej: Av. Costanera 500, Posadas, Misiones"
                    value={formData.cliente_domicilio}
                    onChange={(v) =>
                      updateFormData("cliente_domicilio", v)
                    }
                    colSpan
                  />
                </div>
              </div>
            </Card>
          </WizardStepContent>
        );

      case 2:
        return (
          <WizardStepContent>
            <SectionTitle
              icon={<DollarSign className="h-5 w-5 text-emerald-500" />}
              label="Condiciones Comerciales"
            />

            <Card className="space-y-6">
              <div>
                <Label className="text-sm text-neutral-300 mb-2 block">
                  Descripción del Servicio / Objeto del Contrato *
                </Label>
                <Textarea
                  value={formData.descripcion_servicio}
                  onChange={(e) =>
                    updateFormData(
                      "descripcion_servicio",
                      e.target.value
                    )
                  }
                  placeholder="Ej: Asesoramiento contable mensual, liquidación de impuestos, presentaciones AFIP y Rentas provinciales..."
                  className={inputAreaClass}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Monto Mensual *"
                  placeholder="Ej: ARS 180000"
                  value={formData.monto_mensual}
                  onChange={(v) =>
                    updateFormData("monto_mensual", v)
                  }
                />

                <div>
                  <Label className="text-sm text-neutral-300 mb-2 block">
                    Forma de Pago *
                  </Label>
                    <select
                      value={formData.forma_pago}
                      onChange={(e) =>
                        updateFormData(
                          "forma_pago",
                          e.target.value
                        )
                      }
                      className={inputSelectClass}
                    >
                      <option value="">
                        Seleccioná forma de pago
                      </option>
                      <option value="transferencia_bancaria">
                        Transferencia Bancaria
                      </option>
                      <option value="efectivo">Efectivo</option>
                      <option value="cheque">Cheque</option>
                      <option value="mercado_pago">Mercado Pago</option>
                    </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field
                  label="Inicio de Vigencia *"
                  value={formData.inicio_vigencia}
                  onChange={(v) =>
                    updateFormData("inicio_vigencia", v)
                  }
                  type="date"
                />

                <Field
                  label="Plazo Mínimo (meses) *"
                  value={formData.plazo_minimo_meses}
                  onChange={(v) =>
                    updateFormData(
                      "plazo_minimo_meses",
                      parseInt(v) || 1
                    )
                  }
                  type="number"
                  min={1}
                />
              </div>

              <div className="flex items-start justify-between rounded-lg border border-neutral-700 bg-neutral-800 p-4">
                <div className="space-y-1 pr-4">
                  <Label className="text-sm text-white">
                    Penalización por rescisión anticipada
                  </Label>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    ¿El contrato incluye multa por finalización antes del
                    plazo mínimo?
                  </p>
                </div>
                <Switch
                  checked={formData.penalizacion_rescision}
                  onCheckedChange={(checked) =>
                    updateFormData(
                      "penalizacion_rescision",
                      checked
                    )
                  }
                />
              </div>

              {formData.penalizacion_rescision && (
                <div>
                  <Label className="text-sm text-neutral-300 mb-2 block">
                    Monto de Penalización *
                  </Label>
                  <Input
                    type="text"
                    value={formData.penalizacion_monto || ""}
                    onChange={(e) =>
                      updateFormData("penalizacion_monto", e.target.value)
                    }
                    placeholder="Ej: ARS 50000 o 2 meses de servicio"
                    className={inputBaseClasses}
                  />
                </div>
              )}

              <div>
                <Label className="text-sm text-neutral-300 mb-2 block">
                  Modalidad Facturación *
                </Label>
                <select
                  value={formData.preferencias_fiscales}
                  onChange={(e) =>
                    updateFormData(
                      "preferencias_fiscales",
                      e.target.value
                    )
                  }
                  className={inputSelectClass}
                >
                  <option value="">Seleccioná modalidad</option>
                  <option value="monotributo">Monotributo</option>
                  <option value="responsable_inscripto">
                    Responsable Inscripto
                  </option>
                  <option value="exento">Exento</option>
                  <option value="precio_mas_impuestos">
                    Precio + Impuestos
                  </option>
                </select>
              </div>
            </Card>
          </WizardStepContent>
        );

      case 3:
        return (
          <WizardStepContent>
            <SectionTitle
              icon={<FileText className="h-5 w-5 text-emerald-500" />}
              label="Revisar y Generar"
            />

            {/* resultado o error */}
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-start gap-2 shadow-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result ? (
              <Card className="space-y-4 border-teal-200">
                <div className="flex items-start gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-50 ring-1 ring-inset ring-teal-600/20">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      ¡Documento generado exitosamente!
                    </h3>
                    <p className="text-xs text-gray-600">
                      ID:{" "}
                      <code className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-800">
                        {result.documentId}
                      </code>
                    </p>
                  </div>
                </div>

                {result.pdfUrl && (
                  <div>
                    <a
                      href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001"}/documents/${result.documentId}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm ring-1 ring-inset ring-teal-700/30 hover:bg-teal-500 hover:shadow-md transition-all"
                    >
                      <Download className="h-4 w-4" />
                      Descargar PDF
                    </a>
                  </div>
                )}

                <details className="text-sm">
                  <summary className="cursor-pointer text-teal-700 hover:text-emerald-500 text-sm font-medium">
                    Ver contenido del contrato
                  </summary>
                  <div className="mt-3 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-4 font-mono text-xs leading-relaxed text-gray-800 shadow-inner whitespace-pre-wrap">
                    {result.contrato}
                  </div>
                </details>
              </Card>
            ) : loading ? (
              <Card className="space-y-6">
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="relative mb-6">
                    <div className="w-24 h-24 border-4 border-neutral-700 rounded-full animate-spin border-t-emerald-500"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-emerald-500">{loadingProgress}%</span>
                    </div>
                  </div>
                  <p className="text-base text-neutral-300 font-medium">{loadingStep}</p>
                  <div className="mt-4 w-full max-w-xs bg-neutral-800 rounded-full h-2">
                    <div 
                      className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <SummaryItem
                    label="Tipo"
                    value={formData.type || "—"}
                  />
                  <SummaryItem
                    label="Jurisdicción"
                    value={formData.jurisdiccion || "—"}
                  />
                  <SummaryItem
                    label="Tono"
                    value={formData.tono || "—"}
                  />
                  <SummaryItem
                    label="Proveedor"
                    value={formData.proveedor_nombre || "—"}
                  />
                  <SummaryItem
                    label="Cliente"
                    value={formData.cliente_nombre || "—"}
                  />
                  <SummaryItem
                    label="Monto"
                    value={formData.monto_mensual || "—"}
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-neutral-300 leading-relaxed">
                  Al hacer clic en{" "}
                  <span className="font-medium text-gray-900">
                    "Generar Documento"
                  </span>{" "}
                  se creará tu contrato legal personalizado usando IA. El
                  proceso toma aprox. 10–30 segundos.
                </div>
              </Card>
            )}
          </WizardStepContent>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardShell
      title="Crear documento legal"
      description="Generá contratos profesionales con IA en cuatro pasos simples."
      action={null}
    >
      {/* Wizard (pasos + contenido dinámico) */}
      <div className="flex justify-center">
        <div className="w-full max-w-4xl space-y-8">
          <Wizard
            steps={wizardSteps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            canProceed={validateCurrentStep()}
            isLoading={loading}
            onComplete={handleGenerate}
            completeButtonText="Generar documento"
          >
            {renderStepContent()}
          </Wizard>
        </div>
      </div>
    </DashboardShell>
  );
}

/* ------------------ Subcomponentes de estilo reutilizables ------------------ */

const inputBaseClasses =
  "w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2.5 text-sm text-white shadow-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500";

const inputSelectClass = inputBaseClasses;
const inputAreaClass = inputBaseClasses + " min-h-[100px]";

function Field({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  min,
  colSpan,
}: {
  label: string;
  placeholder?: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  colSpan?: boolean;
}) {
  return (
    <div className={colSpan ? "md:col-span-2" : ""}>
      <Label className="text-sm text-neutral-300 mb-2 block">{label}</Label>
      <Input
        type={type}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputBaseClasses}
      />
    </div>
  );
}

function SectionTitle({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white">
      {icon}
      <span>{label}</span>
    </div>
  );
}

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={
        "rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-sm ring-1 ring-black/[0.02] " +
        className
      }
    >
      {children}
    </div>
  );
}

function SummaryItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-[11px] uppercase font-medium text-neutral-400 tracking-wide">
        {label}
      </span>
      <span className="text-sm font-medium text-white">{value}</span>
    </div>
  );
}
