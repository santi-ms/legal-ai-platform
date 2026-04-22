"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Shield, Swords,
  Clock, FileText, Target, Zap, BookOpen, TrendingUp, ExternalLink,
  AlertCircle, RefreshCw, TrendingDown, Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";
import { getEscrito, EscritoAnalisis, EstrategiaResult, NivelRiesgo } from "@/app/lib/webApi";

// ─── Constants ────────────────────────────────────────────────────────────────

const TIPO_LABELS: Record<string, string> = {
  demanda:       "Demanda",
  contestacion:  "Contestación",
  recurso:       "Recurso",
  alegato:       "Alegato",
  pericia:       "Pericia",
  resolucion:    "Resolución",
  otro:          "Otro",
};

const FORTALEZA_CONFIG = {
  alta:  { label: "Alta",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  media: { label: "Media", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  baja:  { label: "Baja",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

const SEVERIDAD_CONFIG = {
  alta:  { label: "Severo",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  media: { label: "Moderado", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  baja:  { label: "Leve",   color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

const RIESGO_CONFIG = {
  alto:  { label: "Alto",  color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  medio: { label: "Medio", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
  bajo:  { label: "Bajo",  color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
};

const NIVEL_RIESGO_BADGE: Record<NivelRiesgo, { label: string; classes: string; icon: any }> = {
  alto:  { label: "Riesgo alto",  classes: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",     icon: AlertTriangle },
  medio: { label: "Riesgo medio", classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800", icon: AlertTriangle },
  bajo:  { label: "Riesgo bajo",  classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800", icon: CheckCircle2 },
};

const DOC_TIPO_LABELS: Record<string, string> = {
  contestacion_demanda:   "Contestación de demanda",
  recurso_apelacion:      "Recurso de apelación",
  recurso_revocatoria:    "Recurso de revocatoria",
  excepcion:              "Excepción procesal",
  incidente:              "Incidente",
  medida_cautelar:        "Medida cautelar",
  informe_pericial:       "Informe pericial",
  alegato:                "Alegato",
  carta_documento:        "Carta documento",
  poder:                  "Poder notarial",
};

// ─── Probability Bar ──────────────────────────────────────────────────────────

function ProbBar({ value, size = "md" }: { value: number; size?: "sm" | "md" | "lg" }) {
  const clamped = Math.max(0, Math.min(100, value));
  const color =
    clamped >= 70 ? "bg-emerald-500" :
    clamped >= 45 ? "bg-amber-400"   :
                    "bg-red-400";
  const textColor =
    clamped >= 70 ? "text-emerald-600 dark:text-emerald-400" :
    clamped >= 45 ? "text-amber-600  dark:text-amber-400"   :
                    "text-red-600    dark:text-red-400";
  const heights = { sm: "h-1.5", md: "h-2", lg: "h-3" };

  return (
    <div className="flex items-center gap-2">
      <div className={cn("flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden", heights[size])}>
        <div
          className={cn("h-full rounded-full transition-all duration-700", color)}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className={cn("font-bold tabular-nums flex-shrink-0", textColor, size === "lg" ? "text-base" : "text-xs")}>
        {clamped}%
      </span>
    </div>
  );
}

// ─── Global Probability Widget ────────────────────────────────────────────────

function GlobalProbWidget({
  probabilidadGlobal,
  confianzaAnalisis,
  resumenProbabilidad,
  nivelRiesgo,
}: {
  probabilidadGlobal:   number;
  confianzaAnalisis:    "alta" | "media" | "baja";
  resumenProbabilidad:  string;
  nivelRiesgo:          "alto" | "medio" | "bajo";
}) {
  const pct = Math.max(0, Math.min(100, probabilidadGlobal));

  const probColor =
    pct >= 70 ? "from-emerald-500 to-teal-500"   :
    pct >= 45 ? "from-amber-400   to-orange-400"  :
                "from-red-500     to-rose-500";

  const probLabel =
    pct >= 70 ? "Favorable"    :
    pct >= 45 ? "Incierto"     :
                "Desfavorable";

  const confianzaColors = {
    alta:  "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    media: "bg-amber-100   text-amber-700   dark:bg-amber-900/30   dark:text-amber-400",
    baja:  "bg-slate-100   text-slate-600   dark:bg-slate-800      dark:text-slate-400",
  };

  // SVG arc for the gauge
  const radius   = 52;
  const cx = 64; const cy = 64;
  const startAngle = -210;
  const endAngle   = 30;
  const totalArc   = endAngle - startAngle; // 240°
  const fillArc    = totalArc * (pct / 100);
  const toRad      = (deg: number) => (deg * Math.PI) / 180;

  const arcPath = (start: number, end: number) => {
    const x1 = cx + radius * Math.cos(toRad(start));
    const y1 = cy + radius * Math.sin(toRad(start));
    const x2 = cx + radius * Math.cos(toRad(end));
    const y2 = cy + radius * Math.sin(toRad(end));
    const large = end - start > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5">
      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
        {/* Gauge SVG */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1">
          <svg width="128" height="90" viewBox="0 0 128 90" className="overflow-visible">
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor={pct >= 70 ? "#10b981" : pct >= 45 ? "#f59e0b" : "#ef4444"} />
                <stop offset="100%" stopColor={pct >= 70 ? "#14b8a6" : pct >= 45 ? "#f97316" : "#f43f5e"} />
              </linearGradient>
            </defs>
            {/* Track */}
            <path
              d={arcPath(startAngle, endAngle)}
              fill="none"
              stroke="currentColor"
              strokeWidth="10"
              strokeLinecap="round"
              className="text-slate-200 dark:text-slate-700"
            />
            {/* Fill */}
            {pct > 0 && (
              <path
                d={arcPath(startAngle, startAngle + fillArc)}
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth="10"
                strokeLinecap="round"
              />
            )}
            {/* Center text */}
            <text x={cx} y={cy + 6} textAnchor="middle" className="fill-slate-900 dark:fill-slate-100" fontSize="22" fontWeight="bold">
              {pct}%
            </text>
            <text x={cx} y={cy + 22} textAnchor="middle" className="fill-slate-500 dark:fill-slate-400" fontSize="10">
              {probLabel}
            </text>
          </svg>
          <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-semibold", confianzaColors[confianzaAnalisis])}>
            Confianza {confianzaAnalisis}
          </span>
        </div>

        {/* Text */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Probabilidad de éxito global
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            {resumenProbabilidad}
          </p>
          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">
              Estimación basada en la solidez jurídica del escrito analizado. No reemplaza el criterio profesional.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon: Icon,
  title,
  color,
  children,
}: {
  icon: any;
  title: string;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className={cn("px-5 py-3.5 flex items-center gap-3 border-b", color)}>
        <Icon className="w-5 h-5 flex-shrink-0" />
        <h2 className="font-semibold text-sm tracking-wide">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Processing State ─────────────────────────────────────────────────────────

function ProcessingState({ fileName }: { fileName: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-violet-100 dark:bg-violet-900/20 flex items-center justify-center">
          <Swords className="w-8 h-8 text-violet-600 dark:text-violet-400" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Loader2 className="w-7 h-7 text-violet-500 animate-spin" />
        </div>
      </div>
      <div className="text-center space-y-1.5">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Analizando escrito...</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          DocuLex Estratega está procesando <span className="font-medium text-slate-700 dark:text-slate-300">{fileName}</span>. Esto puede demorar 30–60 segundos.
        </p>
      </div>
      <div className="flex gap-1.5 mt-2">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorState({ message, onRetry }: { message: string | null; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
      <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <div className="text-center space-y-1.5">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Error en el análisis</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs">
          {message || "Ocurrió un error inesperado al procesar el escrito."}
        </p>
      </div>
      <Button variant="outline" onClick={onRetry} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Reintentar
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EstrategiaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();

  const [item, setItem]       = useState<EscritoAnalisis | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchItem = useCallback(async () => {
    try {
      const data = await getEscrito(id);
      setItem(data);
      setFetchErr(null);
      if (data.status === "done" || data.status === "error") stopPolling();
    } catch (err: any) {
      setFetchErr(err?.message ?? "Error al cargar el análisis");
      stopPolling();
    } finally {
      setLoading(false);
    }
  }, [id, stopPolling]);

  useEffect(() => {
    fetchItem();
    return () => stopPolling();
  }, [fetchItem, stopPolling]);

  // Start polling when item is pending/processing
  useEffect(() => {
    if (!item) return;
    if (item.status === "pending" || item.status === "processing") {
      if (!pollRef.current) {
        pollRef.current = setInterval(fetchItem, 4000);
      }
    } else {
      stopPolling();
    }
  }, [item?.status, fetchItem, stopPolling]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (fetchErr || !item) {
    return (
      <ErrorState
        message={fetchErr ?? "No se encontró el análisis."}
        onRetry={fetchItem}
      />
    );
  }

  // ── Processing ───────────────────────────────────────────────────────────
  if (item.status === "pending" || item.status === "processing") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/estrategia" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
        <ProcessingState fileName={item.originalName} />
      </div>
    );
  }

  // ── Error (from analysis) ─────────────────────────────────────────────────
  if (item.status === "error") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/estrategia" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Volver
          </Link>
        </div>
        <ErrorState message={item.errorMessage} onRetry={() => router.push("/estrategia")} />
      </div>
    );
  }

  const r = item.result as EstrategiaResult;
  const riskCfg = NIVEL_RIESGO_BADGE[r.nivelRiesgo] ?? NIVEL_RIESGO_BADGE.medio;
  const RiskIcon = riskCfg.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        <Link
          href="/estrategia"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors w-fit"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Estrategia
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold", riskCfg.classes)}>
                <RiskIcon className="w-3.5 h-3.5" />
                {riskCfg.label}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {TIPO_LABELS[item.tipoEscrito] ?? item.tipoEscrito}
              </span>
              {item.materia && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  {item.materia}
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
              {item.originalName}
            </h1>
            {item.expediente && (
              <Link
                href={`/expedientes/${item.expediente.id}`}
                className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 dark:text-violet-400 font-medium"
              >
                <FileText className="w-3.5 h-3.5" />
                {item.expediente.title}
                {item.expediente.number && ` · ${item.expediente.number}`}
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
            )}
          </div>

          {/* "Generar contestación" button */}
          <div className="flex-shrink-0">
            <Link href="/documents/new">
              <Button className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20">
                <Swords className="w-4 h-4" />
                Generar escrito
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Probabilidad Global ──────────────────────────────────────────────── */}
      {r.probabilidadGlobal != null && (
        <GlobalProbWidget
          probabilidadGlobal={r.probabilidadGlobal}
          confianzaAnalisis={r.confianzaAnalisis ?? "media"}
          resumenProbabilidad={r.resumenProbabilidad ?? ""}
          nivelRiesgo={r.nivelRiesgo}
        />
      )}

      {/* ── Resumen ──────────────────────────────────────────────────────────── */}
      <SectionCard
        icon={BookOpen}
        title="Resumen del escrito"
        color="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300"
      >
        <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
          <p className="leading-relaxed">{r.resumen}</p>
          {r.parteContraria && (
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Parte contraria:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{r.parteContraria}</span>
            </div>
          )}
          {r.tipoEscritoDetectado && r.tipoEscritoDetectado !== item.tipoEscrito && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo detectado:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{r.tipoEscritoDetectado}</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ── Pretensiones ──────────────────────────────────────────────────────── */}
      {r.pretensiones?.length > 0 && (
        <SectionCard
          icon={Target}
          title={`Pretensiones de la parte contraria (${r.pretensiones.length})`}
          color="border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400"
        >
          <div className="space-y-3">
            {r.pretensiones.map((p, i) => {
              const cfg = FORTALEZA_CONFIG[p.fortaleza] ?? FORTALEZA_CONFIG.media;
              return (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold">
                      {i + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.pretension}</p>
                      <span className={cn("flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium", cfg.color)}>
                        Fortaleza {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.fundamento}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Puntos débiles ────────────────────────────────────────────────────── */}
      {r.puntosDebiles?.length > 0 && (
        <SectionCard
          icon={AlertTriangle}
          title={`Puntos débiles del escrito contrario (${r.puntosDebiles.length})`}
          color="border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400"
        >
          <div className="space-y-3">
            {r.puntosDebiles.map((p, i) => {
              const cfg = SEVERIDAD_CONFIG[p.severidad] ?? SEVERIDAD_CONFIG.media;
              return (
                <div key={i} className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{p.punto}</p>
                      <span className={cn("flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium", cfg.color)}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{p.explicacion}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Defensas sugeridas ────────────────────────────────────────────────── */}
      {r.defensasSugeridas?.length > 0 && (
        <SectionCard
          icon={Shield}
          title={`Defensas sugeridas (${r.defensasSugeridas.length})`}
          color="border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400"
        >
          <div className="space-y-3">
            {r.defensasSugeridas.map((d, i) => {
              const cfg  = RIESGO_CONFIG[d.riesgo] ?? RIESGO_CONFIG.medio;
              const prob = d.probabilidadExito ?? null;
              return (
                <div key={i} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                        {i + 1}
                      </span>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{d.defensa}</p>
                    </div>
                    <span className={cn("flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium", cfg.color)}>
                      Riesgo {cfg.label}
                    </span>
                  </div>

                  {/* Probability bar */}
                  {prob != null && (
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Probabilidad de éxito
                      </p>
                      <ProbBar value={prob} size="md" />
                    </div>
                  )}

                  {/* Fundamento */}
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{d.fundamento}</p>

                  {/* Factores favorables / desfavorables */}
                  {(d.factoresFavorables || d.factoresDesfavorables) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {d.factoresFavorables && (
                        <div className="flex gap-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-emerald-700 dark:text-emerald-400 leading-relaxed">{d.factoresFavorables}</p>
                        </div>
                      )}
                      {d.factoresDesfavorables && (
                        <div className="flex gap-1.5 p-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                          <TrendingDown className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-red-600 dark:text-red-400 leading-relaxed">{d.factoresDesfavorables}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Normativa */}
                  {d.normativa && (
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-700">
                      <BookOpen className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{d.normativa}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {/* ── Plazos críticos ───────────────────────────────────────────────────── */}
      {r.plazosCriticos?.length > 0 && (
        <SectionCard
          icon={Clock}
          title="Plazos críticos"
          color="border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {r.plazosCriticos.map((p, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  p.urgencia === "urgente"
                    ? "bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/40"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800"
                )}
              >
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold",
                  p.urgencia === "urgente"
                    ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"
                    : "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                )}>
                  {p.diasHabiles}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug">{p.descripcion}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-500 dark:text-slate-400">{p.diasHabiles} días hábiles</span>
                    {p.urgencia === "urgente" && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 uppercase tracking-wide">
                        Urgente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Estrategia táctica ────────────────────────────────────────────────── */}
      {r.estrategia && (
        <SectionCard
          icon={Zap}
          title="Estrategia táctica recomendada"
          color="border-violet-100 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-900/10 text-violet-700 dark:text-violet-400"
        >
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{r.estrategia}</p>
        </SectionCard>
      )}

      {/* ── Documentos recomendados ───────────────────────────────────────────── */}
      {r.documentosRecomendados?.length > 0 && (
        <SectionCard
          icon={TrendingUp}
          title="Documentos recomendados para generar"
          color="border-indigo-100 dark:border-indigo-900/40 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400"
        >
          <div className="space-y-3">
            {r.documentosRecomendados.map((doc, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <FileText className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {DOC_TIPO_LABELS[doc.tipo] ?? doc.tipo.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{doc.justificacion}</p>
                </div>
                <Link href="/documents/new">
                  <Button size="sm" variant="outline" className="gap-1.5 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 flex-shrink-0">
                    <Swords className="w-3 h-3" />
                    Generar
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── Bottom CTA ────────────────────────────────────────────────────────── */}
      <div className="flex justify-center pt-2 pb-8">
        <Link href="/documents/new">
          <Button size="lg" className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 px-8">
            <Swords className="w-5 h-5" />
            Ir a Doku Genera
          </Button>
        </Link>
      </div>

    </div>
  );
}
