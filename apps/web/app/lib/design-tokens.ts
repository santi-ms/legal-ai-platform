/**
 * Design tokens — centralized UI constants for consistency across pages.
 * Import in components that need shared visual language.
 */

export const TOKENS = {
  // Gradients — use on icon backgrounds, accent bars, empty-state illustrations
  gradients: {
    primary:  "from-blue-500 to-indigo-600",
    violet:   "from-violet-500 to-purple-600",
    emerald:  "from-emerald-500 to-teal-600",
    amber:    "from-amber-500 to-orange-600",
    rose:     "from-rose-500 to-red-600",
    sky:      "from-sky-500 to-blue-600",
    slate:    "from-slate-500 to-slate-700",
  },

  // Card primitives
  card: {
    base:    "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800",
    shadow:  "shadow-sm",
    hover:   "hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200",
    padding: "p-6",
  },

  // Text color tokens (fix common low-contrast pitfalls in dark mode)
  text: {
    title:        "text-slate-900 dark:text-slate-50",
    subtitle:     "text-slate-600 dark:text-slate-300",
    body:         "text-slate-700 dark:text-slate-200",
    muted:        "text-slate-500 dark:text-slate-400",
    mutedExtra:   "text-slate-400 dark:text-slate-500",
  },

  // Status colors — urgency / state semantics
  status: {
    danger:  { text: "text-rose-600 dark:text-rose-400",      bg: "bg-rose-50 dark:bg-rose-900/20",       border: "border-rose-200 dark:border-rose-800" },
    warning: { text: "text-amber-600 dark:text-amber-400",    bg: "bg-amber-50 dark:bg-amber-900/20",     border: "border-amber-200 dark:border-amber-800" },
    success: { text: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800" },
    info:    { text: "text-blue-600 dark:text-blue-400",      bg: "bg-blue-50 dark:bg-blue-900/20",       border: "border-blue-200 dark:border-blue-800" },
    neutral: { text: "text-slate-600 dark:text-slate-300",    bg: "bg-slate-50 dark:bg-slate-800",        border: "border-slate-200 dark:border-slate-700" },
  },

  // Focus ring — accessibility
  focusRing: "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950",
} as const;

export type GradientKey = keyof typeof TOKENS.gradients;
export type StatusKey = keyof typeof TOKENS.status;
