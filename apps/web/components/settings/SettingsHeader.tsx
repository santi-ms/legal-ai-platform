"use client";

/**
 * Editorial header para /settings. Reducido al mínimo: eyebrow + título.
 * Las acciones duplicadas de perfil/notificaciones se movieron al
 * shell principal (sidebar + header) para evitar redundancia visual.
 */
export function SettingsHeader() {
  return (
    <header className="px-4 sm:px-6 lg:px-10 pt-6 md:pt-10 pb-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-400 mb-2">
        Configuración
      </p>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-ink dark:text-white leading-[1.1]">
        Ajustes de cuenta
      </h1>
      <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
        Tu perfil profesional, datos del estudio, preferencias y apariencia.
      </p>
    </header>
  );
}
