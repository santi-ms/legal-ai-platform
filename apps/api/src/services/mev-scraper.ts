/**
 * MEV Misiones — Mesa de Entradas Virtual del Poder Judicial de Misiones
 * URL: https://mev.jusmisiones.gov.ar
 *
 * Este módulo usa Puppeteer para:
 *   1. Autenticarse en el portal MEV
 *   2. Obtener el listado de expedientes del abogado
 *   3. Extraer último movimiento, estado y datos básicos de cada expediente
 *
 * ⚠️  SELECTORES: si el portal cambia su HTML, actualizar las constantes
 *     del objeto SELECTORS más abajo. Todos los selectores tienen fallbacks.
 *
 * Estructura típica del portal MEV Misiones:
 *   - Login: /index.php?option=com_users&view=login (Joomla-based)
 *   - Dashboard: /index.php?option=com_mev (ruta principal post-login)
 *   - Listado: tabla con expedientes del profesional
 *   - Detalle: modal o página separada con actuaciones
 */

import puppeteer, { Browser, Page } from "puppeteer";
import { logger } from "../utils/logger.js";

// ─── Configuración ────────────────────────────────────────────────────────────

const MEV_BASE_URL  = process.env.MEV_BASE_URL || "https://mev.jusmisiones.gov.ar";
const PAGE_TIMEOUT  = 30_000;   // 30s por operación
const NAV_TIMEOUT   = 45_000;   // 45s para navegación completa
const DELAY_BETWEEN = 1_200;    // ms entre acciones (evitar ban)

/**
 * Selectores del portal.
 * Usar arreglos como fallback: se prueba cada uno hasta que un elemento aparezca.
 */
const SELECTORS = {
  // ── Login ──────────────────────────────────────────────────────────────────
  usernameInput: [
    "#username",
    "input[name='username']",
    "input[id*='user']",
    "input[placeholder*='usuario' i]",
    "input[placeholder*='email' i]",
    "input[type='email']",
    "input[type='text']:first-of-type",
  ],
  passwordInput: [
    "#password",
    "input[name='password']",
    "input[type='password']",
  ],
  loginButton: [
    "button[type='submit']",
    "input[type='submit']",
    ".login-button",
    "button:not([type='button'])",
  ],

  // ── Indicadores post-login ─────────────────────────────────────────────────
  postLoginIndicator: [
    ".user-info",
    ".perfil-usuario",
    "[class*='bienvenido' i]",
    "[class*='welcome' i]",
    ".logout-link",
    "a[href*='logout']",
    "a[href*='salir']",
    "#mev-main",
    ".mev-dashboard",
  ],

  // ── Expediente list ────────────────────────────────────────────────────────
  expedientesTable:  ["#expedientes-table", ".expedientes-list", "table.expedientes", ".mev-expedientes"],
  expedienteRow:     ["tr.expediente", "tr[data-expid]", ".expediente-item", "tbody tr"],
  expedienteNumber:  [".exp-numero", "td.numero", "[data-campo='numero']", "td:first-child"],
  expedienteCaratula:["td.caratula", ".exp-caratula", "[data-campo='caratula']", "td:nth-child(2)"],
  expedienteJuzgado: ["td.juzgado", ".exp-juzgado", "[data-campo='juzgado']", "td:nth-child(3)"],
  expedienteStatus:  ["td.estado", ".exp-estado", "[data-campo='estado']", "td:nth-child(4)"],

  // ── Última actuación (en fila o en detalle) ────────────────────────────────
  ultimaActuacion:    [".ultima-actuacion", "td.actuacion", "[data-campo='actuacion']", "td:last-child"],
  actuacionFecha:     [".fecha-actuacion", ".act-fecha", "[data-campo='fecha']"],
  actuacionDesc:      [".desc-actuacion", ".act-desc", "[data-campo='descripcion']"],

  // ── Notificaciones / Cédulas ───────────────────────────────────────────────
  notifBadge:         [".notif-count", ".cedulas-count", "[class*='notif' i] .badge"],
};

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface MevMovimiento {
  descripcion: string;
  fechaText:   string;        // Texto tal como aparece en portal (DD/MM/YYYY)
  fecha:       Date | null;   // Parseado
}

export interface MevExpedienteData {
  portalId:              string;   // ID o número interno del portal
  numero:                string;   // Número del expediente
  caratula:              string;   // Carátula
  juzgado:               string;   // Juzgado / organismo
  estado:                string;   // Estado en el portal
  ultimoMovimiento:      MevMovimiento | null;
  notifPendientes:       number;
}

export interface ScrapeSession {
  browser:  Browser;
  page:     Page;
  loggedIn: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Espera ms milisegundos */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Intenta cada selector hasta encontrar uno que exista en la página */
async function findFirst(page: Page, selectors: string[], timeout = 8_000): Promise<string | null> {
  for (const sel of selectors) {
    try {
      await page.waitForSelector(sel, { timeout });
      return sel;
    } catch {
      // next
    }
  }
  return null;
}

/** Lee el text content de un elemento (sin lanzar si no existe) */
async function getText(page: Page, selector: string): Promise<string> {
  try {
    return await page.$eval(selector, (el) => el.textContent?.trim() ?? "");
  } catch {
    return "";
  }
}

/** Parsea fecha argentina DD/MM/YYYY a Date */
function parseArDate(text: string): Date | null {
  const clean = text.trim();
  // DD/MM/YYYY
  const m1 = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m1) return new Date(Number(m1[3]), Number(m1[2]) - 1, Number(m1[1]));
  // YYYY-MM-DD (ISO)
  const m2 = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return new Date(clean);
  return null;
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Lanza un browser Puppeteer y abre una página.
 * Retorna la sesión (browser + page) para reutilizar.
 */
export async function createBrowser(): Promise<ScrapeSession> {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-zygote",
      "--single-process",
    ],
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);
  page.setDefaultTimeout(PAGE_TIMEOUT);

  // UA realista
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  return { browser, page, loggedIn: false };
}

/**
 * Autenticación en el portal MEV Misiones.
 * Retorna true si el login fue exitoso.
 *
 * @throws si la página no carga o las credenciales son rechazadas
 */
export async function loginMev(
  session: ScrapeSession,
  username: string,
  password: string
): Promise<void> {
  const { page } = session;
  logger.info("[mev] Navegando a portal MEV Misiones...", { url: MEV_BASE_URL });

  // Intentar login directo en URL raíz; muchos portales Joomla redirigen al login
  await page.goto(MEV_BASE_URL, { waitUntil: "domcontentloaded" });
  await sleep(DELAY_BETWEEN);

  // ¿Ya estamos en el dashboard? (sesión previa en caché)
  const alreadyLogged = await findFirst(page, SELECTORS.postLoginIndicator, 3_000);
  if (alreadyLogged) {
    logger.info("[mev] Sesión ya activa, skip login");
    session.loggedIn = true;
    return;
  }

  // Buscar formulario de login
  const userSel = await findFirst(page, SELECTORS.usernameInput, 10_000);
  if (!userSel) {
    // Intentar URL alternativa de login
    await page.goto(`${MEV_BASE_URL}/index.php?option=com_users&view=login`, {
      waitUntil: "domcontentloaded",
    });
    await sleep(DELAY_BETWEEN);
    const retry = await findFirst(page, SELECTORS.usernameInput, 10_000);
    if (!retry) throw new Error("No se encontró el formulario de login en el portal MEV.");
  }

  const passSel = await findFirst(page, SELECTORS.passwordInput);
  if (!passSel) throw new Error("No se encontró el campo de contraseña en el portal MEV.");

  // Completar credenciales
  await page.type(userSel ?? SELECTORS.usernameInput[0], username, { delay: 60 });
  await sleep(400);
  await page.type(passSel, password, { delay: 60 });
  await sleep(400);

  // Enviar formulario
  const btnSel = await findFirst(page, SELECTORS.loginButton);
  if (btnSel) {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
      page.click(btnSel),
    ]);
  } else {
    // Fallback: Enter
    await Promise.all([
      page.waitForNavigation({ waitUntil: "domcontentloaded" }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);
  }

  await sleep(DELAY_BETWEEN);

  // Verificar login exitoso
  const loggedIn = await findFirst(page, SELECTORS.postLoginIndicator, 8_000);
  if (!loggedIn) {
    const bodyText = await page.evaluate(() => document.body.innerText ?? "");
    if (/contraseña|password|incorrect|inválid|invalid/i.test(bodyText)) {
      throw new Error("Credenciales inválidas. Verificá usuario y contraseña del portal MEV.");
    }
    throw new Error("No se pudo verificar el login en el portal MEV. El portal puede haber cambiado.");
  }

  session.loggedIn = true;
  logger.info("[mev] Login exitoso");
}

/**
 * Obtiene todos los expedientes visibles para el abogado autenticado.
 * Retorna un array de datos scrapeados.
 *
 * Esta función navega al listado de expedientes y extrae los datos de cada fila.
 */
export async function scrapeExpedientes(
  session: ScrapeSession
): Promise<MevExpedienteData[]> {
  const { page } = session;
  if (!session.loggedIn) throw new Error("Sesión no autenticada. Llamar loginMev() primero.");

  // Navegar al listado de expedientes
  const listUrls = [
    `${MEV_BASE_URL}/index.php?option=com_mev`,
    `${MEV_BASE_URL}/index.php?option=com_mev&view=expedientes`,
    `${MEV_BASE_URL}/expedientes`,
    `${MEV_BASE_URL}/mis-expedientes`,
  ];

  let tableFound = false;
  for (const url of listUrls) {
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await sleep(DELAY_BETWEEN);
    const found = await findFirst(page, SELECTORS.expedientesTable, 5_000);
    if (found) { tableFound = true; break; }
  }

  if (!tableFound) {
    logger.warn("[mev] No se encontró tabla de expedientes — intentando extracción genérica");
    // Fallback: buscar cualquier tabla con más de 2 filas
    const hasTable = await page.$("table tbody tr:nth-child(2)");
    if (!hasTable) throw new Error("No se encontró el listado de expedientes en el portal MEV.");
  }

  await sleep(500);

  // Extraer datos de cada fila
  const rows = await page.evaluate((sels) => {
    // Buscar el selector de fila que tenga resultados
    let rowEls: Element[] = [];
    for (const sel of sels.expedienteRow) {
      rowEls = Array.from(document.querySelectorAll(sel));
      if (rowEls.length > 0) break;
    }

    return rowEls.map((row, index) => {
      const getField = (selList: string[]): string => {
        for (const sel of selList) {
          const el = row.querySelector(sel);
          if (el) return (el.textContent ?? "").trim();
        }
        // Fallback: columnas por posición
        const cells = Array.from(row.querySelectorAll("td"));
        return cells[index % cells.length]?.textContent?.trim() ?? "";
      };

      const cells = Array.from(row.querySelectorAll("td")).map(
        (td) => td.textContent?.trim() ?? ""
      );

      // Intentar extraer un ID del portal (atributo data o href)
      const portalId =
        row.getAttribute("data-expid") ??
        row.getAttribute("data-id") ??
        row.querySelector("a[href*='id=']")
          ?.getAttribute("href")
          ?.match(/id=(\d+)/)?.[1] ??
        String(index + 1);

      return {
        portalId,
        numero:   getField(sels.expedienteNumber)   || cells[0] || "",
        caratula: getField(sels.expedienteCaratula) || cells[1] || "",
        juzgado:  getField(sels.expedienteJuzgado)  || cells[2] || "",
        estado:   getField(sels.expedienteStatus)   || cells[3] || "",
        ultimaActuacionText: getField(sels.ultimaActuacion) || cells[cells.length - 1] || "",
        fechaActuacionText:  getField(sels.actuacionFecha) || "",
        notifText: (row.querySelector(sels.notifBadge[0])?.textContent ?? "0").replace(/\D/g, ""),
      };
    }).filter((r) => r.numero.length > 0); // descartar filas vacías / header
  }, {
    expedienteRow:     SELECTORS.expedienteRow,
    expedienteNumber:  SELECTORS.expedienteNumber,
    expedienteCaratula: SELECTORS.expedienteCaratula,
    expedienteJuzgado: SELECTORS.expedienteJuzgado,
    expedienteStatus:  SELECTORS.expedienteStatus,
    ultimaActuacion:   SELECTORS.ultimaActuacion,
    actuacionFecha:    SELECTORS.actuacionFecha,
    notifBadge:        SELECTORS.notifBadge,
  });

  // Mapear a MevExpedienteData
  return rows.map((r) => ({
    portalId:   r.portalId,
    numero:     r.numero,
    caratula:   r.caratula,
    juzgado:    r.juzgado,
    estado:     r.estado,
    ultimoMovimiento: (r.ultimaActuacionText || r.fechaActuacionText)
      ? {
          descripcion: r.ultimaActuacionText,
          fechaText:   r.fechaActuacionText,
          fecha:       parseArDate(r.fechaActuacionText),
        }
      : null,
    notifPendientes: parseInt(r.notifText || "0", 10) || 0,
  }));
}

/**
 * Punto de entrada principal: login + scraping en una sola llamada.
 * Cierra el browser al terminar (o si falla).
 *
 * @returns Map de número de expediente → datos del portal
 */
export async function runScrape(
  username: string,
  password: string
): Promise<{ data: Map<string, MevExpedienteData>; error?: string }> {
  const session = await createBrowser();
  try {
    await loginMev(session, username, password);
    const expedientes = await scrapeExpedientes(session);

    const map = new Map<string, MevExpedienteData>();
    for (const exp of expedientes) {
      if (exp.numero) map.set(normalizeNumber(exp.numero), exp);
    }

    logger.info("[mev] Scraping completado", { total: expedientes.length });
    return { data: map };
  } catch (err: any) {
    logger.error("[mev] Error en scraping", { error: err?.message });
    return { data: new Map(), error: err?.message ?? "Error desconocido" };
  } finally {
    await session.browser.close().catch(() => {});
  }
}

/**
 * Solo verifica si las credenciales son válidas (no extrae datos).
 * Más rápido que el scraping completo.
 */
export async function testCredentials(
  username: string,
  password: string
): Promise<{ valid: boolean; error?: string }> {
  const session = await createBrowser();
  try {
    await loginMev(session, username, password);
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err?.message ?? "Error de conexión" };
  } finally {
    await session.browser.close().catch(() => {});
  }
}

// ─── Normalización ─────────────────────────────────────────────────────────────

/**
 * Normaliza un número de expediente para comparación:
 * elimina espacios, ceros iniciales, guiones redundantes.
 * Ej: "00123/2024" → "123/2024"
 */
export function normalizeNumber(num: string): string {
  return num
    .trim()
    .replace(/\s+/g, "")
    .replace(/^0+/, "")     // quitar ceros iniciales antes del /
    .toLowerCase();
}
