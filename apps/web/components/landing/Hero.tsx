"use client";

import { useState, useEffect, useRef } from "react";
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
        '¡Genial! Para armar tu contrato de locación necesito algunos datos. Empecemos:\n\n• ¿Cuál es el nombre completo del propietario (locador)?\n• ¿Y el nombre del inquilino (locatario)?',
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
        "¡Listo! Tengo todo lo necesario. Voy a generar tu contrato de locación ahora mismo. 📄✨",
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
        "Tengo toda la información. Voy a generar tu carta documento con la intimación de pago correspondiente. 📄✨",
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
        "¡Listo! Voy a generar tu Acuerdo de Confidencialidad con todos los datos. 📄✨",
    },
  ],
};

function DemoChat({ onClose }: { onClose: () => void }) {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
  const [visibleMessages, setVisibleMessages] = useState<DemoMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [demoFinished, setDemoFinished] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Reproducir conversación mensaje a mensaje
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

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleMessages, isTyping]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
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
          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Cerrar demo"
        >
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-[300px] max-h-[400px]">
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
                { id: "alquiler", label: "🏠 Contrato de alquiler", desc: "Locación residencial" },
                { id: "carta", label: "📨 Carta documento", desc: "Intimación de pago" },
                { id: "nda", label: "🔒 Acuerdo de confidencialidad", desc: "NDA empresarial" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(s.id)}
                  className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-primary/50 hover:bg-primary/5 transition-all group"
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

            {/* Typing indicator */}
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

      {/* CTA footer */}
      {demoFinished && (
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-center space-y-3 animate-fade-in">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Así de simple. ¿Listo para probarlo con tus documentos?
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/auth/register">
              <Button className="bg-primary text-white font-bold px-6 hover:bg-primary/90 shadow-lg shadow-primary/20">
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

      {/* Simulated input (disabled) */}
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

// ─── Hero principal ───────────────────────────────────────────────────────────

export function Hero() {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Cerrar con ESC
  useEffect(() => {
    if (showDemoModal) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") setShowDemoModal(false);
      };
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [showDemoModal]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) setShowDemoModal(false);
  };

  return (
    <header className="relative pt-20 pb-16 px-6 md:px-20 overflow-hidden" id="inicio">
      {/* Abstract background elements */}
      <div className="absolute top-0 right-0 -z-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 -z-10 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4"></div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <div className="flex flex-col gap-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full w-fit border border-primary/20">
            <Sparkles className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Nueva generación legal
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tighter text-slate-900 dark:text-slate-100">
            Generá contratos y documentos <span className="text-primary">legales</span> con IA en minutos
          </h1>

          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
            La plataforma de legal tech líder en Argentina para abogados, estudios jurídicos
            y pymes. Generá contratos, NDAs, cartas documento y más con validez jurídica,
            usando IA adaptada a la normativa argentina.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/auth/register">
              <Button
                size="lg"
                className="bg-primary text-white text-lg font-bold h-14 px-8 rounded-xl hover:shadow-xl hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
              >
                Comenzar Ahora
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setShowDemoModal(true)}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-lg font-semibold h-14 px-8 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Ver Demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Datos encriptados</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <span>Normativa argentina</span>
            </div>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Para abogados y pymes</span>
            </div>
          </div>
        </div>

        {/* Right Preview Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-75 group-hover:scale-90 transition-transform duration-700"></div>
          <div className="relative bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-slate-800 p-6 rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between mb-8 border-b border-white/20 dark:border-slate-700 pb-4">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
              </div>
              <div className="text-xs font-mono opacity-50 uppercase tracking-widest text-slate-600 dark:text-slate-400">
                Editor Inteligente v2.0
              </div>
            </div>

            <div className="space-y-4">
              <div className="h-4 bg-primary/20 rounded w-3/4"></div>
              <div className="h-4 bg-primary/10 rounded w-1/2"></div>

              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary/40" />
                </div>
                <div className="h-20 bg-primary/5 border border-primary/10 rounded-xl flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary/40" />
                </div>
                <div className="h-20 bg-primary/30 border border-primary/20 rounded-xl flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
              </div>

              <div className="p-4 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-white/20 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Asistente IA
                  </span>
                </div>
                <p className="text-xs italic leading-relaxed text-slate-600 dark:text-slate-400">
                  &quot;He analizado el Código Civil y Comercial. Se recomienda añadir una
                  cláusula de jurisdicción en CABA para este contrato de locación.&quot;
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Demo Modal */}
      {showDemoModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label="Demo interactiva"
        >
          <div
            ref={modalRef}
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <DemoChat onClose={() => setShowDemoModal(false)} />
          </div>
        </div>
      )}
    </header>
  );
}
