/**
 * Design tokens — lenguaje visual unificado del producto.
 *
 * Principios:
 *  · Paleta editorial ink / parchment / gold alineada con la landing y el
 *    flujo de auth. La utilidad `primary` (#2b3bee) se usa sólo para acentos
 *    (links, focus ring, icon accents). Los CTA primarios del sistema usan
 *    `bg-ink` para sensación editorial sobria.
 *  · Tipografía Inter, pesos extrabold/bold/semibold con tracking-tight en
 *    titulares. Eyebrows uppercase 11px con tracking 0.14em en dorado.
 *  · Radius 2xl (1rem) para cards, xl (0.75rem) para inputs/buttons.
 *  · Shadows soft / hover definidos en tailwind.config.
 */

export const TOKENS = {
  // ── Gradientes editoriales (iconos, ilustraciones, empty states) ────────
  gradients: {
    primary:  "from-blue-500 to-indigo-600",
    violet:   "from-violet-500 to-purple-600",
    emerald:  "from-emerald-500 to-teal-600",
    amber:    "from-amber-500 to-orange-600",
    rose:     "from-rose-500 to-red-600",
    sky:      "from-sky-500 to-blue-600",
    slate:    "from-slate-500 to-slate-700",
    // Acento editorial dorado — para hero de IA, upgrade, featured
    gold:     "from-gold-500 to-gold-700",
    // Acento editorial oscuro — side panels, wordmark badge
    ink:      "from-slate-900 via-ink to-slate-900",
  },

  // ── Superficies base ───────────────────────────────────────────────────
  // Fondo general de pantalla: parchment en light, ink en dark.
  // Cards: blanco puro / slate-900. Sidebars: ink. Gradient mesh: auth shell.
  surface: {
    screen:      "bg-parchment dark:bg-ink",
    card:        "bg-white dark:bg-slate-900",
    cardMuted:   "bg-slate-50 dark:bg-slate-900/60",
    inset:       "bg-slate-50/60 dark:bg-slate-900/40",
    ink:         "bg-ink text-white",
  },

  // ── Card primitive ─────────────────────────────────────────────────────
  card: {
    base:    "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800",
    shadow:  "shadow-soft",
    hover:   "hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-hover transition-all duration-200",
    padding: "p-6",
    paddingSm: "p-4",
    paddingLg: "p-8",
    // Variante "subtle" sin sombra — listas, filas densas
    subtle:  "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800",
    // Variante "tinted" — fondo suave parchment, sin borde
    tinted:  "bg-parchment/60 dark:bg-slate-900/40 rounded-2xl",
  },

  // ── Tipografía editorial ───────────────────────────────────────────────
  // Heading principal de página (PageLayout title)
  heading: {
    h1:    "text-3xl md:text-4xl font-extrabold tracking-tight text-ink dark:text-white leading-[1.1]",
    h2:    "text-2xl md:text-3xl font-extrabold tracking-tight text-ink dark:text-white leading-[1.15]",
    h3:    "text-xl md:text-2xl font-bold tracking-tight text-ink dark:text-white leading-tight",
    h4:    "text-lg font-bold tracking-tight text-slate-900 dark:text-white",
    h5:    "text-base font-semibold text-slate-900 dark:text-white",
  },

  // Eyebrow: kicker uppercase sobre títulos de sección
  eyebrow: "text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-700 dark:text-gold-400",
  // Variante sobre fondo oscuro (side panels)
  eyebrowInverse: "text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-300",

  // ── Texto genérico ─────────────────────────────────────────────────────
  text: {
    title:        "text-slate-900 dark:text-slate-50",
    subtitle:     "text-slate-600 dark:text-slate-300",
    body:         "text-slate-700 dark:text-slate-200",
    muted:        "text-slate-500 dark:text-slate-400",
    mutedExtra:   "text-slate-400 dark:text-slate-500",
    // Sobre superficie ink (side panels, wordmark, hero oscuro)
    onInk:        "text-white",
    onInkMuted:   "text-slate-300",
    onInkSubtle:  "text-slate-400",
  },

  // ── Botones ────────────────────────────────────────────────────────────
  // Uso:
  //  · primary: CTA principal (Crear, Guardar) — bg-ink editorial
  //  · accent: acciones destacadas (links, secundarios fuertes) — bg-primary
  //  · ghost: terciarios (Cancelar, Volver)
  //  · subtle: filtros, toggles
  button: {
    base:     "inline-flex items-center justify-center gap-2 font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed",
    // Tamaños
    sizeSm:   "h-9 px-3 text-sm rounded-lg",
    sizeMd:   "h-11 px-4 text-sm rounded-xl",
    sizeLg:   "h-12 px-5 text-[15px] rounded-xl",
    // Variantes
    primary:  "bg-ink text-white hover:bg-slate-900 shadow-soft hover:shadow-hover",
    accent:   "bg-primary text-white hover:bg-primary/90 shadow-soft hover:shadow-hover",
    gold:     "bg-gold-500 text-ink hover:bg-gold-600 shadow-soft hover:shadow-glow-gold",
    ghost:    "bg-transparent text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800",
    outline:  "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500",
    subtle:   "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700",
    danger:   "bg-red-600 text-white hover:bg-red-700 shadow-soft",
  },

  // ── Inputs ─────────────────────────────────────────────────────────────
  input: {
    base:     "w-full h-11 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all",
    dense:    "h-9 px-3 text-sm",
    error:    "border-red-500 focus:border-red-500 focus:ring-red-500/20",
    label:    "block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5",
  },

  // ── Status / semántica ─────────────────────────────────────────────────
  status: {
    danger:  { text: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-900/20",       border: "border-rose-200 dark:border-rose-800" },
    warning: { text: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-900/20",     border: "border-amber-200 dark:border-amber-800" },
    success: { text: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
    info:    { text: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-50 dark:bg-blue-900/20",       border: "border-blue-200 dark:border-blue-800" },
    neutral: { text: "text-slate-600 dark:text-slate-300",    bg: "bg-slate-50 dark:bg-slate-800",        border: "border-slate-200 dark:border-slate-700" },
    gold:    { text: "text-gold-700 dark:text-gold-400",      bg: "bg-gold-50 dark:bg-gold-900/20",       border: "border-gold-200 dark:border-gold-800" },
  },

  // ── Pill / chip ───────────────────────────────────────────────────────
  pill: {
    base:    "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold",
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    gold:    "bg-gold-50 text-gold-700 dark:bg-gold-900/20 dark:text-gold-300",
    primary: "bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300",
  },

  // ── Focus ring accesible ──────────────────────────────────────────────
  focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",

  // ── Radii comunes ─────────────────────────────────────────────────────
  radius: {
    button: "rounded-xl",
    card:   "rounded-2xl",
    pill:   "rounded-full",
    input:  "rounded-xl",
  },

  // ── Divider editorial ─────────────────────────────────────────────────
  divider: "border-t border-slate-200/70 dark:border-slate-800/70",
} as const;

export type GradientKey = keyof typeof TOKENS.gradients;
export type StatusKey = keyof typeof TOKENS.status;
export type ButtonVariant =
  | "primary"
  | "accent"
  | "gold"
  | "ghost"
  | "outline"
  | "subtle"
  | "danger";
export type ButtonSize = "sm" | "md" | "lg";
