/**
 * IURIX Online — Portal del Poder Judicial de la Provincia de Corrientes
 *
 * Sistema: IURIX (Informática Jurídica en Red)
 * URL base: https://iurix.juscorrientes.gov.ar  (o variante iurix.juscorrientes.gov.ar)
 * Credenciales: matrícula + contraseña del CFPC (Colegio Forense de Corrientes)
 *
 * ⚠️  Selectores: portal HTML tradicional (server-rendered).
 *     Si cambia la estructura, actualizar SELECTORS más abajo.
 *
 * Reutiliza los tipos MevExpedienteData y MevMovimiento del mev-scraper para
 * mantener la interfaz consistente con el portal-sync-service.
 */

import puppeteer, { Browser, Page } from "puppeteer";
import { logger } from "../utils/logger.js";
import type { MevExpedienteData, MevMovimiento, ScrapeSession } from "./mev-scraper.js";

export type { MevExpedienteData, MevMovimiento, ScrapeSession };

// ─── Configuración ────────────────────────────────────────────────────────────

const IURIX_BASE_URL = process.env.IURIX_BASE_URL || "https://iurix.juscorrientes.gov.ar";
const PAGE_TIMEOUT   = 30_000;
const NAV_TIMEOUT    = 45_000;
const DELAY_BETWEEN  = 1_200;

const SELECTORS = {
  // ── Login ──────────────────────────────────────────────────────────────────
  usernameInput: [
    "#username", "#user", "#matricula",
    "input[name='username']", "input[name='user']", "input[name='matricula']",
    "input[type='text']:first-of-type",
    "input[placeholder*='usuario' i]", "input[placeholder*='matrícula' i]",
  ],
  passwordInput: [
    "#password", "#pass",
    "input[name='password']", "input[type='password']",
  ],
  loginButton: [
    "button[type='submit']", "input[type='submit']",
    ".btn-login", ".login-btn", "button.btn-primary", "form button",
  ],

  // ── Post-login ────────────────────────────────────────────────────────────
  postLoginIndicator: [
    ".usuario-logueado", ".nombre-usuario", "[class*='bienvenido' i]",
    "#main-menu", ".menu-principal", "#contenido-principal",
    "a[href*='logout']", "a[href*='salir']", "a[href*='cerrar']",
    ".panel-usuario", "#panel-abogado",
  ],

  // ── Error de login ────────────────────────────────────────────────────────
  loginError: [
    ".alert-danger", ".error-login", ".mensaje-error",
    "[class*='error' i]:not(input)", "p.error",
  ],

  // ── Expediente list ───────────────────────────────────────────────────────
  expedientesContainer: [
    "#tabla-expedientes", "#listado-causas", "#mis-expedientes",
    "table.expedientes", "table.causas", "table.listado",
    ".tabla-expedientes", ".expedientes-list",
    "table",
  ],
  expedienteRow: [
    "tr.expediente", "tr.causa", "tr[data-id]",
    "tbody tr:not(:first-child)",
    ".expediente-item", ".causa-item",
  ],

  // ── Campos ────────────────────────────────────────────────────────────────
  expedienteNumber: [
    "td.numero", "td.nro", ".numero-causa",
    "[data-campo='numero']", "td:first-child",
  ],
  expedienteCaratula: [
    "td.caratula", "td.denominacion", ".caratula",
    "[data-campo='caratula']", "td:nth-child(2)",
  ],
  expedienteJuzgado: [
    "td.juzgado", "td.organismo", ".juzgado",
    "[data-campo='juzgado']", "td:nth-child(3)",
  ],
  expedienteStatus: [
    "td.estado", ".estado-causa", "[data-campo='estado']",
    "td:nth-child(4)",
  ],
  ultimaActuacion: [
    "td.ultima-actuacion", "td.ultimo-movimiento", ".actuacion",
    "td:last-child",
  ],
  actuacionFecha: [
    "td.fecha", ".fecha-actuacion", "[data-campo='fecha']",
  ],
  notifBadge: [
    ".badge", ".notif-count", "span.badge",
  ],
};

// ─── Helpers (reutilizados del mev-scraper) ───────────────────────────────────

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function findFirst(page: Page, selectors: string[], timeout = 8_000): Promise<string | null> {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout });
      return sel;
    } catch { /* next */ }
  }
  return null;
}

function parseArDate(text: string): Date | null {
  const clean = text.trim();
  const m1 = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m1) return new Date(Number(m1[3]), Number(m1[2]) - 1, Number(m1[1]));
  const m2 = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return new Date(clean);
  return null;
}

async function debugScreenshot(page: Page, name: string) {
  try {
    await page.screenshot({ path: `/tmp/iurix-debug-${name}-${Date.now()}.png`, fullPage: false });
    logger.info(`[iurix] Screenshot: /tmp/iurix-debug-${name}.png`);
  } catch { /* no-op */ }
}

// ─── Core ─────────────────────────────────────────────────────────────────────

export async function createBrowser(): Promise<ScrapeSession> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas", "--no-zygote", "--single-process",
    ],
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);
  page.setDefaultTimeout(PAGE_TIMEOUT);
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );
  return { browser, page, loggedIn: false };
}

export async function loginIurix(
  session: ScrapeSession,
  username: string,
  password: string
): Promise<void> {
  const { page } = session;
  logger.info("[iurix] Navegando al portal IURIX Corrientes...", { url: IURIX_BASE_URL });

  await page.goto(IURIX_BASE_URL, { waitUntil: "domcontentloaded" });
  await sleep(DELAY_BETWEEN);

  // ¿Ya logeado?
  const alreadyLogged = await findFirst(page, SELECTORS.postLoginIndicator, 3_000);
  if (alreadyLogged) {
    logger.info("[iurix] Sesión ya activa");
    session.loggedIn = true;
    return;
  }

  // Buscar form de login
  const userSel = await findFirst(page, SELECTORS.usernameInput, 10_000);
  if (!userSel) {
    // Intentar URL de login directa
    const loginUrls = [
      `${IURIX_BASE_URL}/login`,
      `${IURIX_BASE_URL}/acceso`,
      `${IURIX_BASE_URL}/index.php?mod=login`,
    ];
    let found = false;
    for (const url of loginUrls) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await sleep(DELAY_BETWEEN);
      const retry = await findFirst(page, SELECTORS.usernameInput, 5_000);
      if (retry) { found = true; break; }
    }
    if (!found) {
      await debugScreenshot(page, "no-login-form");
      throw new Error("No se encontró el formulario de login en el portal IURIX Corrientes.");
    }
  }

  const passSel = await findFirst(page, SELECTORS.passwordInput);
  if (!passSel) throw new Error("No se encontró el campo de contraseña en IURIX.");

  await page.type(userSel ?? SELECTORS.usernameInput[0], username, { delay: 60 });
  await sleep(400);
  await page.type(passSel, password, { delay: 60 });
  await sleep(400);

  const btnSel = await findFirst(page, SELECTORS.loginButton);
  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15_000 }).catch(() => {}),
    btnSel ? page.click(btnSel) : page.keyboard.press("Enter"),
  ]);

  await sleep(DELAY_BETWEEN);

  const loggedIn = await findFirst(page, SELECTORS.postLoginIndicator, 8_000);
  if (!loggedIn) {
    const errorEl = await findFirst(page, SELECTORS.loginError, 2_000);
    if (errorEl) {
      const errorText = await page.$eval(errorEl, el => el.textContent?.trim() ?? "").catch(() => "");
      if (errorText) throw new Error(`Credenciales inválidas IURIX: "${errorText}"`);
    }
    await debugScreenshot(page, "login-result");
    const bodyPreview = await page.evaluate(() => document.body?.innerText?.substring(0, 300) ?? "").catch(() => "");
    throw new Error(`No se pudo verificar login IURIX. Vista previa: "${bodyPreview}"`);
  }

  session.loggedIn = true;
  logger.info("[iurix] Login exitoso");
}

export async function scrapeExpedientes(session: ScrapeSession): Promise<MevExpedienteData[]> {
  const { page } = session;
  if (!session.loggedIn) throw new Error("Sesión IURIX no autenticada.");

  // Navegar al listado de expedientes
  const listUrls = [
    `${IURIX_BASE_URL}/expedientes/mis-causas`,
    `${IURIX_BASE_URL}/causas`,
    `${IURIX_BASE_URL}/expedientes`,
    `${IURIX_BASE_URL}/index.php?mod=causas`,
    `${IURIX_BASE_URL}/index.php?mod=expedientes`,
    IURIX_BASE_URL,
  ];

  let tableFound = false;
  for (const url of listUrls) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
      await sleep(DELAY_BETWEEN);
      const found = await findFirst(page, SELECTORS.expedientesContainer, 5_000);
      if (found) { tableFound = true; break; }
    } catch { /* next */ }
  }

  if (!tableFound) {
    await debugScreenshot(page, "no-expedientes");
    logger.warn("[iurix] No se encontró tabla de expedientes");
    const fallback = await findFirst(page, ["table tbody tr:nth-child(2)"], 3_000);
    if (!fallback) throw new Error("No se encontró el listado de expedientes en IURIX.");
  }

  await sleep(500);

  const rows = await page.evaluate((sels) => {
    const getField = (parent: Element, selList: string[]): string => {
      for (const sel of selList) {
        try {
          const el = parent.querySelector(sel);
          if (el) return (el.textContent ?? "").trim();
        } catch { /* invalid sel */ }
      }
      return "";
    };

    let rowEls: Element[] = [];
    for (const sel of sels.expedienteRow) {
      try {
        rowEls = Array.from(document.querySelectorAll(sel)).filter(
          r => (r.textContent ?? "").trim().length > 5
        );
        if (rowEls.length > 0) break;
      } catch { /* next */ }
    }

    return rowEls.map((row, index) => {
      const cells = Array.from(row.querySelectorAll("td")).map(td => (td.textContent ?? "").trim());

      const portalId =
        row.getAttribute("data-id") ?? row.getAttribute("data-exp") ??
        row.querySelector("a[href*='id=']")?.getAttribute("href")?.match(/id[=:]([a-zA-Z0-9-]+)/)?.[1] ??
        String(index + 1);

      return {
        portalId,
        numero:              getField(row, sels.expedienteNumber)   || cells[0] || "",
        caratula:            getField(row, sels.expedienteCaratula) || cells[1] || "",
        juzgado:             getField(row, sels.expedienteJuzgado)  || cells[2] || "",
        estado:              getField(row, sels.expedienteStatus)   || cells[3] || "",
        ultimaActuacionText: getField(row, sels.ultimaActuacion)    || cells[cells.length - 1] || "",
        fechaActuacionText:  getField(row, sels.actuacionFecha)     || "",
        notifText:           (() => {
          for (const sel of sels.notifBadge) {
            try {
              const el = row.querySelector(sel);
              if (el) return (el.textContent ?? "").replace(/\D/g, "");
            } catch { /* */ }
          }
          return "0";
        })(),
      };
    }).filter(r => r.numero.length > 2);
  }, {
    expedienteRow:      SELECTORS.expedienteRow,
    expedienteNumber:   SELECTORS.expedienteNumber,
    expedienteCaratula: SELECTORS.expedienteCaratula,
    expedienteJuzgado:  SELECTORS.expedienteJuzgado,
    expedienteStatus:   SELECTORS.expedienteStatus,
    ultimaActuacion:    SELECTORS.ultimaActuacion,
    actuacionFecha:     SELECTORS.actuacionFecha,
    notifBadge:         SELECTORS.notifBadge,
  });

  logger.info("[iurix] Expedientes extraídos", { total: rows.length });

  return rows.map(r => ({
    portalId:  r.portalId,
    numero:    r.numero,
    caratula:  r.caratula,
    juzgado:   r.juzgado,
    estado:    r.estado,
    ultimoMovimiento: (r.ultimaActuacionText || r.fechaActuacionText)
      ? { descripcion: r.ultimaActuacionText, fechaText: r.fechaActuacionText, fecha: parseArDate(r.fechaActuacionText) }
      : null,
    notifPendientes: parseInt(r.notifText || "0", 10) || 0,
  }));
}

export async function runScrape(
  username: string,
  password: string
): Promise<{ data: Map<string, MevExpedienteData>; error?: string }> {
  const session = await createBrowser();
  try {
    await loginIurix(session, username, password);
    const expedientes = await scrapeExpedientes(session);
    const map = new Map<string, MevExpedienteData>();
    for (const exp of expedientes) {
      if (exp.numero) map.set(normalizeNumber(exp.numero), exp);
    }
    logger.info("[iurix] Scraping completado", { total: expedientes.length });
    return { data: map };
  } catch (err: any) {
    logger.error("[iurix] Error", { error: err?.message });
    return { data: new Map(), error: err?.message ?? "Error desconocido" };
  } finally {
    await session.browser.close().catch(() => {});
  }
}

export async function testCredentials(
  username: string,
  password: string
): Promise<{ valid: boolean; error?: string }> {
  const session = await createBrowser();
  try {
    await loginIurix(session, username, password);
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err?.message ?? "Error de conexión" };
  } finally {
    await session.browser.close().catch(() => {});
  }
}

export function normalizeNumber(num: string): string {
  return num.trim().replace(/\s+/g, "").replace(/^0+/, "").toLowerCase();
}
