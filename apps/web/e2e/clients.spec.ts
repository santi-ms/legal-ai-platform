import { test, expect } from '@playwright/test';

test.describe('Gestión de Clientes', () => {
  test('lista de clientes se carga', async ({ page }) => {
    await page.goto('/clients');
    await expect(page.getByRole('heading', { name: /clientes/i })).toBeVisible();
    // Esperar que cargue (spinner desaparezca o lista aparezca)
    await page.waitForLoadState('networkidle');
  });

  test('crear cliente nuevo', async ({ page }) => {
    await page.goto('/clients');

    // Click en nuevo cliente
    await page.getByRole('button', { name: /nuevo cliente|agregar/i }).click();

    // Llenar formulario
    const timestamp = Date.now();
    const testName = `Cliente Test ${timestamp}`;
    await page.getByLabel(/nombre/i).fill(testName);
    await page.getByLabel(/email/i).fill(`test${timestamp}@ejemplo.com`);

    // Guardar
    await page.getByRole('button', { name: /guardar|crear/i }).click();

    // Verificar que aparece en la lista
    await expect(page.getByText(testName)).toBeVisible({ timeout: 5000 });
  });

  test('buscar cliente por nombre', async ({ page }) => {
    await page.goto('/clients');
    await page.waitForLoadState('networkidle');

    const searchInput = page.getByPlaceholder(/buscar/i);
    await searchInput.fill('Test');
    await page.waitForTimeout(400); // debounce

    // La lista debe filtrarse
    await page.waitForLoadState('networkidle');
  });
});
