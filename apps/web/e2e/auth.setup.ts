import { test as setup, expect } from '@playwright/test';
import path from 'path';

const authFile = path.join(__dirname, '.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to login
  await page.goto('/login');

  // Fill credentials (use test account env vars)
  const testEmail = process.env.E2E_TEST_EMAIL || 'test@example.com';
  const testPassword = process.env.E2E_TEST_PASSWORD || 'testpassword123';

  await page.getByLabel(/email/i).fill(testEmail);
  await page.getByLabel(/contraseña|password/i).fill(testPassword);
  await page.getByRole('button', { name: /iniciar sesión|login|entrar/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL(/\/(dashboard|expedientes|clientes)/, { timeout: 10000 });

  // Save auth state
  await page.context().storageState({ path: authFile });
});
