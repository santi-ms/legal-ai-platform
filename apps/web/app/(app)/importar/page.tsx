"use client";

import { useState, useRef, useCallback } from "react";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, ArrowRight,
  ArrowLeft, Loader2, Download, Users, Briefcase, DollarSign,
  X, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/app/lib/utils";
import {
  ImportType, ImportValidateResult, ImportExecuteResult,
  validateImport, executeImport, getImportTemplateUrl,
} from "@/app/lib/webApi";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

const IMPORT_TYPES: { value: ImportType; label: string; description: string; icon: any; color: string }[] = [
  {
    value: "clients",
    label: "Clientes",
    description: "Nombre, DNI/CUIT, email, teléfono, domicilio",
    icon: Users,
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  {
    value: "expedientes",
    label: "Expedientes",
    description: "Carátula, número, materia, tribunal, estado",
    icon: Briefcase,
    color: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  },
  {
    value: "honorarios",
    label: "Honorarios",
    description: "Concepto, monto, estado, fechas de emisión y cobro",
    icon: DollarSign,
    color: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
];

const FIELD_LABELS: Record<string, string> = {
  // clients
  name: "Nombre", documentNumber: "DNI/CUIT", documentType: "Tipo doc.",
  email: "Email", phone: "Teléfono", address: "Domicilio", city: "Ciudad",
  province: "Provincia", type: "Tipo persona", notes: "Notas",
  // expedientes
  title: "Carátula", number: "Nº expediente", matter: "Materia",
  status: "Estado", court: "Juzgado", judge: "Juez",
  opposingParty: "Parte contraria", openedAt: "Fecha inicio", deadline: "Vencimiento",
  // honorarios
  concepto: "Concepto", tipo: "Tipo", monto: "Monto", moneda: "Moneda",
  estado: "Estado", fechaEmision: "Fecha emisión", fechaVencimiento: "Vencimiento",
};

// ─── Componente principal ─────────────────────────────────────────────────────

export default function ImportarPage() {
  const { success, error: showError } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [selectedType, setSelectedType] = useState<ImportType | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [validating, setValidating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [validation, setValidation] = useState<ImportValidateResult | null>(null);
  const [result, setResult] = useState<ImportExecuteResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Drag & drop ────────────────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }, []);

  // ── Step 2: validate ───────────────────────────────────────────────────────
  async function handleValidate() {
    if (!file || !selectedType) return;
    setValidating(true);
    try {
      const result = await validateImport(file, selectedType);
      setValidation(result);
      setStep(3);
    } catch (err: any) {
      showError(err?.message || "No se pudo procesar el archivo");
    } finally {
      setValidating(false);
    }
  }

  // ── Step 3: execute ────────────────────────────────────────────────────────
  async function handleExecute() {
    if (!file || !selectedType) return;
    setExecuting(true);
    try {
      const res = await executeImport(file, selectedType, true);
      setResult(res);
      setStep(4);
      if (res.created > 0) {
        success(`✅ ${res.created} registros importados correctamente`);
      }
    } catch (err: any) {
      showError(err?.message || "Error durante la importación");
    } finally {
      setExecuting(false);
    }
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function reset() {
    setStep(1);
    setSelectedType(null);
    setFile(null);
    setValidation(null);
    setResult(null);
  }

  const typeInfo = IMPORT_TYPES.find((t) => t.value === selectedType);

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      {/* Header */}
      <PageHeader
        icon={FileSpreadsheet}
        iconGradient="primary"
        title="Importar datos"
        description="Subí tu planilla de Excel o CSV para migrar clientes, expedientes u honorarios en bloque. Revisamos los datos y te mostramos los errores antes de importar."
      />

      {/* Step indicator */}
      <StepBar current={step} />

      {/* ── STEP 1: elegir tipo ─────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="font-semibold text-slate-900 dark:text-white">¿Qué querés importar?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {IMPORT_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={cn(
                    "rounded-2xl border-2 p-5 text-left transition-all",
                    selectedType === t.value
                      ? "border-primary bg-primary/5 dark:bg-primary/10 shadow-md"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900",
                  )}
                >
                  <div className={cn("size-10 rounded-xl flex items-center justify-center mb-3", t.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-white">{t.label}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{t.description}</p>
                </button>
              );
            })}
          </div>

          {selectedType && (
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                <span className="font-medium">¿Primera vez?</span> Descargá la plantilla con los headers correctos:
              </div>
              <a
                href={getImportTemplateUrl(selectedType)}
                download
                className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                <Download className="w-4 h-4" />
                Plantilla {typeInfo?.label}
              </a>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={!selectedType}
              className="flex items-center gap-2"
            >
              Continuar <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: subir archivo ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(1)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-slate-900 dark:text-white">
              Subir archivo de {typeInfo?.label.toLowerCase()}
            </h2>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all",
              dragging
                ? "border-primary bg-primary/5 dark:bg-primary/10"
                : file
                ? "border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                : "border-slate-300 dark:border-slate-700 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-800/50",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
            />
            {file ? (
              <div className="space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <p className="font-semibold text-slate-900 dark:text-white">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 mx-auto mt-1"
                >
                  <X className="w-3 h-3" /> Cambiar archivo
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="font-medium text-slate-600 dark:text-slate-400">
                  Arrastrá tu archivo acá o <span className="text-primary">hacé clic para buscar</span>
                </p>
                <p className="text-xs text-slate-400">Excel (.xlsx, .xls) o CSV — máx. 10MB, hasta 1000 filas</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
            </Button>
            <Button onClick={handleValidate} disabled={!file || validating}>
              {validating ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analizando...</>
              ) : (
                <>Analizar archivo <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: preview + confirmación ─────────────────────────────────── */}
      {step === 3 && validation && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setStep(2)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h2 className="font-semibold text-slate-900 dark:text-white">Revisar importación</h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatBadge label="Total filas" value={validation.totalRows} color="slate" />
            <StatBadge label="Se van a crear" value={validation.willCreate} color="emerald" />
            <StatBadge label="Duplicados (se saltean)" value={validation.duplicateCandidates} color="amber" />
            <StatBadge label="Con errores" value={validation.errorRows} color="red" />
          </div>

          {/* Mapping */}
          {Object.keys(validation.mapping).length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Columnas detectadas
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(validation.mapping).map(([excel, db]) => (
                  <div key={excel} className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{excel}</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="font-semibold text-primary">{FIELD_LABELS[db] ?? db}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errores */}
          {validation.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 p-4 space-y-2">
              <p className="text-sm font-semibold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                {validation.errors.length} fila{validation.errors.length !== 1 ? "s" : ""} con errores (se van a saltear)
              </p>
              <ul className="space-y-1">
                {validation.errors.slice(0, 5).map((e, i) => (
                  <li key={i} className="text-xs text-red-600 dark:text-red-400">
                    Fila {e.row}: <span className="font-medium">{FIELD_LABELS[e.field] ?? e.field}</span> — {e.message}
                  </li>
                ))}
                {validation.errors.length > 5 && (
                  <li className="text-xs text-red-400">... y {validation.errors.length - 5} más</li>
                )}
              </ul>
            </div>
          )}

          {/* Preview */}
          {validation.preview.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                Vista previa (primeras {validation.preview.length} filas válidas)
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      {Object.keys(validation.preview[0]).filter(k => k !== "_row").map((k) => (
                        <th key={k} className="text-left px-3 py-2 font-semibold text-slate-500">
                          {FIELD_LABELS[k] ?? k}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {validation.preview.map((row, i) => (
                      <tr key={i}>
                        {Object.entries(row).filter(([k]) => k !== "_row").map(([k, v]) => (
                          <td key={k} className="px-3 py-2 text-slate-700 dark:text-slate-300 max-w-[150px] truncate">
                            {v != null ? String(v) : <span className="text-slate-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {validation.willCreate === 0 ? (
            <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-900 p-4 text-sm text-amber-700 dark:text-amber-400">
              ⚠️ No hay registros nuevos para crear. Todos son duplicados o tienen errores.
            </div>
          ) : null}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Atrás
            </Button>
            <Button
              onClick={handleExecute}
              disabled={executing || validation.willCreate === 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {executing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Importando...</>
              ) : (
                <>Importar {validation.willCreate} registro{validation.willCreate !== 1 ? "s" : ""} <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: resultado ───────────────────────────────────────────────── */}
      {step === 4 && result && (
        <div className="space-y-4">
          <div className="text-center py-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              ¡Importación completada!
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Tus {typeInfo?.label.toLowerCase()} ya están disponibles en el sistema.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StatBadge label="Creados" value={result.created} color="emerald" large />
            <StatBadge label="Salteados (duplicados)" value={result.skipped} color="amber" large />
            <StatBadge label="Fallidos" value={result.failed} color="red" large />
          </div>

          {result.failedDetails.length > 0 && (
            <div className="bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900 p-4 space-y-1">
              <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">Filas con error:</p>
              {result.failedDetails.map((f, i) => (
                <p key={i} className="text-xs text-red-600 dark:text-red-400">Fila {f.row}: {f.reason}</p>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={reset}>
              Nueva importación
            </Button>
            <Button onClick={() => { window.location.href = `/${result.type}`; }}>
              Ver {typeInfo?.label} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Subcomponentes ───────────────────────────────────────────────────────────

function StepBar({ current }: { current: Step }) {
  const steps = [
    { n: 1, label: "Tipo" },
    { n: 2, label: "Archivo" },
    { n: 3, label: "Revisar" },
    { n: 4, label: "Listo" },
  ];
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center gap-0">
        {steps.map((s, i) => {
          const isActive = current === s.n;
          const isDone = current > s.n;
          return (
            <div key={s.n} className="flex items-center flex-1">
              <div className={cn(
                "flex items-center gap-2.5 text-sm font-semibold",
                isActive ? "text-slate-900 dark:text-slate-50" : isDone ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500",
              )}>
                <div className={cn(
                  "size-9 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                  isActive ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-110" :
                  isDone ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-sm" :
                  "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700",
                )}>
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.n}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn(
                  "flex-1 h-1 mx-2 rounded-full transition-colors",
                  isDone ? "bg-emerald-400 dark:bg-emerald-500" : "bg-slate-200 dark:bg-slate-800",
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatBadge({
  label, value, color, large,
}: {
  label: string; value: number; color: "emerald" | "amber" | "red" | "slate"; large?: boolean;
}) {
  const colors = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400",
    amber:   "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400",
    red:     "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400",
    slate:   "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300",
  };
  return (
    <div className={cn("rounded-xl border p-3 text-center", colors[color])}>
      <div className={cn("font-black", large ? "text-3xl" : "text-2xl")}>{value}</div>
      <div className="text-xs mt-0.5 opacity-80">{label}</div>
    </div>
  );
}
