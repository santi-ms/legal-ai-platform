"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Play,
  Sparkles,
  FileText,
  Shield,
  CheckCircle2,
  MessageSquare,
  X,
  Bot,
  User,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Demo interactiva ─────────────────────────────────────────────────────────

interface DemoMessage {
  role: "user" | "assistant";
  content: string;
}

const DEMO_SCENARIOS: Record<string, DemoMessage[]> = {
  alquiler: [
    { role: "user", content: "Necesito un contrato de alquiler" },
    {
      role: "assistant",
      content:
        "¡Genial! Para armar tu contrato de locación necesito algunos datos. Empecemos:\n\n• ¿Cuál es el nombre completo del propietario (locador)?\n• ¿Y el nombre del inquilino (locatario)?",
    },
    { role: "user", content: "Propietario María García, inquilino Juan Pérez" },
    {
      role: "assistant",
      content:
        "Perfecto. Ahora necesito:\n\n• ¿Dirección del inmueble?\n• ¿Monto mensual del alquiler?\n• ¿Duración del contrato en meses?",
    },
    { role: "user", content: "Av. Corrientes 1234 3B, $500.000, 24 meses" },
    {
      role: "assistant",
      content:
        "¡Listo! Tengo todo lo necesario. Voy a generar tu contrato de locación ahora mismo.",
    },
  ],
  carta: [
    { role: "user", content: "Quiero hacer una carta documento" },
    {
      role: "assistant",
      content:
        "Entendido. Para tu carta documento necesito saber:\n\n• ¿Quién envía la carta (tu nombre o empresa)?\n• ¿A quién va dirigida?",
    },
    { role: "user", content: "La envío yo, Pedro Martínez, a la empresa TechSoft SRL" },
    {
      role: "assistant",
      content:
        "Perfecto, Pedro. Ahora contame:\n\n• ¿Cuál es el motivo de la carta?\n• ¿Qué le estás intimando o reclamando?",
    },
    {
      role: "user",
      content: "No me pagaron 3 meses de trabajo freelance. Reclamo $1.500.000",
    },
    {
      role: "assistant",
      content:
        "Tengo toda la información. Voy a generar tu carta documento con la intimación de pago correspondiente.",
    },
  ],
  nda: [
    { role: "user", content: "Necesito un acuerdo de confidencialidad" },
    {
      role: "assistant",
      content:
        "¡Perfecto! Para el NDA necesito:\n\n• ¿Quién revela la información confidencial?\n• ¿Quién la recibe?",
    },
    {
      role: "user",
      content: "Revela InnovateTech SA, recibe un desarrollador freelance, Lucas Gómez",
    },
    {
      role: "assistant",
      content:
        "Bien. Dos preguntas más:\n\n• ¿Con qué finalidad se comparte la información?\n• ¿Por cuántos años debe mantenerse la confidencialidad?",
    },
    {
      role: "user",
      content: "Para desarrollo de una app móvil, confidencialidad por 3 años",
    },
    {
      role: "assistant",
      content:
        "¡Listo! Voy a generar tu Acuerdo de Confidencialidad con todos los datos.",
    },
  ],
};

function DemoChat({ onClose }: { onClose: () => void }) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [visibleMessages, setVisibleMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [demoFinished, setDemoFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedScenario) return;

    const messages = DEMO_SCENARIOS[selectedScenario];
    let index = 0;

    function showNext() {
      if (index >= messages.length) {
        setDemoFinished(true);
        return;
      }

      const msg = messages[index];

      if (msg.role === "assistant") {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages((prev) => [...prev, msg]);
          index++;
          setTimeout(showNext, 800);
        }, 1200);
      } else {
        setVisibleMessages((prev) => [...prev, msg]);
        index++;
        setTimeout(showNext, 600);
      }
    }

    showNext();
  }, [selectedScenario]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages, isTyping]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Mirá cómo funciona
            </h3>
            <p className="text-xs text-slate-400">Demo interactiva del chat con IA</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-label="Cerrar demo"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-[300px] max-h-[400px]"
      >
        {!selectedScenario ? (
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl rounded-tl-sm px-4 py-2.5 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                ¡Hola! Soy tu asistente legal con IA. Elegí un ejemplo para ver cómo funciono:
              </div>
            </div>

            <div className="space-y-2 pl-9">
              {[
                { id: "alquiler", label: "Contrato de alquiler", desc: "Locación residencial" },
                { id: "carta", label: "Carta documento", desc: "Intimación de pago" },
                { id: "nda", label: "Acuerdo de confidencialidad", desc: "NDA empresarial" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors">
                    {s.label}
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {visibleMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""} animate-fade-in`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    msg.role === "assistant"
                      ? "bg-primary/10"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <Bot className="w-4 h-4 text-primary" />
                  ) : (
                    <User className="w-4 h-4 text-slate-500" />
                  )}
                </div>
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "assistant"
                      ? "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-tl-sm"
                      : "bg-primary text-white rounded-tr-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-primary" />
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {demoFinished && (
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-center space-y-3 animate-fade-in">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Así de simple. ¿Listo para probarlo con tus documentos?
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/register">
              <Button className="bg-primary text-white font-bold px-6 hover:bg-primary/90 shadow-lg shadow-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                Crear cuenta gratis
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedScenario(null);
                setVisibleMessages([]);
                setDemoFinished(false);
              }}
            >
              Ver otro ejemplo
            </Button>
          </div>
        </div>
      )}

      {selectedScenario && !demoFinished && (
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700">
          <div className="flex gap-2 items-center opacity-40">
            <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-sm text-slate-400">
              Los mensajes se muestran automáticamente...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Hero principal — editorial rediseñado ────────────────────────────────────

export function Hero() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const closeModal = useCallback(() => {
    setShowDemoModal(false);
    setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!showDemoModal) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", handleEscape);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [showDemoModal, closeModal]);

  return (
    <header
      className="relative isolate overflow-hidden pt-28 pb-24 px-6 md:px-20 bg-parchment dark:bg-ink"
      id="inicio"
    >
      {/* Mesh blobs decorativos — grandes, difusos, editoriales */}
      <div
        aria-hidden="true"
        className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] bg-primary/20 dark:bg-primary/30 rounded-full blur-[140px] animate-mesh-drift"
      />
      <div
        aria-hidden="true"
        className="absolute bottom-[-150px] left-[-150px] w-[500px] h-[500px] bg-gold/20 dark:bg-gold/15 rounded-full blur-[120px] animate-mesh-drift"
        style={{ animationDelay: "-9s" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* ── Left Content — 7 cols ─────────────────────────────── */}
        <div className="lg:col-span-7 flex flex-col gap-8 animate-fade-up">
          {/* Eyebrow con dot pulsante */}
          <div className="inline-flex items-center gap-2.5 bg-white/60 dark:bg-white/5 backdrop-blur-sm text-slate-700 dark:text-slate-300 px-4 py-2 rounded-full w-fit border border-slate-200/60 dark:border-white/10 shadow-soft">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">
              Disponible para abogados en Argentina
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.02] tracking-tight text-slate-900 dark:text-white text-balance">
            Redactá una{" "}
            <span className="text-primary">
              carta documento
            </span>
            <br className="hidden md:block" /> en 2 minutos.
            <br className="hidden md:block" />
            <span className="text-slate-500 dark:text-slate-400">No en 3 horas.</span>
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed text-pretty">
            DocuLex genera contratos, NDAs, cartas documento y escritos con{" "}
            <strong className="text-slate-900 dark:text-white font-semibold">
              validez jurídica en Argentina
            </strong>
            . Pensado para abogados y estudios jurídicos que cobran por hora, no por tipear.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-primary text-white text-base font-bold h-14 px-8 rounded-brand hover:shadow-glow transition-all flex items-center justify-center gap-2 w-full sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                Empezá gratis — sin tarjeta
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              ref={triggerRef}
              variant="outline"
              size="lg"
              onClick={() => setShowDemoModal(true)}
              className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-base font-semibold h-14 px-8 rounded-brand hover:bg-white dark:hover:bg-white/10 transition-all flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <Play className="w-5 h-5" />
              Ver demo de 60 segundos
            </Button>
          </div>

          {/* Proof strip */}
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-600 dark:text-slate-400 pt-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>5 documentos gratis</span>
            </div>
            <div className="h-4 w-px bg-slate-300/60 dark:bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Listo en menos de 2 minutos</span>
            </div>
            <div className="h-4 w-px bg-slate-300/60 dark:bg-white/10 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gold-600" />
              <span>Tus docs no entrenan IA</span>
            </div>
          </div>
        </div>

        {/* ── Right Preview Card — mockup editorial ────────────── */}
        <div className="lg:col-span-5 relative group animate-fade-up" style={{ animationDelay: "0.15s" }}>
          {/* Glow decorativo */}
          <div
            className="absolute inset-0 bg-primary/30 blur-3xl rounded-full scale-75 group-hover:scale-95 transition-transform duration-700"
            aria-hidden="true"
          />

          {/* Card principal — elevated, tilted sutil */}
          <div className="relative bg-white dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/70 dark:border-white/10 p-6 rounded-3xl shadow-hover group-hover:-rotate-0 -rotate-[1.5deg] transition-transform duration-500">
            {/* Browser chrome */}
            <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-white/10 pb-3">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
                <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" aria-hidden="true" />
              </div>
              <div className="text-[10px] font-mono opacity-60 uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                doculex · editor
              </div>
            </div>

            {/* Documento simulado — estilo papel */}
            <div className="space-y-5">
              {/* Título documento */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gold-600 mb-1">
                  Carta Documento — Buenos Aires
                </div>
                <div className="h-5 bg-gradient-to-r from-slate-200 to-transparent dark:from-slate-700 rounded w-4/5" aria-hidden="true" />
              </div>

              {/* Líneas de texto simulando párrafo */}
              <div className="space-y-2" aria-hidden="true">
                <div className="h-2 bg-slate-200/80 dark:bg-slate-700/60 rounded w-full" />
                <div className="h-2 bg-slate-200/80 dark:bg-slate-700/60 rounded w-[95%]" />
                <div className="h-2 bg-slate-200/80 dark:bg-slate-700/60 rounded w-[88%]" />
                <div className="h-2 bg-slate-200/80 dark:bg-slate-700/60 rounded w-[70%]" />
              </div>

              {/* Callout IA */}
              <div className="relative p-4 bg-gradient-to-br from-primary/5 to-gold/5 dark:from-primary/10 dark:to-gold/10 rounded-2xl border border-primary/15 dark:border-primary/25">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    Asistente IA
                  </span>
                </div>
                <p className="text-xs italic leading-relaxed text-slate-700 dark:text-slate-300">
                  He analizado el Código Civil y Comercial. Se recomienda añadir una
                  cláusula de jurisdicción en CABA para este contrato.
                </p>
              </div>

              {/* Chips de acciones */}
              <div className="grid grid-cols-3 gap-2" aria-hidden="true">
                <div className="h-14 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">PDF</span>
                </div>
                <div className="h-14 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-1">
                  <MessageSquare className="w-4 h-4 text-slate-500" />
                  <span className="text-[9px] uppercase tracking-wider text-slate-500">Chat</span>
                </div>
                <div className="h-14 bg-primary/10 border border-primary/30 rounded-xl flex flex-col items-center justify-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-[9px] uppercase tracking-wider text-primary font-bold">Listo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Badge flotante de tiempo */}
          <div className="absolute -top-4 -right-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-2xl shadow-hover animate-float-slow">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 leading-none">
                  Generado en
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white tabular-nums leading-tight">
                  1 min 47 s
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label="Demo interactiva de DocuLex"
        >
          <button
            type="button"
            className="absolute inset-0 w-full h-full cursor-default"
            onClick={closeModal}
            aria-label="Cerrar demo"
            tabIndex={-1}
          />
          <div
            ref={modalRef}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden max-h-[85vh] flex flex-col"
          >
            <DemoChat onClose={closeModal} />
          </div>
        </div>
      )}
    </header>
  );
}
