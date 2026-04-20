/**
 * PJN — Poder Judicial de la Nación (Consulta de Causas)
 *
 * Sistema: SCW (Sistema de Consulta Web) + SIGE del PJN
 * URL pública: https://scw.pjn.gov.ar/scw/home.seam
 * URL autenticada: https://www.pjn.gov.ar (requiere e-Token del Colegio)
 *
 * Estrategia DUAL:
 *   Modo público:       Búsqueda por número de expediente sin login
 *                       → Disponible para cualquier plan, sin credenciales
 *   Modo autenticado:   Sync completo de "mis causas" con credenciales abogado
 *                       → Plan Pro, requiere usuario PJN
 *
 * Jurisdicción: Fueros federales y justicia nacional de CABA
 *   - Civil/Comercial Federal (CCF)
 *   - Contencioso Administrativo Federal (CAF)
 *   - Criminal y Correccional Federal (CCyC)
 *   - Laboral (JNLT) — juzgados nacionales
 *   - Civil (JNC) — juzgados nacionales
 */

import puppeteer, { Browser, Page } from "puppeteer";
import { logger } from "../utils/logger.js";
import type { MevExpedienteData, ScrapeSession } from "./mev-scraper.js";

export type { MevExpedienteData, ScrapeSession };

// ─── Configuración ────────────────────────────────────────────────────────────

const PJN_BASE_URL      = process.env.PJN_BASE_URL      || "https://scw.pjn.gov.ar/scw/home.seam";
const PJN_AUTH_BASE_URL = process.env.PJN_AUTH_BASE_URL || "https://www.pjn.gov.ar";
const PAGE_TIMEOUT      = 40_000;
const NAV_TIMEOUT       = 60_000;
const DELAY_BETWEEN     = 2_500;  // El PJN es lento y tiene rate-limit

// ─── Selectors para modo autenticado ─────────────────────────────────────��───

const AUTH_SELECTORS = {
  usernameInput: [
    "#username", "#Usuario", "input[name='username']",
    "input[name='j_username']",
    "input[type='text']:first-of-type",
    "input[placeholder*='usuario' i]",
  ],
  passwordInput: [
    "#password", "input[name='password']", "input[name='j_password']",
    "input[type='password']",
  ],
  loginButton: [
    "button[type='submit']", "input[type='submit']",
    ".btn-ingresar", "#btnIngresar", "form button",
  ],
  postLoginIndicator: [
    "#menuPrincipal", ".menu-abogado", ".usuario-autenticado",
    "a[href*='logout']", "a[href*='salir']",
    "#contenido-pjn", ".mis-causas-pjn",
  ],
  expedientesContainer: [
    "#listadoCausas", "table.causas-pjn", "#gridCausas",
    "table", ".causas-list",
  ],
  expedienteRow: [
    "tr.causa-row", "tr[data-causa]",
    "tbody tr:not(:first-child)", "tbody tr",
  ],
};

// ─── Selectors para búsqueda pública (SCW) ───────────────────────────────────

const PUBLIC_SELECTORS = {
  searchForm:       ["form#busquedaForm", "#formBusqueda", "form.busqueda"],
  numeroInput:      ["#numero", "input[name='numero']", "input[name='nroExpediente']"],
  anioInput:        ["#anio",   "input[name='anio']",   "input[name='year']"],
  camaraSelect:     ["#camara", "select[name='camara']"],
  searchButton:     ["#btnBuscar", "button.buscar", "input[type='submit']"],
  resultsContainer: ["#resultados", ".resultados-busqueda", "#divResultados"],
  resultRow:        ["tr.resultado", ".resultado-causa", "tbody tr"],
  detailLink:       ["a.ver-detalle", "a.detalle", "td a:first-child"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
    await page.screenshot({ path: `/tmp/pjn-debug-${name}-${Date.now()}.png` });
    logger.info(`[pjn] Screenshot: /tmp/pjn-debug-${name}.png`);
  } catch { /* no-op */ }
}

// ─── Modo público: buscar expediente por número ───────────────────────────────

/**
 * Busca un expediente en el SCW público del PJN.
 * No requiere autenticación, disponible para cualquier plan.
 *
 * @param numeroExpediente - Número del expediente (ej: "12345/2023")
 * @param camara - Cámara/fuero (ej: "CCF", "CAF", "LABORAL")
 */
export async function searchExpedientePublico(
  numeroExpediente: string,
  camara?: string
): Promise<MevExpedienteData | null> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--no-zygote"],
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);
  page.setDefaultTimeout(PAGE_TIMEOUT);
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  try {
    await page.goto(PJN_BASE_URL, { waitUntil: "domcontentloaded" });
    await sleep(2000);

    // Parsear número y año
    const match = numeroExpediente.match(/^(\d+)[\/\-](\d{4})/);
    if (!match) return null;
    const [, num, anio] = match;

    // Completar formulario de búsqueda
    const numSel = await findFirst(page, PUBLIC_SELECTORS.numeroInput, 8_000);
    if (!numSel) {
      logger.warn("[pjn-public] No se encontró campo de búsqueda");
      return null;
    }

    await page.type(numSel, num, { delay: 50 });
    await sleep(300);

    const anioSel = await findFirst(page, PUBLIC_SELECTORS.anioInput, 3_000);
    if (anioSel) {
      await page.type(anioSel, anio, { delay: 50 });
    }

    if (camara) {
      const camaraSel = await findFirst(page, PUBLIC_SELECTORS.camaraSelect, 3_000);
      if (camaraSel) {
        await page.select(camaraSel, camara);
      }
    }

    const btnSel = await findFirst(page, PUBLIC_SELECTORS.searchButton);
    if (!btnSel) return null;

    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15_000 }).catch(() => {}),
      page.click(btnSel),
    ]);
    await sleep(DELAY_BETWEEN);

    // Extraer resultado
    const resultRows = await findFirst(page, PUBLIC_SELECTORS.resultRow, 8_000);
    if (!resultRows) return null;

    const result = await page.evaluate((sels) => {
      const rows = Array.from(document.querySelectorAll(sels.resultRow));
      if (!rows.length) return null;
      const row = rows[0];
      const cells = Array.from(row.querySelectorAll("td")).map(td => (td.textContent ?? "").trim());
      return {
        portalId:  row.getAttribute("data-id") ?? "1",
        numero:    cells[0] ?? "",
        caratula:  cells[1] ?? "",
        juzgado:   cells[2] ?? "",
        estado:    cells[3] ?? "",
        ultima:    cells[cells.length - 1] ?? "",
        fecha:     "",
      };
    }, { resultRow: PUBLIC_SELECTORS.resultRow[0] });

    if (!result || !result.numero) return null;

    return {
      portalId:  result.portalId,
      numero:    result.numero,
      caratula:  result.caratula,
      juzgado:   result.juzgado,
      estado:    result.estado,
      ultimoMovimiento: result.ultima
        ? { descripcion: result.ultima, fechaText: result.fecha, fecha: parseArDate(result.fecha) }
        : null,
      notifPendientes: 0,
    };
  } catch (err: any) {
    logger.warn("[pjn-public] Error en búsqueda", { err: err?.message });
    return null;
  } finally {
    await browser.close().catch(() => {});
  }
}

// ─── Modo autenticado: sync completo ──────────────────────────────────���──────

export async function createBrowser(): Promise<ScrapeSession> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--no-zygote", "--single-process"],
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

export async function loginPjn(
  session: ScrapeSession,
  username: string,
  password: string
): Promise<void> {
  const { page } = session;
  logger.info("[pjn] Navegando al portal PJN...", { url: PJN_AUTH_BASE_URL });

  await page.goto(PJN_AUTH_BASE_URL, { waitUntil: "domcontentloaded" });
  await sleep(DELAY_BETWEEN);

  const alreadyLogged = await findFirst(page, AUTH_SELECTORS.postLoginIndicator, 3_000);
  if (alreadyLogged) {
    logger.info("[pjn] Sesión ya activa");
    session.loggedIn = true;
    return;
  }

  const userSel = await findFirst(page, AUTH_SELECTORS.usernameInput, 10_000);
  if (!userSel) {
    const loginUrls = [
      `${PJN_AUTH_BASE_URL}/login`, `${PJN_AUTH_BASE_URL}/acceso`,
      `${PJN_AUTH_BASE_URL}/autenticar`,
    ];
    let found = false;
    for (const url of loginUrls) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await sleep(DELAY_BETWEEN);
      const retry = await findFirst(page, AUTH_SELECTORS.usernameInput, 5_000);
      if (retry) { found = true; break; }
    }
    if (!found) {
      await debugScreenshot(page, "no-login");
      throw new Error("No se encontró el formulario de login en el portal PJN.");
    }
  }

  const passSel = await findFirst(page, AUTH_SELECTORS.passwordInput);
  if (!passSel) throw new Error("No se encontró campo de contraseña en PJN.");

  await page.type(userSel ?? AUTH_SELECTORS.usernameInput[0], username, { delay: 80 });
  await sleep(500);
  await page.type(passSel, password, { delay: 80 });
  await sleep(500);

  const btnSel = await findFirst(page, AUTH_SELECTORS.loginButton);
  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {}),
    btnSel ? page.click(btnSel) : page.keyboard.press("Enter"),
  ]);

  await sleep(DELAY_BETWEEN);

  const loggedIn = await findFirst(page, AUTH_SELECTORS.postLoginIndicator, 10_000);
  if (!loggedIn) {
    await debugScreenshot(page, "login-result");
    const bodyPreview = await page.evaluate(() => document.body?.innerText?.substring(0, 300) ?? "").catch(() => "");
    throw new Error(`No se pudo verificar login PJN. Vista: "${bodyPreview.substring(0, 200)}"`);
  }

  session.loggedIn = true;
  logger.info("[pjn] Login exitoso");
}

export async function scrapeExpedientes(session: ScrapeSession): Promise<MevExpedienteData[]> {
  const { page } = session;
  if (!session.loggedIn) throw new Error("Sesión PJN no autenticada.");

  const listUrls = [
    `${PJN_AUTH_BASE_URL}/mis-causas`,
    `${PJN_AUTH_BASE_URL}/causas`,
    `${PJN_AUTH_BASE_URL}/expedientes/mis-expedientes`,
    PJN_AUTH_BASE_URL,
  ];

  let tableFound = false;
  for (const url of listUrls) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await sleep(DELAY_BETWEEN);
      const found = await findFirst(page, AUTH_SELECTORS.expedientesContainer, 8_000);
      if (found) { tableFound = true; break; }
    } catch { /* next */ }
  }

  if (!tableFound) {
    await debugScreenshot(page, "no-expedientes");
    throw new Error("No se encontró el listado de causas en PJN.");
  }

  const rows = await page.evaluate((sels) => {
    const getField = (parent: Element, selList: string[]): string => {
      for (const sel of selList) {
        try {
          const el = parent.querySelector(sel);
          if (el) return (el.textContent ?? "").trim();
        } catch { /* */ }
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
      } catch { /* */ }
    }

    return rowEls.map((row, index) => {
      const cells = Array.from(row.querySelectorAll("td")).map(td => (td.textContent ?? "").trim());
      return {
        portalId:            row.getAttribute("data-id") ?? String(index + 1),
        numero:              cells[0] ?? "",
        caratula:            cells[1] ?? "",
        juzgado:             cells[2] ?? "",
        estado:              cells[3] ?? "",
        ultimaActuacionText: cells[cells.length - 1] ?? "",
        fechaActuacionText:  "",
      };
    }).filter(r => r.numero.length > 2);
  }, {
    expedienteRow: AUTH_SELECTORS.expedienteRow,
  });

  return rows.map(r => ({
    portalId:  r.portalId,
    numero:    r.numero,
    caratula:  r.caratula,
    juzgado:   r.juzgado,
    estado:    r.estado,
    ultimoMovimiento: r.ultimaActuacionText
      ? { descripcion: r.ultimaActuacionText, fechaText: r.fechaActuacionText, fecha: parseArDate(r.fechaActuacionText) }
      : null,
    notifPendientes: 0,
  }));
}

export async function runScrape(
  username: string,
  password: string
): Promise<{ data: Map<string, MevExpedienteData>; error?: string }> {
  const session = await createBrowser();
  try {
    await loginPjn(session, username, password);
    const expedientes = await scrapeExpedientes(session);
    const map = new Map<string, MevExpedienteData>();
    for (const exp of expedientes) {
      if (exp.numero) map.set(normalizeNumber(exp.numero), exp);
    }
    return { data: map };
  } catch (err: any) {
    logger.error("[pjn] Error", { error: err?.message });
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
    await loginPjn(session, username, password);
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
