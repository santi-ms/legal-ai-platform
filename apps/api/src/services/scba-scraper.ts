/**
 * MEV SCBA — Mesa de Entradas Virtual de la Suprema Corte de Justicia
 * de la Provincia de Buenos Aires
 *
 * URL: https://mev.scba.gov.ar  (o variante: https://notificaciones.scba.gov.ar)
 * Credenciales: CUIL/CUIT + contraseña del sistema JUBA (Justicia Buenos Aires)
 *   ó matrícula CPACF + contraseña según el perfil
 *
 * ⚠️  El portal MEV SCBA es el más usado de Argentina (70k+ abogados).
 *     Tiene protección anti-bot fuerte: rate-limit, posible CAPTCHA.
 *     Implementado con rate-limit: 1 req/3s y User-Agent realista.
 *
 * Para la consulta de expedientes NO se requiere token/certificado digital.
 * El certificado digital solo se necesita para presentar escritos.
 */

import puppeteer, { Browser, Page } from "puppeteer";
import { logger } from "../utils/logger.js";
import type { MevExpedienteData, ScrapeSession } from "./mev-scraper.js";

export type { MevExpedienteData, ScrapeSession };

// ─── Configuración ────────────────────────────────────────────────────────────

const SCBA_BASE_URL = process.env.SCBA_BASE_URL || "https://mev.scba.gov.ar";
const PAGE_TIMEOUT  = 40_000;
const NAV_TIMEOUT   = 60_000;
const DELAY_BETWEEN = 2_000;   // Más lento: rate-limit duro en SCBA

const SELECTORS = {
  // ── Login ──────────────────────────────────────────────────────────────────
  usernameInput: [
    "#txtUsuario", "#Usuario", "#UserName", "#cuil", "#cuit",
    "input[name='usuario']", "input[name='UserName']",
    "input[name='cuil']",   "input[name='cuit']",
    "input[type='text']:first-of-type",
    "input[placeholder*='usuario' i]", "input[placeholder*='CUIL' i]",
  ],
  passwordInput: [
    "#txtPassword", "#Password", "#pass",
    "input[name='password']", "input[name='Password']",
    "input[type='password']",
  ],
  loginButton: [
    "#btnIngresar", "#btnLogin", "button[type='submit']",
    "input[type='submit']", ".btn-ingresar", "form button",
    "a.btn-ingresar",
  ],

  // ── Post-login ────────────────────────────────────────────────────────────
  postLoginIndicator: [
    "#nombre-usuario", ".nombre-usuario", ".abogado-nombre",
    "#menu-principal", ".menu-principal",
    "a[href*='logout']", "a[href*='salir']", "a[href*='CerrarSesion']",
    "#contenido-mev", ".panel-mev", "#mis-causas",
  ],

  // ── Captcha (si aparece) ──────────────────────────────────────────────────
  captcha: [
    "iframe[src*='recaptcha']",
    ".g-recaptcha",
    "#captcha",
  ],

  // ── Expediente list ───────────────────────────────────────────────────────
  expedientesContainer: [
    "#gridCausas", "#grdCausas", "#gridExpedientes",
    "table.grid-causas", "table#GridView1",
    ".grid-causas", "#mis-causas table", "#contenido-mev table",
    "table",
  ],
  expedienteRow: [
    "tr.fila-causa", "tr.GridRowStyle", "tr.GridAlternatingRowStyle",
    "tr[class*='row' i]", "tbody tr:not(:first-child)", "tbody tr",
  ],

  expedienteNumber: [
    "td.numero-expediente", "td.numero", ".nro-causa",
    "td:first-child span", "td:first-child",
  ],
  expedienteCaratula: [
    "td.caratula", "td.denominacion",
    "td:nth-child(2)", "td:nth-child(3)",
  ],
  expedienteJuzgado: [
    "td.juzgado", "td.organismo", "td.camara",
    "td:nth-child(4)",
  ],
  expedienteStatus: [
    "td.estado", "td.situacion",
    "td:nth-child(5)",
  ],
  ultimaActuacion: [
    "td.ultima-actuacion", "td.ultimo-movimiento",
    "td:nth-child(6)", "td:last-child",
  ],
  actuacionFecha: [
    "td.fecha-actuacion", "td.fecha",
  ],
  notifBadge: [
    "td.notificaciones span", ".badge-notif", "td.cedulas span",
  ],

  // ── Paginación ────────────────────────────────────────────────────────────
  nextPageButton: [
    "a[title='Siguiente']", "a[title='Next']",
    ".pager a:last-child", "td.paginado a:last-child",
  ],
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
    await page.screenshot({ path: `/tmp/scba-debug-${name}-${Date.now()}.png` });
    logger.info(`[scba] Screenshot: /tmp/scba-debug-${name}.png`);
  } catch { /* no-op */ }
}

async function extractRowsFromCurrentPage(page: Page): Promise<any[]> {
  return page.evaluate((sels) => {
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
      const portalId =
        row.getAttribute("data-id") ??
        row.querySelector("a[href*='id=']")?.getAttribute("href")?.match(/id=(\w+)/)?.[1] ??
        String(index + 1);

      return {
        portalId,
        numero:              getField(row, sels.expedienteNumber)   || cells[0] || "",
        caratula:            getField(row, sels.expedienteCaratula) || cells[1] || "",
        juzgado:             getField(row, sels.expedienteJuzgado)  || cells[2] || "",
        estado:              getField(row, sels.expedienteStatus)   || cells[3] || "",
        ultimaActuacionText: getField(row, sels.ultimaActuacion)    || cells[cells.length - 1] || "",
        fechaActuacionText:  getField(row, sels.actuacionFecha)     || "",
        notifText:           "0",
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
  });
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
  await page.setViewport({ width: 1280, height: 800 });
  return { browser, page, loggedIn: false };
}

export async function loginScba(
  session: ScrapeSession,
  username: string,
  password: string
): Promise<void> {
  const { page } = session;
  logger.info("[scba] Navegando al portal MEV SCBA...", { url: SCBA_BASE_URL });

  await page.goto(SCBA_BASE_URL, { waitUntil: "domcontentloaded" });
  await sleep(DELAY_BETWEEN);

  // ¿Ya logeado?
  const alreadyLogged = await findFirst(page, SELECTORS.postLoginIndicator, 3_000);
  if (alreadyLogged) {
    logger.info("[scba] Sesión ya activa");
    session.loggedIn = true;
    return;
  }

  // Verificar CAPTCHA (bloqueo total si aparece — no intentamos resolverlo)
  const hasCaptcha = await findFirst(page, SELECTORS.captcha, 2_000);
  if (hasCaptcha) {
    await debugScreenshot(page, "captcha");
    throw new Error(
      "El portal MEV SCBA muestra un CAPTCHA. No es posible autenticarse automáticamente en este momento. " +
      "Intentá más tarde o contactá soporte."
    );
  }

  const userSel = await findFirst(page, SELECTORS.usernameInput, 10_000);
  if (!userSel) {
    // Intentar URL de login directa
    const loginUrls = [
      `${SCBA_BASE_URL}/login.aspx`, `${SCBA_BASE_URL}/login`,
      `${SCBA_BASE_URL}/Account/Login`,
    ];
    let found = false;
    for (const url of loginUrls) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await sleep(DELAY_BETWEEN);
      const retry = await findFirst(page, SELECTORS.usernameInput, 5_000);
      if (retry) { found = true; break; }
    }
    if (!found) {
      await debugScreenshot(page, "no-login");
      throw new Error("No se encontró el formulario de login en el portal MEV SCBA.");
    }
  }

  const passSel = await findFirst(page, SELECTORS.passwordInput);
  if (!passSel) throw new Error("No se encontró el campo de contraseña en MEV SCBA.");

  await page.type(userSel ?? SELECTORS.usernameInput[0], username, { delay: 80 });
  await sleep(500);
  await page.type(passSel, password, { delay: 80 });
  await sleep(500);

  const btnSel = await findFirst(page, SELECTORS.loginButton);
  await Promise.allSettled([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 20_000 }).catch(() => {}),
    btnSel ? page.click(btnSel) : page.keyboard.press("Enter"),
  ]);

  await sleep(DELAY_BETWEEN);

  const loggedIn = await findFirst(page, SELECTORS.postLoginIndicator, 10_000);
  if (!loggedIn) {
    await debugScreenshot(page, "login-result");
    const bodyPreview = await page.evaluate(() => document.body?.innerText?.substring(0, 400) ?? "").catch(() => "");
    if (/contraseña|inválid|incorrecto/i.test(bodyPreview)) {
      throw new Error("Credenciales inválidas para MEV SCBA.");
    }
    throw new Error(`No se pudo verificar login MEV SCBA. Vista previa: "${bodyPreview.substring(0, 200)}"`);
  }

  session.loggedIn = true;
  logger.info("[scba] Login exitoso en MEV SCBA");
}

export async function scrapeExpedientes(session: ScrapeSession): Promise<MevExpedienteData[]> {
  const { page } = session;
  if (!session.loggedIn) throw new Error("Sesión MEV SCBA no autenticada.");

  const listUrls = [
    `${SCBA_BASE_URL}/MisCausas`, `${SCBA_BASE_URL}/mis-causas`,
    `${SCBA_BASE_URL}/Causas/MisCausas`,
    `${SCBA_BASE_URL}/expedientes`, SCBA_BASE_URL,
  ];

  let tableFound = false;
  for (const url of listUrls) {
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
      await sleep(DELAY_BETWEEN);
      const found = await findFirst(page, SELECTORS.expedientesContainer, 8_000);
      if (found) { tableFound = true; break; }
    } catch { /* next */ }
  }

  if (!tableFound) {
    await debugScreenshot(page, "no-expedientes");
    throw new Error("No se encontró el listado de causas en MEV SCBA.");
  }

  // Extraer todas las páginas (hasta 10 páginas máx)
  const allRows: any[] = [];
  let pageNum = 1;
  const MAX_PAGES = 10;

  while (pageNum <= MAX_PAGES) {
    const rows = await extractRowsFromCurrentPage(page);
    allRows.push(...rows);
    logger.info(`[scba] Página ${pageNum}: ${rows.length} causas`);

    // Intentar ir a la página siguiente
    const nextBtn = await findFirst(page, SELECTORS.nextPageButton, 2_000);
    if (!nextBtn) break;

    try {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15_000 }),
        page.click(nextBtn),
      ]);
      await sleep(DELAY_BETWEEN);
      pageNum++;
    } catch {
      break;
    }
  }

  logger.info("[scba] Total causas extraídas", { total: allRows.length });

  return allRows.map(r => ({
    portalId:  r.portalId,
    numero:    r.numero,
    caratula:  r.caratula,
    juzgado:   r.juzgado,
    estado:    r.estado,
    ultimoMovimiento: (r.ultimaActuacionText || r.fechaActuacionText)
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
    await loginScba(session, username, password);
    const expedientes = await scrapeExpedientes(session);
    const map = new Map<string, MevExpedienteData>();
    for (const exp of expedientes) {
      if (exp.numero) map.set(normalizeNumber(exp.numero), exp);
    }
    return { data: map };
  } catch (err: any) {
    logger.error("[scba] Error", { error: err?.message });
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
    await loginScba(session, username, password);
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
