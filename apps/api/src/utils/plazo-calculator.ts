/**
 * Motor de cálculo de plazos procesales (días hábiles)
 * Respeta feriados nacionales argentinos, feriados provinciales y fines de semana.
 *
 * Provincias soportadas:
 *   "nacional"  — solo feriados nacionales
 *   "corrientes" — nacionales + 16/07 Virgen de Itatí + 02/11 Fieles Difuntos
 *   "misiones"  — nacionales + 30/11 Natalicio de Andrés Guacurarí
 *   "caba"      — nacionales (CABA no tiene feriados propios adicionales)
 *   "buenos_aires" — nacionales (los feriados bonaerenses son municipales, no provinciales)
 */

// ─── Feriados nacionales ──────────────────────────────────────────────────────

const NATIONAL_HOLIDAYS: Record<string, string> = {
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

  // 2027
  "2027-01-01": "Año Nuevo",
  "2027-02-08": "Carnaval",
  "2027-02-09": "Carnaval",
  "2027-03-24": "Día de la Memoria",
  "2027-04-01": "Jueves Santo",
  "2027-04-02": "Viernes Santo / Día del Veterano",
  "2027-05-01": "Día del Trabajador",
  "2027-05-25": "Revolución de Mayo",
  "2027-06-18": "Paso a la Inmortalidad del Gral. Güemes (traslado)",
  "2027-06-20": "Paso a la Inmortalidad del Gral. San Martín",
  "2027-07-09": "Día de la Independencia",
  "2027-08-16": "Paso a la Inmortalidad del Gral. San Martín (traslado)",
  "2027-10-11": "Día del Respeto a la Diversidad Cultural (traslado)",
  "2027-11-20": "Día de la Soberanía Nacional",
  "2027-12-08": "Inmaculada Concepción de María",
  "2027-12-25": "Navidad",
};

// ─── Feriados provinciales ────────────────────────────────────────────────────
// Solo los feriados FIJOS (inamovibles) y confirmados por decreto/ley provincial.
// Se aplican en adición a los nacionales.

/**
 * Corrientes
 * - 16 de julio: Coronación Pontificia de Nuestra Señora de Itatí
 *   (Decreto Provincial 2580/86 — feriado inamovible en toda la provincia)
 * - 2 de noviembre: Día de los Fieles Difuntos
 *   (día no laborable judicial en toda la provincia, según calendario del STJ)
 */
const CORRIENTES_EXTRA: Record<string, string> = {};
for (const year of [2024, 2025, 2026, 2027]) {
  CORRIENTES_EXTRA[`${year}-07-16`] = "Virgen de Itatí (feriado provincial Corrientes)";
  CORRIENTES_EXTRA[`${year}-11-02`] = "Día de los Fieles Difuntos (Corrientes)";
}

/**
 * Misiones
 * - 30 de noviembre: Natalicio del Cte. Andrés Guacurarí / Día de la Bandera de Misiones
 *   (feriado/asueto provincial — puede trasladarse al lunes siguiente por decreto anual)
 */
const MISIONES_EXTRA: Record<string, string> = {};
for (const year of [2024, 2025, 2026, 2027]) {
  MISIONES_EXTRA[`${year}-11-30`] = "Natalicio de Andrés Guacurarí / Día de la Bandera de Misiones";
}
// 2025: por decreto se trasladó al 1 de diciembre
MISIONES_EXTRA["2025-12-01"] = "Natalicio de Andrés Guacurarí (traslado, Misiones)";
delete MISIONES_EXTRA["2025-11-30"];

// CABA — sin feriados propios adicionales (Carnaval ya está en los nacionales)
const CABA_EXTRA: Record<string, string> = {};

// Buenos Aires Provincia — feriados municipales (no provinciales uniformes)
const BUENOS_AIRES_EXTRA: Record<string, string> = {};

// ─── Provincias disponibles ───────────────────────────────────────────────────

export const PROVINCIAS = [
  { value: "nacional",      label: "Solo feriados nacionales" },
  { value: "corrientes",    label: "Corrientes" },
  { value: "misiones",      label: "Misiones" },
  { value: "caba",          label: "CABA" },
  { value: "buenos_aires",  label: "Buenos Aires (Provincia)" },
] as const;

export type Provincia = (typeof PROVINCIAS)[number]["value"];

function getProvincialHolidays(provincia: Provincia): Record<string, string> {
  switch (provincia) {
    case "corrientes":   return CORRIENTES_EXTRA;
    case "misiones":     return MISIONES_EXTRA;
    case "caba":         return CABA_EXTRA;
    case "buenos_aires": return BUENOS_AIRES_EXTRA;
    default:             return {};
  }
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FeriadoSaltado {
  fecha:    string;   // "YYYY-MM-DD"
  nombre:   string;
  tipo:     "nacional" | "provincial";
}

export interface PlazoResult {
  fechaVencimiento:  string;           // "YYYY-MM-DD"
  diasCalendario:    number;           // días corridos totales
  feriadosSaltados:  FeriadoSaltado[];
  provincia:         Provincia;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toStr(d: Date): string {
  const y   = d.getUTCFullYear();
  const m   = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isWeekend(d: Date): boolean {
  const dow = d.getUTCDay();
  return dow === 0 || dow === 6;
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
 *
 * @param fechaNotificacion  Fecha de notificación (el día 0)
 * @param diasHabiles        Días hábiles a contar
 * @param provincia          Jurisdicción provincial para aplicar feriados locales
 */
export function calculateDeadline(
  fechaNotificacion: Date,
  diasHabiles:       number,
  provincia:         Provincia = "nacional",
): PlazoResult {
  const feriadosSaltados: FeriadoSaltado[] = [];
  const provincialHolidays = getProvincialHolidays(provincia);

  const start = new Date(
    Date.UTC(
      fechaNotificacion.getFullYear(),
      fechaNotificacion.getMonth(),
      fechaNotificacion.getDate(),
    )
  );

  let current = start;
  let counted = 0;

  while (counted < diasHabiles) {
    current = nextDay(current);

    if (isWeekend(current)) continue;

    const key = toStr(current);

    if (NATIONAL_HOLIDAYS[key]) {
      feriadosSaltados.push({ fecha: key, nombre: NATIONAL_HOLIDAYS[key], tipo: "nacional" });
      continue;
    }

    if (provincialHolidays[key]) {
      feriadosSaltados.push({ fecha: key, nombre: provincialHolidays[key], tipo: "provincial" });
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
    provincia,
  };
}

// ─── Plazos comunes ───────────────────────────────────────────────────────────

export const PLAZOS_COMUNES = [
  { label: "3 días hábiles (traslados breves)",          value: 3  },
  { label: "5 días hábiles (traslados comunes)",          value: 5  },
  { label: "10 días hábiles (oposiciones)",              value: 10 },
  { label: "15 días hábiles (contestación de demanda)",  value: 15 },
  { label: "20 días hábiles (contestación ampliada)",    value: 20 },
  { label: "30 días hábiles (plazo general)",            value: 30 },
  { label: "60 días hábiles (plazo especial)",           value: 60 },
];
