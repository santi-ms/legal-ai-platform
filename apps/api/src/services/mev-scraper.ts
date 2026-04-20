/**
 * JUSTI — Sistema de Tecnología Informática del Poder Judicial de Misiones
 * URL: https://pwa.jusmisiones.gov.ar/build/
 *
 * Este módulo usa Puppeteer para:
 *   1. Autenticarse en el portal JUSTI con credenciales CADEMIS (@cademis.jusmisiones.gov.ar)
 *   2. Obtener el listado de expedientes/causas del abogado
 *   3. Extraer último movimiento, estado y datos básicos de cada expediente
 *
 * ⚠️  SELECTORES: El portal es una PWA Angular/Ionic. Los inputs están dentro de
 *     Shadow DOM de componentes ion-input. Si el portal actualiza su estructura,
 *     revisar las constantes SELECTORS más abajo.
 *
 * ℹ️  CREDENCIALES: usuario = email institucional @cademis.jusmisiones.gov.ar
 *     emitido por el Colegio de Abogados de Misiones (CADEMIS).
 *
 * Estructura del portal JUSTI:
 *   - Base URL: /build/ (Angular app con hash routing o History API)
 *   - Login: pantalla inicial del SPA
 *   - Dashboard: lista de causas/expedientes del abogado
 *   - Detalle: modal o ruta separada con actuaciones
 */

import puppeteer, { Browser, Page } from "puppeteer";
import { logger } from "../utils/logger.js";

// ─── Configuración ────────────────────────────────────────────────────────────

const JUSTI_BASE_URL = process.env.MEV_BASE_URL || "https://pwa.jusmisiones.gov.ar/build/";
const PAGE_TIMEOUT   = 45_000;   // 45s — SPA necesita más tiempo para hidratar
const NAV_TIMEOUT    = 60_000;   // 60s para navegación completa en SPA
const DELAY_BETWEEN  = 1_500;    // ms entre acciones (evitar rate-limit)
const SPA_BOOT_WAIT  = 3_000;    // espera inicial para que Angular arranque

/**
 * Selectores del portal JUSTI (Angular/Ionic PWA).
 *
 * Ionic usa Shadow DOM en sus componentes (ion-input, ion-button, etc.).
 * Para interactuar con el <input> real dentro de un ion-input hay que usar
 * el selector compuesto "ion-input input" o "ion-input .native-input".
 *
 * Todos los arrays son fallback: se prueba cada uno en orden.
 */
const SELECTORS = {
  // ── Bootstrap del SPA ─────────────────────────────────────────────────────
  appReady: [
    "ion-app",
    "app-root",
    "#app",
    ".ion-page",
    "ion-router-outlet",
  ],

  // ── Login ──────────────────────────────────────────────────────────────────
  // Ion-input expone el <input> nativo en: "ion-input input" o "ion-input .native-input"
  usernameInput: [
    "ion-input[type='email'] input",
    "ion-input[name='email'] input",
    "ion-input[name='usuario'] input",
    "ion-input[placeholder*='email' i] input",
    "ion-input[placeholder*='usuario' i] input",
    "ion-input[placeholder*='correo' i] input",
    "ion-input .native-input",
    "ion-input:first-of-type input",
    "input[type='email']",
    "input[name='email']",
    "input[placeholder*='email' i]",
    "input[placeholder*='usuario' i]",
  ],
  passwordInput: [
    "ion-input[type='password'] input",
    "ion-input[name='password'] input",
    "ion-input[name='contraseña'] input",
    "ion-input[placeholder*='contraseña' i] input",
    "ion-input[placeholder*='password' i] input",
    "input[type='password']",
    "input[name='password']",
  ],
  loginButton: [
    "ion-button[type='submit']",
    "ion-button[expand='block']",
    "ion-button",
    "button[type='submit']",
    "input[type='submit']",
    ".login-btn",
    "form button",
  ],

  // ── Indicadores post-login ─────────────────────────────────────────────────
  // En un SPA Ionic, el dashboard suele tener ion-menu, ion-tabs o ion-header con título
  postLoginIndicator: [
    "ion-menu",
    "ion-tab-bar",
    "ion-tabs",
    "ion-split-pane",
    "app-tabs",
    "app-menu",
    "app-dashboard",
    "app-expedientes",
    "app-causas",
    "ion-avatar",
    ".user-info",
    "[class*='dashboard' i]",
    "[routerlink*='expediente' i]",
    "[routerlink*='causa' i]",
    "a[href*='expediente']",
    "a[href*='causa']",
  ],

  // ── Error de login ─────────────────────────────────────────────────────────
  loginError: [
    "ion-toast",
    ".error-msg",
    ".login-error",
    "[class*='error' i]:not(input):not(ion-input)",
    "p[class*='error' i]",
  ],

  // ── Expediente / Causa list ────────────────────────────────────────────────
  expedientesContainer: [
    "app-expedientes",
    "app-causas",
    "app-mis-causas",
    "app-listado-causas",
    "ion-list.expedientes",
    "ion-list.causas",
    "ion-list",
    "table.expedientes",
    "table",
    ".expedientes-list",
    ".causas-list",
  ],
  expedienteRow: [
    "app-expediente-item",
    "app-causa-item",
    "ion-item.expediente",
    "ion-item.causa",
    "ion-item",
    "ion-card",
    "tr:not(:first-child):not(thead tr)",
    ".expediente-row",
    ".causa-row",
  ],

  // ── Campos dentro de cada fila ────────────────────────────────────────────
  expedienteNumber: [
    ".numero-expediente",
    ".numero-causa",
    ".exp-numero",
    "[class*='numero' i]",
    "ion-label.numero",
    ".nro",
    "td.numero",
    "td:first-child",
  ],
  expedienteCaratula: [
    ".caratula",
    "[class*='caratula' i]",
    ".titulo-causa",
    "ion-label.caratula",
    "h2",
    "ion-label h2",
    "td.caratula",
    "td:nth-child(2)",
  ],
  expedienteJuzgado: [
    ".juzgado",
    "[class*='juzgado' i]",
    "[class*='organismo' i]",
    ".tribunal",
    "ion-label.juzgado",
    "td.juzgado",
    "td:nth-child(3)",
  ],
  expedienteStatus: [
    ".estado",
    "[class*='estado' i]",
    ".status",
    "ion-badge",
    "td.estado",
    "td:nth-child(4)",
  ],

  // ── Última actuación ───────────────────────────────────────────────────────
  ultimaActuacion: [
    ".ultima-actuacion",
    "[class*='ultima-actuacion' i]",
    "[class*='ultimo-movimiento' i]",
    ".actuacion",
    "ion-note",
    ".nota",
    "p.actuacion",
    "td:last-child",
  ],
  actuacionFecha: [
    ".fecha-actuacion",
    "[class*='fecha' i]",
    "ion-note.fecha",
    "small.fecha",
    ".date",
  ],

  // ── Notificaciones / Cédulas pendientes ───────────────────────────────────
  notifBadge: [
    "ion-badge",
    ".badge",
    ".notif-count",
    "[class*='notif' i] ion-badge",
    "span.badge",
  ],
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

/**
 * Intenta cada selector hasta encontrar uno que exista en la página.
 * Retorna el selector que funcionó, o null si ninguno matchea.
 */
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

/** Captura screenshot para debugging cuando falla algo */
async function debugScreenshot(page: Page, name: string): Promise<void> {
  try {
    const ts = Date.now();
    const path = `/tmp/justi-debug-${name}-${ts}.png`;
    await page.screenshot({ path, fullPage: false });
    logger.info(`[justi] Screenshot guardado: ${path}`);
  } catch {
    // no-op
  }
}

/** Parsea fecha argentina DD/MM/YYYY a Date */
function parseArDate(text: string): Date | null {
  const clean = text.trim();
  const m1 = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m1) return new Date(Number(m1[3]), Number(m1[2]) - 1, Number(m1[1]));
  const m2 = clean.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return new Date(clean);
  return null;
}

// ─── Core ─────────────────────────────────────────────────────────────────────

/**
 * Lanza un browser Puppeteer optimizado para PWA Angular/Ionic.
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
      // Necesario para PWA con Service Workers
      "--disable-extensions",
      "--disable-background-networking",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
  });

  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(NAV_TIMEOUT);
  page.setDefaultTimeout(PAGE_TIMEOUT);

  // UA de Chrome moderno — PWAs pueden bloquear headless UA
  await page.setUserAgent(
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
  );

  // Viewport estándar — algunos SPAs tienen comportamiento responsive
  await page.setViewport({ width: 1280, height: 800 });

  return { browser, page, loggedIn: false };
}

/**
 * Autenticación en el portal JUSTI Misiones.
 *
 * El portal es un SPA Angular/Ionic. Estrategia:
 *   1. Navegar a la URL base y esperar que Angular bootee
 *   2. Detectar el formulario de login
 *   3. Completar credenciales (usuario = email CADEMIS)
 *   4. Enviar y esperar indicador de sesión autenticada
 *
 * @throws si el portal no carga, el formulario no aparece o las credenciales son rechazadas
 */
export async function loginMev(
  session: ScrapeSession,
  username: string,
  password: string
): Promise<void> {
  const { page } = session;
  logger.info("[justi] Navegando al portal JUSTI...", { url: JUSTI_BASE_URL });

  // Navegar al portal
  await page.goto(JUSTI_BASE_URL, { waitUntil: "networkidle2" });

  // Esperar que el SPA Angular hidrate
  await sleep(SPA_BOOT_WAIT);

  // Verificar que la app Angular/Ionic cargó
  const appReady = await findFirst(page, SELECTORS.appReady, 15_000);
  if (!appReady) {
    await debugScreenshot(page, "boot-failed");
    throw new Error("El portal JUSTI no cargó correctamente. ¿URL correcta?");
  }
  logger.info("[justi] SPA cargado", { rootSelector: appReady });

  // ¿Ya hay sesión activa?
  const alreadyLogged = await findFirst(page, SELECTORS.postLoginIndicator, 3_000);
  if (alreadyLogged) {
    logger.info("[justi] Sesión ya activa, skip login", { indicator: alreadyLogged });
    session.loggedIn = true;
    return;
  }

  // Buscar campo de usuario
  const userSel = await findFirst(page, SELECTORS.usernameInput, 12_000);
  if (!userSel) {
    await debugScreenshot(page, "no-login-form");
    throw new Error(
      "No se encontró el formulario de login en el portal JUSTI. " +
      "El portal puede haber cambiado su estructura o la URL es incorrecta."
    );
  }
  logger.info("[justi] Formulario de login detectado", { userSel });

  // Completar usuario
  await page.focus(userSel);
  await sleep(300);
  // Limpiar campo primero
  await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLInputElement | null;
    if (el) el.value = "";
  }, userSel);
  await page.type(userSel, username, { delay: 70 });
  await sleep(400);

  // Completar contraseña
  const passSel = await findFirst(page, SELECTORS.passwordInput, 5_000);
  if (!passSel) {
    throw new Error("No se encontró el campo de contraseña en el portal JUSTI.");
  }
  await page.focus(passSel);
  await sleep(300);
  await page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLInputElement | null;
    if (el) el.value = "";
  }, passSel);
  await page.type(passSel, password, { delay: 70 });
  await sleep(500);

  // Enviar formulario
  const btnSel = await findFirst(page, SELECTORS.loginButton, 5_000);
  if (btnSel) {
    logger.info("[justi] Haciendo click en botón de login", { btnSel });
    // Para SPAs, esperar cambio en URL o DOM en vez de navegación completa
    await Promise.allSettled([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15_000 }).catch(() => {}),
      page.click(btnSel),
    ]);
  } else {
    logger.warn("[justi] Botón de login no encontrado, usando Enter");
    await Promise.allSettled([
      page.waitForNavigation({ waitUntil: "networkidle2", timeout: 15_000 }).catch(() => {}),
      page.keyboard.press("Enter"),
    ]);
  }

  // Esperar re-render del SPA tras login
  await sleep(SPA_BOOT_WAIT);

  // Verificar login exitoso
  const loggedIn = await findFirst(page, SELECTORS.postLoginIndicator, 10_000);
  if (!loggedIn) {
    // Verificar si hay mensaje de error
    const errorEl = await findFirst(page, SELECTORS.loginError, 2_000);
    if (errorEl) {
      const errorText = await page.$eval(errorEl, (el) => el.textContent?.trim() ?? "").catch(() => "");
      if (errorText) {
        throw new Error(`Credenciales inválidas. Error del portal: "${errorText}"`);
      }
    }

    // Sin indicador de éxito ni de error: pedir screenshot para diagnóstico
    await debugScreenshot(page, "login-result");

    const pageTitle = await page.title().catch(() => "");
    const bodyPreview = await page.evaluate(
      () => (document.body?.innerText ?? "").substring(0, 300)
    ).catch(() => "");

    throw new Error(
      `No se pudo verificar el login en JUSTI. Título: "${pageTitle}". ` +
      `Vista previa: "${bodyPreview}". ` +
      `Verificá credenciales o revisá screenshot en /tmp/`
    );
  }

  session.loggedIn = true;
  logger.info("[justi] Login exitoso", { indicator: loggedIn });
}

/**
 * Obtiene todos los expedientes/causas visibles para el abogado autenticado.
 *
 * En JUSTI/Ionic las causas pueden estar en:
 *   - Un ion-list con ion-items
 *   - ion-cards
 *   - Una tabla HTML clásica
 * Se prueba cada alternativa en orden.
 */
export async function scrapeExpedientes(
  session: ScrapeSession
): Promise<MevExpedienteData[]> {
  const { page } = session;
  if (!session.loggedIn) throw new Error("Sesión no autenticada. Llamar loginMev() primero.");

  // Navegar al listado de expedientes/causas
  // En Angular/Ionic el routing puede ser hash (#/expedientes) o history (/expedientes)
  const listUrls = [
    JUSTI_BASE_URL,                                    // homepage puede ser el listado
    `${JUSTI_BASE_URL}#/expedientes`,
    `${JUSTI_BASE_URL}#/causas`,
    `${JUSTI_BASE_URL}#/mis-causas`,
    `${JUSTI_BASE_URL}#/listado`,
    `${JUSTI_BASE_URL}expedientes`,
    `${JUSTI_BASE_URL}causas`,
  ];

  let containerFound = false;
  for (const url of listUrls) {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 15_000 });
      await sleep(SPA_BOOT_WAIT);
      const found = await findFirst(page, SELECTORS.expedientesContainer, 5_000);
      if (found) {
        logger.info("[justi] Listado encontrado", { url, sel: found });
        containerFound = true;
        break;
      }
    } catch {
      // probar siguiente URL
    }
  }

  if (!containerFound) {
    await debugScreenshot(page, "no-expedientes");
    logger.warn("[justi] No se encontró contenedor específico — intentando extracción genérica");

    // Fallback: cualquier lista o tabla con ítems
    const fallback = await findFirst(page, ["ion-list", "ion-card", "table tbody tr:nth-child(2)"], 5_000);
    if (!fallback) {
      throw new Error(
        "No se encontró el listado de expedientes en el portal JUSTI. " +
        "Es posible que el routing del SPA haya cambiado."
      );
    }
  }

  await sleep(800);

  // Extraer datos via JavaScript (necesario para acceder a Shadow DOM de Ionic)
  const rows = await page.evaluate((sels) => {
    // ── Helper: buscar texto en el elemento usando múltiples selectores ──────
    const getField = (parent: Element, selList: string[]): string => {
      for (const sel of selList) {
        try {
          const el = parent.querySelector(sel);
          if (el) return (el.textContent ?? "").trim();
        } catch { /* invalid selector */ }
      }
      return "";
    };

    // ── Buscar el selector de fila que tenga resultados ──────────────────────
    let rowEls: Element[] = [];
    for (const sel of sels.expedienteRow) {
      try {
        rowEls = Array.from(document.querySelectorAll(sel));
        // Filtrar filas vacías o encabezados
        rowEls = rowEls.filter((r) => (r.textContent ?? "").trim().length > 5);
        if (rowEls.length > 0) break;
      } catch { /* invalid selector */ }
    }

    return rowEls.map((row, index) => {
      const cells = Array.from(row.querySelectorAll("td")).map(
        (td) => (td.textContent ?? "").trim()
      );

      // Intentar extraer un ID del portal
      const portalId =
        row.getAttribute("data-id") ??
        row.getAttribute("data-causa-id") ??
        row.getAttribute("data-exp-id") ??
        row.querySelector("a[href*='id=']")
          ?.getAttribute("href")
          ?.match(/id[=:]([a-zA-Z0-9-]+)/)?.[1] ??
        String(index + 1);

      const numero   = getField(row, sels.expedienteNumber)   || cells[0] || "";
      const caratula = getField(row, sels.expedienteCaratula) || cells[1] || "";
      const juzgado  = getField(row, sels.expedienteJuzgado)  || cells[2] || "";
      const estado   = getField(row, sels.expedienteStatus)   || cells[3] || "";
      const ultima   = getField(row, sels.ultimaActuacion)    || cells[cells.length - 1] || "";
      const fecha    = getField(row, sels.actuacionFecha)     || "";

      // Notificaciones pendientes (badge numérico)
      const notifText = (() => {
        for (const sel of sels.notifBadge) {
          try {
            const el = row.querySelector(sel);
            if (el) return (el.textContent ?? "").replace(/\D/g, "");
          } catch { /* */ }
        }
        return "0";
      })();

      return { portalId, numero, caratula, juzgado, estado, ultimaActuacionText: ultima, fechaActuacionText: fecha, notifText };
    }).filter((r) => r.numero.length > 2); // descartar filas vacías / header
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

  logger.info("[justi] Expedientes extraídos", { total: rows.length });

  // Mapear a MevExpedienteData
  return rows.map((r) => ({
    portalId:  r.portalId,
    numero:    r.numero,
    caratula:  r.caratula,
    juzgado:   r.juzgado,
    estado:    r.estado,
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
 * @returns Map de número de expediente normalizado → datos del portal
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

    logger.info("[justi] Scraping completado", { total: expedientes.length });
    return { data: map };
  } catch (err: any) {
    logger.error("[justi] Error en scraping", { error: err?.message });
    return { data: new Map(), error: err?.message ?? "Error desconocido" };
  } finally {
    await session.browser.close().catch(() => {});
  }
}

/**
 * Solo verifica si las credenciales son válidas (no extrae datos).
 * Más rápido que el scraping completo — ideal para `POST /portal/config/test`.
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
    .replace(/^0+/, "")   // quitar ceros iniciales antes del /
    .toLowerCase();
}
