/**
 * Motor de cálculo de plazos procesales (días hábiles)
 * Respeta feriados nacionales argentinos y fines de semana.
 * Los feriados provinciales se pueden agregar por provincia en el futuro.
 */

// ─── Feriados nacionales ──────────────────────────────────────────────────────

const HOLIDAYS: Record<string, string> = {
  // 2024
  "2024-01-01": "Año Nuevo",
  "2024-02-12": "Carnaval",
  "2024-02-13": "Carnaval",
  "2024-03-24": "Día de la Memoria",
  "2024-03-28": "Jueves Santo",
  "2024-03-29": "Viernes Santo",
  "2024-04-02": "Día del Veterano",
  "2024-05-01": "Día del Trabajador",
  "2024-05-25": "Revolución de Mayo",
  "2024-06-17": "Paso a la Inmortalidad del Gral. Güemes",
  "2024-06-20": "Paso a la Inmortalidad del Gral. San Martín",
  "2024-07-09": "Día de la Independencia",
  "2024-08-17": "Paso a la Inmortalidad del Gral. San Martín (traslado)",
  "2024-10-14": "Día del Respeto a la Diversidad Cultural (traslado)",
  "2024-11-18": "Día de la Soberanía Nacional (traslado)",
  "2024-12-08": "Inmaculada Concepción de María",
  "2024-12-25": "Navidad",

  // 2025
  "2025-01-01": "Año Nuevo",
  "2025-03-03": "Carnaval",
  "2025-03-04": "Carnaval",
  "2025-03-24": "Día de la Memoria",
  "2025-04-02": "Día del Veterano",
  "2025-04-17": "Jueves Santo",
  "2025-04-18": "Viernes Santo",
  "2025-05-01": "Día del Trabajador",
  "2025-05-25": "Revolución de Mayo",
  "2025-06-16": "Paso a la Inmortalidad del Gral. Güemes (traslado)",
  "2025-06-20": "Paso a la Inmortalidad del Gral. San Martín",
  "2025-07-09": "Día de la Independencia",
  "2025-08-18": "Paso a la Inmortalidad del Gral. San Martín (traslado)",
  "2025-10-12": "Día del Respeto a la Diversidad Cultural",
  "2025-11-21": "Día de la Soberanía Nacional (traslado)",
  "2025-12-08": "Inmaculada Concepción de María",
  "2025-12-25": "Navidad",

  // 2026
  "2026-01-01": "Año Nuevo",
  "2026-02-16": "Carnaval",
  "2026-02-17": "Carnaval",
  "2026-03-24": "Día de la Memoria",
  "2026-04-02": "Día del Veterano",
  "2026-04-02": "Jueves Santo",  // coincide con el 2 — Viernes Santo es el 3
  "2026-04-03": "Viernes Santo",
  "2026-05-01": "Día del Trabajador",
  "2026-05-25": "Revolución de Mayo",
  "2026-06-15": "Paso a la Inmortalidad del Gral. Güemes (traslado)",
  "2026-06-20": "Paso a la Inmortalidad del Gral. San Martín",
  "2026-07-09": "Día de la Independencia",
  "2026-08-17": "Paso a la Inmortalidad del Gral. San Martín",
  "2026-10-12": "Día del Respeto a la Diversidad Cultural",
  "2026-11-20": "Día de la Soberanía Nacional",
  "2026-12-08": "Inmaculada Concepción de María",
  "2026-12-25": "Navidad",
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FeriadoSaltado {
  fecha: string;   // "YYYY-MM-DD"
  nombre: string;
}

export interface PlazoResult {
  fechaVencimiento: string;         // "YYYY-MM-DD"
  diasCalendario: number;           // días corridos totales
  feriadosSaltados: FeriadoSaltado[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toStr(d: Date): string {
  // Usar UTC para evitar problemas de timezone
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWeekend(d: Date): boolean {
  const dow = d.getUTCDay(); // 0=Dom, 6=Sáb
  return dow === 0 || dow === 6;
}

function isHoliday(d: Date): boolean {
  return !!HOLIDAYS[toStr(d)];
}

function nextDay(d: Date): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

// ─── Motor principal ──────────────────────────────────────────────────────────

/**
 * Calcula la fecha de vencimiento contando `diasHabiles` días hábiles
 * desde `fechaNotificacion` (el día de notificación NO cuenta).
 */
export function calculateDeadline(
  fechaNotificacion: Date,
  diasHabiles: number
): PlazoResult {
  const feriadosSaltados: FeriadoSaltado[] = [];

  // Normalizar a UTC midnight para evitar desfasajes horarios
  const start = new Date(
    Date.UTC(
      fechaNotificacion.getFullYear(),
      fechaNotificacion.getMonth(),
      fechaNotificacion.getDate()
    )
  );

  let current = start;
  let counted = 0;

  while (counted < diasHabiles) {
    current = nextDay(current);

    if (isWeekend(current)) continue;

    if (isHoliday(current)) {
      feriadosSaltados.push({
        fecha: toStr(current),
        nombre: HOLIDAYS[toStr(current)],
      });
      continue;
    }

    counted++;
  }

  const diasCalendario = Math.round(
    (current.getTime() - start.getTime()) / 86_400_000
  );

  return {
    fechaVencimiento: toStr(current),
    diasCalendario,
    feriadosSaltados,
  };
}

// Tipos de plazo más comunes en el proceso civil argentino
export const PLAZOS_COMUNES = [
  { label: "3 días hábiles (traslados breves)", value: 3 },
  { label: "5 días hábiles (traslados comunes)", value: 5 },
  { label: "10 días hábiles (oposiciones)", value: 10 },
  { label: "15 días hábiles (contestación de demanda)", value: 15 },
  { label: "20 días hábiles (contestación ampliada)", value: 20 },
  { label: "30 días hábiles (plazo general)", value: 30 },
  { label: "60 días hábiles (plazo especial)", value: 60 },
];
