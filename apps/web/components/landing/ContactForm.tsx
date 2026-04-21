"use client";

import { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Building2 } from "lucide-react";

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
      className="py-24 px-6 md:px-20 bg-white dark:bg-background-dark"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-4 py-1.5 rounded-full mb-5">
            <Building2 className="w-3.5 h-3.5" />
            PLAN ESTUDIO · CONSULTAS COMERCIALES
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-4">
            Hablemos de{" "}
            <span className="text-primary">tu estudio</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto text-lg">
            Dejanos tus datos y te contactamos en menos de 24 horas hábiles
            para armar un plan a medida.
          </p>
        </div>

        {/* Form container */}
        <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-8 md:p-10">
          {state === "sent" ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-5">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                ¡Recibimos tu consulta!
              </h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                En las próximas 24 horas hábiles te vamos a contactar desde
                soporte@doculex.ar. Revisá también tu carpeta de spam.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Honeypot — oculto al usuario y a lectores de pantalla */}
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
                <Field
                  id="name"
                  label="Nombre y apellido"
                  value={data.name}
                  onChange={(v) => update("name", v)}
                  required
                  autoComplete="name"
                />
                <Field
                  id="email"
                  label="Email"
                  type="email"
                  value={data.email}
                  onChange={(v) => update("email", v)}
                  required
                  autoComplete="email"
                />
                <Field
                  id="phone"
                  label="Teléfono (opcional)"
                  type="tel"
                  value={data.phone}
                  onChange={(v) => update("phone", v)}
                  autoComplete="tel"
                />
                <Field
                  id="studio"
                  label="Nombre del estudio"
                  value={data.studio}
                  onChange={(v) => update("studio", v)}
                  autoComplete="organization"
                />
              </div>

              {/* Team size */}
              <div>
                <label
                  htmlFor="teamSize"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  Tamaño del equipo
                </label>
                <select
                  id="teamSize"
                  value={data.teamSize}
                  onChange={(e) =>
                    update("teamSize", e.target.value as FormData["teamSize"])
                  }
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Seleccioná</option>
                  <option value="1">Solo yo</option>
                  <option value="2-5">2 a 5 personas</option>
                  <option value="6-15">6 a 15 personas</option>
                  <option value="16+">Más de 15 personas</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
                >
                  ¿Qué necesitás? <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  minLength={10}
                  maxLength={2000}
                  value={data.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Contanos brevemente qué tipo de documentos generan y si tienen algún requisito particular (branding, cumplimiento, integraciones, etc.)."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Al enviar aceptás nuestra{" "}
                  <a
                    href="/privacidad"
                    className="text-primary hover:underline"
                  >
                    política de privacidad
                  </a>
                  .
                </p>
                <button
                  type="submit"
                  disabled={state === "sending"}
                  className="inline-flex items-center gap-2 bg-primary text-white text-sm font-bold px-6 py-3 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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
      </div>
    </section>
  );
}

// ─── Reusable Field ─────────────────────────────────────────────────────────

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  autoComplete?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  required = false,
  autoComplete,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2"
      >
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </div>
  );
}
