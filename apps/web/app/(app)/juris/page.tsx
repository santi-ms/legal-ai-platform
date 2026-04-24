"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/app/lib/hooks/useAuth";
import {
  createJurisConsulta, sendJurisMensaje, listJurisConsultas,
  getJurisConsulta, deleteJurisConsulta,
  isPlanLimitError,
  JurisConsulta, JurisMensaje,
} from "@/app/lib/webApi";
import { usePlanLimitHandler } from "@/app/lib/hooks/usePlanLimitHandler";
import {
  Scale, Send, Plus, Trash2, Loader2, BookOpen, ChevronDown,
  MessageSquare, Clock, Sparkles, AlertCircle, Search, X, Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/app/lib/utils";
import ReactMarkdown from "react-markdown";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROVINCIAS = [
  { value: "",              label: "Argentina (Federal)" },
  { value: "caba",         label: "CABA" },
  { value: "buenos_aires", label: "Buenos Aires" },
  { value: "cordoba",      label: "Córdoba" },
  { value: "corrientes",   label: "Corrientes" },
  { value: "misiones",     label: "Misiones" },
];

const MATERIAS = [
  { value: "",             label: "Todas las materias" },
  { value: "civil",        label: "Civil" },
  { value: "comercial",    label: "Comercial" },
  { value: "laboral",      label: "Laboral" },
  { value: "penal",        label: "Penal" },
  { value: "administrativo", label: "Administrativo" },
  { value: "familia",      label: "Familia" },
  { value: "sucesiones",   label: "Sucesiones" },
  { value: "contratos",    label: "Contratos" },
];

const SUGERENCIAS = [
  "¿Cuáles son los requisitos para interponer una acción de desalojo por falta de pago en Buenos Aires?",
  "¿Qué plazo tiene el demandado para contestar una demanda ordinaria en Corrientes?",
  "¿Cómo se calcula la indemnización por despido sin causa según la LCT?",
  "¿Qué diferencia hay entre nulidad absoluta y relativa en el CCCN?",
  "¿Cuándo procede la medida cautelar de embargo preventivo?",
  "¿Qué requisitos debe cumplir una carta documento para interrumpir la prescripción?",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: JurisMensaje }) {
  const isUser = msg.role === "user";
  const [showCitas, setShowCitas] = useState(false);
  const hasCitas = (msg.citas?.length ?? 0) > 0;

  return (
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
        isUser
          ? "bg-violet-600 text-white"
          : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
      )}>
        {isUser ? "Vos" : <Scale className="w-4 h-4" />}
      </div>

      {/* Bubble */}
      <div className={cn(
        "max-w-[85%] space-y-2",
        isUser ? "items-end" : "items-start"
      )}>
        <div className={cn(
          "rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-violet-600 text-white rounded-tr-sm"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm shadow-sm"
        )}>
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-semibold prose-strong:font-semibold prose-p:my-1 prose-ul:my-1 prose-li:my-0">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Citas y timestamp */}
        <div className={cn("flex items-center gap-2 flex-wrap", isUser ? "justify-end" : "justify-start")}>
          <span className="text-[11px] text-slate-400">{formatTime(msg.createdAt)}</span>

          {hasCitas && (
            <button
              onClick={() => setShowCitas(!showCitas)}
              className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <BookOpen className="w-3 h-3" />
              {msg.citas!.length} cita{msg.citas!.length !== 1 ? "s" : ""}
              <ChevronDown className={cn("w-3 h-3 transition-transform", showCitas && "rotate-180")} />
            </button>
          )}
        </div>

        {/* Citas expandidas */}
        {hasCitas && showCitas && (
          <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl p-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide mb-2">
              Normativa citada
            </p>
            {msg.citas!.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <BookOpen className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                  {c.articulo} {c.codigo}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Búsqueda web indicator */}
        {(msg.webSearches?.length ?? 0) > 0 && (
          <div className="flex items-center gap-1 text-[11px] text-blue-500 dark:text-blue-400">
            <Search className="w-3 h-3" />
            Enriquecido con búsqueda web
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar — Lista de consultas ─────────────────────────────────────────────

function ConsultaSidebar({
  consultas,
  activeId,
  onSelect,
  onNew,
  onDelete,
  loading,
  open,
  onClose,
}: {
  consultas: JurisConsulta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  loading: boolean;
  open?: boolean;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          "fixed md:static inset-y-0 left-0 z-50 w-[78%] max-w-xs md:w-72 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-hidden transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <Button onClick={onNew} className="w-full gap-2 bg-violet-600 hover:bg-violet-700 text-white" size="sm">
          <Plus className="w-4 h-4" />
          Nueva consulta
        </Button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : consultas.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-400 py-12">
            Ninguna consulta todavía
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {consultas.map((c) => (
              <div
                key={c.id}
                className={cn(
                  "group relative flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-colors",
                  activeId === c.id
                    ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                )}
                onClick={() => onSelect(c.id)}
              >
                <MessageSquare className={cn(
                  "w-4 h-4 mt-0.5 flex-shrink-0",
                  activeId === c.id ? "text-violet-500" : "text-slate-400"
                )} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug line-clamp-2">{c.titulo}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span className="text-[11px] text-slate-400">{formatDate(c.updatedAt)}</span>
                    {c.provincia && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                        {c.provincia}
                      </span>
                    )}
                  </div>
                </div>
                {/* Delete button */}
                <button
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 transition-all"
                  onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
    </>
  );
}

// ─── Empty / Welcome State ──────────────────────────────────────────────��─────

function WelcomeState({ onSuggestion }: { onSuggestion: (s: string) => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 gap-10 overflow-y-auto">
      <div className="text-center space-y-4 max-w-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Scale className="w-8 h-8 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-400 mb-2">
            Asistente IA
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-ink dark:text-white tracking-tight leading-[1.1]">
            Doku <span className="text-violet-600 dark:text-violet-400">Juris</span>
          </h2>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
            Research jurisprudencial conversacional. Hacé consultas sobre legislación y jurisprudencia argentina y recibí respuestas con citas normativas precisas.
          </p>
        </div>
      </div>

      <div className="w-full max-w-2xl space-y-3">
        <div className="flex items-center gap-2 justify-center">
          <Sparkles className="w-3.5 h-3.5 text-violet-500" />
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Preguntas frecuentes
          </p>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {SUGERENCIAS.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestion(s)}
              className="group text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 hover:border-violet-400 hover:bg-violet-50 dark:hover:border-violet-700 dark:hover:bg-violet-950/30 hover:shadow-sm transition-all duration-150 shadow-sm"
            >
              <div className="flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-violet-500 dark:text-violet-400 flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="flex-1 leading-snug">{s}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JurisPage() {
  useAuth();
  const handlePlanLimit = usePlanLimitHandler();

  // State
  const [consultas, setConsultas]         = useState<JurisConsulta[]>([]);
  const [activeConsulta, setActiveConsulta] = useState<JurisConsulta | null>(null);
  const [loadingList, setLoadingList]      = useState(true);
  const [loadingChat, setLoadingChat]      = useState(false);
  const [sending, setSending]              = useState(false);
  const [input, setInput]                  = useState("");
  const [provincia, setProvincia]          = useState("");
  const [materia, setMateria]              = useState("");
  const [error, setError]                  = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen]      = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConsulta?.mensajes]);

  // Load consultas list
  const loadConsultas = useCallback(async () => {
    try {
      const { consultas: list } = await listJurisConsultas({ pageSize: 50 });
      setConsultas(list);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => { loadConsultas(); }, [loadConsultas]);

  // Select a consulta and load its messages
  const selectConsulta = useCallback(async (id: string) => {
    if (activeConsulta?.id === id) return;
    setLoadingChat(true);
    setError(null);
    try {
      const c = await getJurisConsulta(id);
      setActiveConsulta(c);
    } catch {
      setError("No se pudo cargar la consulta.");
    } finally {
      setLoadingChat(false);
    }
  }, [activeConsulta?.id]);

  // New consulta: reset to empty state
  const handleNew = () => {
    setActiveConsulta(null);
    setInput("");
    setError(null);
    textareaRef.current?.focus();
  };

  // Delete consulta
  const handleDelete = async (id: string) => {
    await deleteJurisConsulta(id).catch(() => {});
    setConsultas(prev => prev.filter(c => c.id !== id));
    if (activeConsulta?.id === id) setActiveConsulta(null);
  };

  // Send message (new consulta or continue existing)
  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || sending) return;

    setSending(true);
    setError(null);
    setInput("");

    // Mensaje optimista del usuario — se muestra inmediatamente
    const optimisticId = `optimistic-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const optimisticUserMsg: JurisMensaje = {
      id:          optimisticId,
      consultaId:  activeConsulta?.id ?? "pending",
      role:        "user",
      content:     text,
      citas:       null,
      webSearches: null,
      tokensUsed:  0,
      createdAt:   nowIso,
    };

    const wasNewConsulta = !activeConsulta;

    if (wasNewConsulta) {
      // Crear una consulta temporal para mostrar el mensaje del usuario mientras el backend responde
      setActiveConsulta({
        id:         "pending",
        titulo:     text.length > 60 ? `${text.slice(0, 60)}…` : text,
        provincia:  provincia || null,
        materia:    materia || null,
        tokensUsed: 0,
        createdAt:  nowIso,
        updatedAt:  nowIso,
        expediente: null,
        mensajes:   [optimisticUserMsg],
      });
    } else {
      // Agregar el mensaje optimista a la consulta existente
      setActiveConsulta(prev => prev ? {
        ...prev,
        mensajes: [...(prev.mensajes ?? []), optimisticUserMsg],
      } : prev);
    }

    try {
      if (wasNewConsulta) {
        // Nueva consulta
        const c = await createJurisConsulta({ mensaje: text, provincia: provincia || undefined, materia: materia || undefined });
        setActiveConsulta(c);
        // Add to sidebar list
        setConsultas(prev => [c, ...prev]);
      } else {
        // Continuar consulta existente
        const { mensajes: newMsgs } = await sendJurisMensaje(activeConsulta!.id, text);
        setActiveConsulta(prev => prev ? {
          ...prev,
          // Filtrar el optimista y reemplazar con los mensajes reales del backend
          mensajes: [...(prev.mensajes ?? []).filter(m => m.id !== optimisticId), ...newMsgs],
        } : prev);
      }
    } catch (err: any) {
      // Rollback: quitar el mensaje optimista y restaurar el input
      if (wasNewConsulta) {
        setActiveConsulta(null);
      } else {
        setActiveConsulta(prev => prev ? {
          ...prev,
          mensajes: (prev.mensajes ?? []).filter(m => m.id !== optimisticId),
        } : prev);
      }
      setInput(text);
      if (isPlanLimitError(err)) {
        handlePlanLimit(err);
        setError(null);
      } else {
        setError(err?.message ?? "Error al enviar la consulta.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const mensajes = activeConsulta?.mensajes ?? [];

  return (
    <div className="flex h-[calc(100dvh-4rem)] overflow-hidden bg-slate-50 dark:bg-slate-950">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <ConsultaSidebar
        consultas={consultas}
        activeId={activeConsulta?.id ?? null}
        onSelect={(id) => { selectConsulta(id); setSidebarOpen(false); }}
        onNew={() => { handleNew(); setSidebarOpen(false); }}
        onDelete={handleDelete}
        loading={loadingList}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main chat area ──────────────────────────────────────��────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar con filtros */}
        {!activeConsulta && (
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Abrir historial de consultas"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Jurisdicción:</label>
              <select
                value={provincia}
                onChange={e => setProvincia(e.target.value)}
                className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              >
                {PROVINCIAS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Materia:</label>
              <select
                value={materia}
                onChange={e => setMateria(e.target.value)}
                className="text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none"
              >
                {MATERIAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            {(provincia || materia) && (
              <button
                onClick={() => { setProvincia(""); setMateria(""); }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
                Limpiar
              </button>
            )}
          </div>
        )}

        {/* Active consulta header */}
        {activeConsulta && (
          <div className="flex-shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 sm:px-4 py-3 flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Abrir historial de consultas"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Scale className="w-5 h-5 text-violet-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate">{activeConsulta.titulo}</p>
              <div className="flex items-center gap-2">
                {activeConsulta.provincia && (
                  <span className="text-xs text-slate-400">{activeConsulta.provincia}</span>
                )}
                {activeConsulta.materia && (
                  <span className="text-xs text-slate-400">· {activeConsulta.materia}</span>
                )}
              </div>
            </div>
            <button
              onClick={handleNew}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs text-violet-600 dark:text-violet-400 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva
            </button>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 sm:py-6 space-y-5">
          {loadingChat ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : mensajes.length === 0 ? (
            <WelcomeState onSuggestion={(s) => { setInput(s); setTimeout(() => textareaRef.current?.focus(), 100); }} />
          ) : (
            mensajes.map(msg => <MessageBubble key={msg.id} msg={msg} />)
          )}

          {/* Sending indicator */}
          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <span key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 sm:p-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Hacé tu consulta legal... (Enter para enviar, Shift+Enter para nueva línea)"
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors"
              />
              <div className="absolute bottom-2.5 right-3 text-xs text-slate-300 dark:text-slate-600 select-none">
                Enter ↵
              </div>
            </div>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending}
              className="h-12 w-12 p-0 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 flex-shrink-0 disabled:opacity-40"
            >
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <Sparkles className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <p className="text-[11px] text-slate-400">
              Doku Juris cita normativa real. No proporciona asesoramiento jurídico vinculante. Verificá siempre con fuentes primarias.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
