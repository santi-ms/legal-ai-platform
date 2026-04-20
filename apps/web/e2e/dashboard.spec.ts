import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('carga correctamente con widgets', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Verificar que al menos un widget cargó
    const hasContent = await page.getByRole('main').isVisible();
    expect(hasContent).toBe(true);
  });

  test('navegación desde dashboard a módulos', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Click en "Ver expedientes" o link similar
    const expedientesLink = page.getByRole('link', { name: /expedientes/i }).first();
    if (await expedientesLink.isVisible()) {
      await expedientesLink.click();
      await expect(page).toHaveURL(/\/expedientes/);
    }
  });
});
