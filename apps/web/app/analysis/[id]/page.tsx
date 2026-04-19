"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ScanSearch, ArrowLeft, FileText, Users, Calendar, ListChecks,
  ShieldAlert, ShieldX, Lightbulb, AlertTriangle, CheckCircle2,
  AlertCircle, Loader2, Trash2, MessageSquare, Send,
} from "lucide-react";
import Link from "next/link";
import { getContractAnalysis, deleteContractAnalysis, askContractAnalysis, type ContractAnalysis, type AnalysisResult } from "@/app/lib/webApi";
import { cn } from "@/app/lib/utils";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ─── Config ───────────────────────────────────────────────────────────────────

const OVERALL_RISK_CONFIG = {
  low:    { label: "Riesgo Bajo",   icon: CheckCircle2, color: "text-emerald-600 dark:text-emerald-400",  bg: "bg-emerald-50 dark:bg-emerald-950/30",  border: "border-emerald-200 dark:border-emerald-800/50" },
  medium: { label: "Riesgo Medio",  icon: AlertTriangle, color: "text-yellow-600 dark:text-yellow-400",  bg: "bg-yellow-50 dark:bg-yellow-950/30",    border: "border-yellow-200 dark:border-yellow-800/50"  },
  high:   { label: "Riesgo Alto",   icon: ShieldAlert,  color: "text-red-600 dark:text-red-400",          bg: "bg-red-50 dark:bg-red-950/30",          border: "border-red-200 dark:border-red-800/50"        },
};

const CLAUSE_RISK_CONFIG = {
  Alta:  { badge: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800/50",      border: "border-red-200 dark:border-red-800/40"    },
  Media: { badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50", border: "border-yellow-200 dark:border-yellow-800/40" },
  Baja:  { badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700", border: "border-slate-200 dark:border-slate-700"    },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalysisDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();

  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Chat de seguimiento
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const fetchAnalysis = async () => {
      try {
        const data = await getContractAnalysis(id);
        if (!isMounted) return data.status;
        setAnalysis(data);
        return data.status;
      } catch (err: any) {
        if (isMounted) setError(err.message ?? "Error al cargar el análisis");
        return "error";
      }
    };

    // Initial load
    fetchAnalysis().then((status) => {
      if (isMounted) setLoading(false);
      // If still processing, start polling every 3 s
      if (status === "processing" || status === "pending") {
        pollInterval = setInterval(async () => {
          if (!isMounted) { clearInterval(pollInterval!); return; }
          try {
            const updated = await getContractAnalysis(id);
            if (!isMounted) return;
            setAnalysis(updated);
            if (updated.status === "done" || updated.status === "error") {
              clearInterval(pollInterval!);
              pollInterval = null;
            }
          } catch {
            // ignore transient poll errors
          }
        }, 3000);
      }
    });

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [id]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteContractAnalysis(id);
      toastSuccess("Análisis eliminado");
      router.push("/analysis");
    } catch (err: any) {
      toastError(`Error al eliminar: ${err.message}`);
      setDeleting(false);
      setShowDelete(false);
    }
  };

  const handleAsk = async () => {
    const q = chatInput.trim();
    if (!q || chatLoading) return;
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", text: q }]);
    setChatLoading(true);
    try {
      const answer = await askContractAnalysis(id, q);
      setChatMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", text: "No pude responder. Intentá de nuevo." }]);
    } finally {
      setChatLoading(false);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <p className="text-slate-600 dark:text-slate-400">{error ?? "Análisis no encontrado"}</p>
        <Link href="/analysis" className="text-sm font-semibold text-primary hover:underline">
          ← Volver a análisis
        </Link>
      </div>
    );
  }

  if (analysis.status === "processing" || analysis.status === "pending") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center gap-5 p-6">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
            Analizando con IA…
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">
            Claude está leyendo <span className="font-medium text-slate-700 dark:text-slate-300">{analysis.originalName}</span>.
            Esto toma alrededor de 20–40 segundos — la página se actualiza automáticamente.
          </p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-primary/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <Link href="/analysis" className="text-sm text-slate-400 hover:text-primary transition-colors mt-2">
          ← Volver a análisis
        </Link>
      </div>
    );
  }

  if (analysis.status === "error") {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex flex-col items-center justify-center gap-4">
        <AlertCircle className="w-12 h-12 text-red-400" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Error en el análisis</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
          {analysis.errorMessage ?? "Ocurrió un error al analizar el contrato."}
        </p>
        <Link href="/analysis" className="text-sm font-semibold text-primary hover:underline">
          ← Volver a análisis
        </Link>
      </div>
    );
  }

  const result = analysis.result;
  if (!result) return null;

  const riskCfg = OVERALL_RISK_CONFIG[result.overallRisk] ?? OVERALL_RISK_CONFIG.medium;
  const RiskIcon = riskCfg.icon;

  const uploadDate = new Date(analysis.createdAt).toLocaleDateString("es-AR", {
    day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-6 lg:p-8">
      {/* Back + header */}
      <div className="mb-6">
        <Link
          href="/analysis"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a análisis
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ScanSearch className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {analysis.originalName}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {result.contractType} · Analizado el {uploadDate}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Eliminar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ── Left column ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Overall risk + summary */}
          <div className={cn(
            "rounded-2xl border p-5",
            riskCfg.bg, riskCfg.border
          )}>
            <div className="flex items-center gap-2 mb-3">
              <RiskIcon className={cn("w-5 h-5", riskCfg.color)} />
              <span className={cn("text-base font-bold", riskCfg.color)}>
                {riskCfg.label}
              </span>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {result.summary}
            </p>
          </div>

          {/* Risky clauses */}
          {result.riskyClausesMain.length > 0 && (
            <Section
              icon={<ShieldAlert className="w-4 h-4 text-orange-500" />}
              title={`Cláusulas de Riesgo (${result.riskyClausesMain.length})`}
            >
              <div className="space-y-4">
                {result.riskyClausesMain.map((clause, i) => {
                  const cfg = CLAUSE_RISK_CONFIG[clause.risk] ?? CLAUSE_RISK_CONFIG.Baja;
                  return (
                    <div key={i} className={cn("rounded-xl border p-4", cfg.border)}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {clause.title}
                        </h4>
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0", cfg.badge)}>
                          {clause.risk}
                        </span>
                      </div>
                      {clause.text && (
                        <blockquote className="text-xs text-slate-500 dark:text-slate-400 italic border-l-2 border-slate-300 dark:border-slate-600 pl-3 mb-3">
                          "{clause.text}"
                        </blockquote>
                      )}
                      <div className="space-y-2">
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">Análisis: </span>{clause.explanation}
                        </p>
                        <p className="text-xs text-primary dark:text-primary">
                          <span className="font-semibold">Recomendación: </span>{clause.recommendation}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* Missing clauses */}
          {result.missingClauses.length > 0 && (
            <Section
              icon={<ShieldX className="w-4 h-4 text-red-500" />}
              title={`Cláusulas Faltantes (${result.missingClauses.length})`}
            >
              <div className="space-y-3">
                {result.missingClauses.map((clause, i) => {
                  const cfg = CLAUSE_RISK_CONFIG[clause.importance] ?? CLAUSE_RISK_CONFIG.Baja;
                  return (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <AlertTriangle className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                            {clause.title}
                          </span>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full border", cfg.badge)}>
                            {clause.importance}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400">{clause.explanation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {/* General recommendations */}
          {result.generalRecommendations.length > 0 && (
            <Section
              icon={<Lightbulb className="w-4 h-4 text-yellow-500" />}
              title="Recomendaciones Generales"
            >
              <ul className="space-y-2">
                {result.generalRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          {/* Parties */}
          {result.parties.length > 0 && (
            <SmallSection icon={<Users className="w-4 h-4 text-primary" />} title="Partes">
              <ul className="space-y-1">
                {result.parties.map((p, i) => (
                  <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </span>
                    {p}
                  </li>
                ))}
              </ul>
            </SmallSection>
          )}

          {/* Key dates */}
          {result.keyDates.length > 0 && (
            <SmallSection icon={<Calendar className="w-4 h-4 text-primary" />} title="Fechas Clave">
              <ul className="space-y-2">
                {result.keyDates.map((kd, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 text-sm">
                    <span className="text-slate-500 dark:text-slate-400">{kd.label}</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">{kd.date}</span>
                  </li>
                ))}
              </ul>
            </SmallSection>
          )}

          {/* Main obligations */}
          {result.mainObligations.length > 0 && (
            <SmallSection icon={<ListChecks className="w-4 h-4 text-primary" />} title="Obligaciones Principales">
              <ul className="space-y-2">
                {result.mainObligations.map((ob, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {ob}
                  </li>
                ))}
              </ul>
            </SmallSection>
          )}

          {/* File info */}
          <SmallSection icon={<FileText className="w-4 h-4 text-slate-400" />} title="Archivo">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Nombre</span>
                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[180px]">{analysis.originalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tamaño</span>
                <span className="text-slate-700 dark:text-slate-300">{Math.round(analysis.fileSize / 1024)} KB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Analizado</span>
                <span className="text-slate-700 dark:text-slate-300">{uploadDate}</span>
              </div>
            </div>
          </SmallSection>
        </div>
      </div>

      {/* ── Chat de seguimiento ── */}
      <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Preguntale a la IA sobre este contrato</h3>
        </div>

        {/* Mensajes */}
        {chatMessages.length > 0 && (
          <div className="px-5 py-4 space-y-3 max-h-80 overflow-y-auto">
            {chatMessages.map((m, i) => (
              <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                )}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}

        {/* Input */}
        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); } }}
            placeholder="Ej: ¿Qué pasa si rescindo antes del plazo?"
            disabled={chatLoading}
            className="flex-1 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
          />
          <button
            onClick={handleAsk}
            disabled={!chatInput.trim() || chatLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-colors"
          >
            {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Eliminar análisis"
        description={`¿Eliminás el análisis de "${analysis.originalName}"? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        variant="destructive"
        isLoading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  );
}

// ─── Section components ───────────────────────────────────────────────────────

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
        {icon}
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function SmallSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800">
        {icon}
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
