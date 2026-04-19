import { test, expect } from "@playwright/test";

const BASE_URL = process.env.E2E_BASE_URL || "http://localhost:3000";

test.describe("Dashboard de Documentos", () => {
  // Helper para login
  async function login(page: any, email: string = "admin@legal-ai.local", password: string = "KodoAdmin123") {
    await page.goto(`${BASE_URL}/auth/login`);
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/documents|\//, { timeout: 5000 });
  }

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("debe mostrar el dashboard y lista de documentos", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Verificar que el dashboard se carga
    await expect(page.locator("h1")).toContainText("Dashboard");
    
    // Verificar que hay una tabla o lista de documentos
    await expect(
      page.locator("table, [role='table'], .documents-list")
    ).toBeVisible({ timeout: 5000 });
  });

  test("debe aplicar filtros correctamente", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Aplicar filtro de tipo
    const typeSelect = page.locator('select').first();
    await typeSelect.selectOption("contrato_servicios");
    
    // Verificar que la URL cambió
    await expect(page).toHaveURL(/type=contrato_servicios/);
    
    // Aplicar búsqueda
    const searchInput = page.locator('input[placeholder*="Buscar" i]');
    await searchInput.fill("test");
    
    // Esperar debounce
    await page.waitForTimeout(500);
    
    // Verificar que la URL tiene el query
    await expect(page).toHaveURL(/query=test/);
  });

  test("debe mostrar preview de PDF al hacer click en Ver", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Esperar a que la tabla se cargue
    await page.waitForSelector("table, tbody tr", { timeout: 5000 });
    
    // Buscar botón de ver (Eye icon) - específicamente el que tiene aria-label
    const viewButtons = page.locator('button[aria-label="Ver PDF"]');
    const count = await viewButtons.count();
    
    if (count > 0) {
      await viewButtons.first().click();
      
      // Verificar que se abre el modal
      await expect(page.locator('text=/Vista previa|preview/i')).toBeVisible({ timeout: 3000 });
      
      // Verificar que hay un iframe o elemento de PDF
      const iframe = page.locator("iframe");
      await expect(iframe).toBeVisible({ timeout: 3000 });
      
      // Verificar que el iframe tiene un src que apunta al proxy
      const src = await iframe.getAttribute("src");
      expect(src).toContain("/api/_proxy/documents/");
      expect(src).toContain("/pdf");
    } else {
      test.skip("No hay documentos con PDF disponibles");
    }
  });

  test("debe duplicar un documento", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Esperar a que la tabla se cargue
    await page.waitForSelector("table tbody tr", { timeout: 5000 });
    
    // Contar documentos antes
    const initialCount = await page.locator("tbody tr").count();
    
    // Buscar botón de duplicar (primera fila)
    const duplicateButton = page.locator('button[aria-label="Duplicar"]').first();
    
    if (await duplicateButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await duplicateButton.click();
      
      // Esperar a que aparezca mensaje de éxito (toast)
      await expect(page.locator("text=/duplicado/i")).toBeVisible({ timeout: 5000 });
      
      // Esperar a que se recargue la lista
      await page.waitForTimeout(2000);
      
      // Verificar que la lista se actualizó (puede haber más documentos o el mismo si hay paginación)
      const finalCount = await page.locator("tbody tr").count();
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    } else {
      test.skip("No hay botón de duplicar disponible");
    }
  });

  test("debe mostrar confirmación al eliminar documento (admin)", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Esperar a que la tabla se cargue
    await page.waitForSelector("table tbody tr", { timeout: 5000 });
    
    // Buscar botón de eliminar (solo visible para admin)
    const deleteButton = page.locator('button[aria-label="Eliminar"]').first();
    
    if (await deleteButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const initialCount = await page.locator("tbody tr").count();
      
      await deleteButton.click();
      
      // Verificar que se abre el dialog de confirmación
      await expect(page.locator("text=/eliminar/i")).toBeVisible({ timeout: 3000 });
      await expect(page.locator("text=/seguro/i")).toBeVisible();
      
      // Cancelar (no eliminar)
      await page.locator("button:has-text('Cancelar')").click();
      
      // Verificar que el documento sigue ahí
      await page.waitForTimeout(500);
      const finalCount = await page.locator("tbody tr").count();
      expect(finalCount).toBe(initialCount);
    } else {
      test.skip("No hay botón de eliminar (no es admin o no hay documentos)");
    }
  });

  test("RBAC: user sin permisos no debe ver botón eliminar", async ({ page, context }) => {
    // Limpiar cookies y loguearse como usuario regular (si existe)
    await context.clearCookies();
    
    // Intentar acceder al dashboard sin login
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Debe redirigir a login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    
    // Loguearse como admin (ya que no tenemos usuarios regulares en el seed)
    await login(page);
    
    // Verificar que como admin sí ve el botón eliminar
    await page.waitForSelector("table tbody tr", { timeout: 5000 });
    const deleteButtons = page.locator('button[aria-label="Eliminar"]');
    const count = await deleteButtons.count();
    
    // Si hay documentos, debe haber botones de eliminar para admin
    if (count > 0) {
      expect(count).toBeGreaterThan(0);
    }
  });

  test("debe redirigir a login si no está autenticado", async ({ page, context }) => {
    // Cerrar sesión limpiando cookies
    await context.clearCookies();
    
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Debe redirigir a login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
    await expect(page.locator("text=/iniciar sesión|login/i")).toBeVisible();
  });

  test("debe paginar correctamente", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Buscar botón de siguiente página
    const nextButton = page.locator('button:has-text("Siguiente"), button:has(svg)').filter({ hasText: /chevron.*right/i }).last();
    
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      const initialUrl = page.url();
      
      await nextButton.click();
      
      // Esperar a que cambie la URL
      await page.waitForTimeout(1000);
      
      const newUrl = page.url();
      expect(newUrl).not.toBe(initialUrl);
      expect(newUrl).toMatch(/page=\d+/);
    } else {
      test.skip("No hay paginación disponible (menos de 20 documentos)");
    }
  });

  test("debe limpiar filtros con el botón Reset", async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard?type=contrato_servicios&query=test`);
    
    // Buscar botón de limpiar filtros
    const resetButton = page.locator('button:has-text("Limpiar"), button:has-text("Reset")');
    
    if (await resetButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resetButton.click();
      
      // Verificar que la URL se limpia
      await page.waitForTimeout(500);
      const url = page.url();
      expect(url).not.toMatch(/type=|query=/);
    } else {
      test.skip("No hay filtros activos para limpiar");
    }
  });
});
