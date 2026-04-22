"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Building2, Mail, Clock, Shield } from "lucide-react";
import { CONTACT, mailto } from "@/app/lib/site";
import { Reveal } from "./motion";

type FormState = "idle" | "sending" | "sent" | "error";

interface FormData {
  name: string;
  email: string;
  phone: string;
  studio: string;
  teamSize: "1" | "2-5" | "6-15" | "16+" | "";
  message: string;
  // Honeypot — campo oculto al usuario. Bots lo llenan.
  website: string;
}

const INITIAL: FormData = {
  name: "",
  email: "",
  phone: "",
  studio: "",
  teamSize: "",
  message: "",
  website: "",
};

const BENEFITS = [
  {
    icon: Clock,
    title: "Respuesta en 24 h hábiles",
    description: "Te escribe alguien del equipo — no un bot.",
  },
  {
    icon: Shield,
    title: "Demo personalizada",
    description: "Te mostramos la plataforma con casos reales de tu práctica.",
  },
  {
    icon: Building2,
    title: "Onboarding incluido",
    description: "Subimos tu logo, plantillas y usuarios antes del arranque.",
  },
];

export function ContactForm() {
  const [data, setData] = useState<FormData>(INITIAL);
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setData((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrorMsg(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setErrorMsg(
            "Recibimos muchos envíos desde tu conexión. Probá en unos minutos."
          );
        } else if (body?.error === "VALIDATION_ERROR") {
          setErrorMsg(
            "Revisá los datos del formulario — algún campo quedó incompleto."
          );
        } else {
          setErrorMsg("No pudimos enviar tu consulta. Probá más tarde.");
        }
        setState("error");
        return;
      }

      setState("sent");
      setData(INITIAL);
    } catch {
      setState("error");
      setErrorMsg("Error de conexión. Verificá tu internet e intentá de nuevo.");
    }
  }

  return (
    <section
      id="contacto"
      className="relative py-28 px-6 md:px-20 bg-white dark:bg-background-dark overflow-hidden"
    >
      {/* Mesh blob decorativo */}
      <div
        aria-hidden="true"
        className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/15 rounded-full blur-[140px] -z-0"
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Izquierda: header editorial + beneficios */}
          <Reveal className="lg:col-span-5 space-y-8">
            <div className="inline-flex items-center gap-2 text-gold-600 dark:text-gold-400 text-[11px] font-semibold uppercase tracking-[0.14em]">
              <Building2 className="w-3.5 h-3.5" />
              Plan estudio · Consultas comerciales
            </div>
            <h2 className="font-display text-4xl md:text-5xl xl:text-6xl font-light tracking-tight text-slate-900 dark:text-white text-balance leading-[1.05]">
              Hablemos de{" "}
              <span className="italic font-medium text-primary">tu estudio</span>
              .
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed text-pretty">
              Dejanos tus datos y te contactamos para armar un plan a medida.
              Sin compromisos — es solo una charla para ver si encajamos.
            </p>

            {/* Beneficios como lista editorial con separadores */}
            <ul className="pt-4 divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
              {BENEFITS.map((b) => {
                const Icon = b.icon;
                return (
                  <li key={b.title} className="flex items-start gap-4 py-5">
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white text-sm">
                        {b.title}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {b.description}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Email fallback */}
            <div className="pt-2">
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
                ¿Preferís email directo?
              </p>
              <a
                href={mailto(CONTACT.support, "Consulta comercial — DocuLex")}
                className="inline-flex items-center gap-2 font-semibold text-primary hover:underline"
              >
                <Mail className="w-4 h-4" />
                {CONTACT.support}
              </a>
            </div>
          </Reveal>

          {/* Derecha: form card */}
          <Reveal delay={0.15} className="lg:col-span-7">
            <div className="relative rounded-brand bg-parchment dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-8 md:p-10 shadow-soft">
              {state === "sent" ? (
                <div className="text-center py-16 animate-fade-in">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-6">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-display text-3xl font-medium text-slate-900 dark:text-white mb-3">
                    ¡Recibimos tu consulta!
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    En las próximas 24 horas hábiles te escribimos desde{" "}
                    <span className="font-medium">{CONTACT.support}</span>.
                    Revisá también la carpeta de spam por las dudas.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  {/* Honeypot */}
                  <div className="hidden" aria-hidden="true">
                    <label htmlFor="website">
                      No completar este campo
                      <input
                        id="website"
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={data.website}
                        onChange={(e) => update("website", e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingField
                      id="name"
                      label="Nombre y apellido"
                      value={data.name}
                      onChange={(v) => update("name", v)}
                      required
                      autoComplete="name"
                    />
                    <FloatingField
                      id="email"
                      label="Email"
                      type="email"
                      value={data.email}
                      onChange={(v) => update("email", v)}
                      required
                      autoComplete="email"
                    />
                    <FloatingField
                      id="phone"
                      label="Teléfono (opcional)"
                      type="tel"
                      value={data.phone}
                      onChange={(v) => update("phone", v)}
                      autoComplete="tel"
                    />
                    <FloatingField
                      id="studio"
                      label="Nombre del estudio"
                      value={data.studio}
                      onChange={(v) => update("studio", v)}
                      autoComplete="organization"
                    />
                  </div>

                  {/* Team size */}
                  <div className="relative">
                    <select
                      id="teamSize"
                      value={data.teamSize}
                      onChange={(e) =>
                        update(
                          "teamSize",
                          e.target.value as FormData["teamSize"]
                        )
                      }
                      className="peer w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pt-6 pb-2 text-sm text-slate-900 dark:text-slate-100 appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors"
                    >
                      <option value="">—</option>
                      <option value="1">Solo yo</option>
                      <option value="2-5">2 a 5 personas</option>
                      <option value="6-15">6 a 15 personas</option>
                      <option value="16+">Más de 15 personas</option>
                    </select>
                    <label
                      htmlFor="teamSize"
                      className="absolute left-4 top-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pointer-events-none"
                    >
                      Tamaño del equipo
                    </label>
                    <span
                      aria-hidden="true"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    >
                      ▾
                    </span>
                  </div>

                  {/* Message — textarea con floating label */}
                  <div className="relative">
                    <textarea
                      id="message"
                      required
                      rows={5}
                      minLength={10}
                      maxLength={2000}
                      value={data.message}
                      onChange={(e) => update("message", e.target.value)}
                      placeholder=" "
                      className="peer w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pt-7 pb-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-transparent resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors leading-relaxed"
                    />
                    <label
                      htmlFor="message"
                      className="absolute left-4 top-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pointer-events-none"
                    >
                      ¿Qué necesitás? *
                    </label>
                    <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">
                      Contanos brevemente qué tipo de documentos generan y si
                      tienen requisitos particulares.
                    </p>
                  </div>

                  {/* Error */}
                  {state === "error" && errorMsg && (
                    <div
                      role="alert"
                      className="flex items-start gap-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 px-4 py-3 text-sm text-red-700 dark:text-red-400"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Submit */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3">
                    <p className="text-xs text-slate-500 dark:text-slate-500 leading-relaxed">
                      Al enviar aceptás nuestra{" "}
                      <a
                        href="/privacidad"
                        className="text-primary hover:underline font-medium"
                      >
                        política de privacidad
                      </a>
                      .
                    </p>
                    <button
                      type="submit"
                      disabled={state === "sending"}
                      className="inline-flex items-center gap-2 bg-ink text-white text-sm font-bold px-7 py-3.5 rounded-xl hover:bg-slate-800 hover:shadow-hover transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    >
                      {state === "sending" ? (
                        <>
                          <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Enviar consulta
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ─── Floating-label text field ──────────────────────────────────────────────

interface FloatingFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}

function FloatingField({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  autoComplete,
}: FloatingFieldProps) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder=" "
        className="peer w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 pt-6 pb-2 text-sm text-slate-900 dark:text-slate-100 placeholder:text-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary transition-colors"
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-2 text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider pointer-events-none"
      >
        {label}
        {required && " *"}
      </label>
    </div>
  );
}
