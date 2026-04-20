import { test, expect } from '@playwright/test';

test.describe('Autenticación', () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // Sin auth para estos tests

  test('muestra página de login correctamente', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /iniciar sesión|login/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/contraseña|password/i)).toBeVisible();
  });

  test('redirige al dashboard después de login exitoso', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill(process.env.E2E_TEST_EMAIL || 'test@example.com');
    await page.getByLabel(/contraseña|password/i).fill(process.env.E2E_TEST_PASSWORD || 'testpassword123');
    await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click();
    await expect(page).toHaveURL(/\/(dashboard|expedientes|clientes)/, { timeout: 10000 });
  });

  test('muestra error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('noexiste@test.com');
    await page.getByLabel(/contraseña|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /iniciar sesión|entrar/i }).click();
    await expect(page.getByText(/incorrecto|inválido|error/i)).toBeVisible({ timeout: 5000 });
  });

  test('redirige a login si no está autenticado', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
