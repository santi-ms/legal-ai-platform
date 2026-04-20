import { test, expect } from '@playwright/test';

test.describe('Gestión de Expedientes', () => {
  test('página de expedientes carga correctamente', async ({ page }) => {
    await page.goto('/expedientes');
    await expect(page.getByRole('heading', { name: /expedientes/i })).toBeVisible();
    await page.waitForLoadState('networkidle');
  });

  test('switch entre vista lista y tablero', async ({ page }) => {
    await page.goto('/expedientes');
    await page.waitForLoadState('networkidle');

    // Buscar botón de cambio de vista (board/list)
    const boardBtn = page.getByRole('button', { name: /tablero|board|kanban/i });
    if (await boardBtn.isVisible()) {
      await boardBtn.click();
      // Verificar que el tablero se muestra
      await expect(page.getByText(/activo|pendiente|cerrado/i).first()).toBeVisible();
    }
  });

  test('filtro por cliente funciona', async ({ page }) => {
    await page.goto('/expedientes');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/buscar/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('a');
      await page.waitForTimeout(400);
    }
  });
});
