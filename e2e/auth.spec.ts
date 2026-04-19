import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const API_URL = process.env.E2E_API_URL || "http://localhost:4001";
const prisma = new PrismaClient();

/**
 * Helper para obtener token de verificación desde la DB
 */
async function getVerificationToken(email: string): Promise<string | null> {
  const token = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      expires: {
        gt: new Date(),
      },
    },
    orderBy: {
      expires: "desc",
    },
  });
  return token?.token || null;
}

/**
 * Helper para obtener token de reset desde la DB
 */
async function getResetToken(email: string): Promise<string | null> {
  // Los tokens de reset también usan VerificationToken
  return getVerificationToken(email);
}

/**
 * Helper para limpiar usuario de test
 */
async function cleanupTestUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      // Eliminar tokens asociados
      await prisma.verificationToken.deleteMany({
        where: { identifier: email },
      });

      // Eliminar sesiones
      await prisma.session.deleteMany({
        where: { userId: user.id },
      });

      // Eliminar cuentas
      await prisma.account.deleteMany({
        where: { userId: user.id },
      });

      // Eliminar usuario
      await prisma.user.delete({
        where: { id: user.id },
      });
    }
  } catch (error) {
    console.warn("Error limpiando usuario de test:", error);
  }
}

test.describe("Autenticación E2E", () => {
  const timestamp = Date.now();
  const testEmail = `test+${timestamp}@legal-ai.local`;
  const testPassword = "TestPassword123";
  const testName = "Test User";

  test.beforeEach(async () => {
    // Limpiar usuario de test antes de cada test
    await cleanupTestUser(testEmail);
  });

  test.afterAll(async () => {
    // Limpiar al finalizar todos los tests
    await cleanupTestUser(testEmail);
    await prisma.$disconnect();
  });

  test("Flujo completo: Registro → Verificación → Login", async ({ page }) => {
    // 1. Registro
    await page.goto("/auth/register");
    await expect(page.locator("h1, h2")).toContainText(/registro|register/i);

    await page.fill('input[name="name"], input[type="text"]', testName);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.fill('input[name="companyName"], input[name="company"]', "Test Company");

    await page.click('button[type="submit"], button:has-text("Registrar")');

    // Esperar mensaje de éxito o redirección
    await expect(
      page.locator("text=/revisa.*email|verificar|check.*email/i")
    ).toBeVisible({ timeout: 10000 });

    // 2. Obtener token de verificación desde la DB
    let token: string | null = null;
    for (let i = 0; i < 10; i++) {
      token = await getVerificationToken(testEmail);
      if (token) break;
      await page.waitForTimeout(1000);
    }

    expect(token).not.toBeNull();
    if (!token) throw new Error("No se encontró token de verificación");

    // 3. Verificar email usando el endpoint directo
    await page.goto(`/auth/verify-email?token=${token}`);
    
    // Esperar mensaje de éxito
    await expect(
      page.locator("text=/verificado|exitoso|success/i")
    ).toBeVisible({ timeout: 10000 });

    // 4. Login
    await page.goto("/auth/login");
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.click('button[type="submit"], button:has-text("Iniciar")');

    // Esperar redirección después del login exitoso
    await page.waitForURL(/\/(documents|dashboard)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(documents|dashboard)/);
  });

  test("Login falla con credenciales incorrectas", async ({ page }) => {
    await page.goto("/auth/login");

    await page.fill('input[name="email"], input[type="email"]', "wrong@example.com");
    await page.fill('input[name="password"], input[type="password"]', "WrongPassword123");
    await page.click('button[type="submit"], button:has-text("Iniciar")');

    // Esperar mensaje de error
    await expect(
      page.locator("text=/incorrecto|inválido|error/i")
    ).toBeVisible({ timeout: 5000 });

    // No debería redirigir
    expect(page.url()).toMatch(/\/auth\/login/);
  });

  test("Reset de contraseña: request + confirm", async ({ page }) => {
    // Primero crear un usuario verificado
    await page.goto("/auth/register");
    await page.fill('input[name="name"], input[type="text"]', testName);
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', testPassword);
    await page.fill('input[name="companyName"], input[name="company"]', "Test Company");
    await page.click('button[type="submit"], button:has-text("Registrar")');

    // Verificar email
    let token = await getVerificationToken(testEmail);
    if (token) {
      const response = await page.request.get(
        `${API_URL}/api/auth/verify-email?token=${token}`
      );
      expect(response.ok()).toBeTruthy();
    }

    // Solicitar reset
    await page.goto("/auth/reset");
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.click('button[type="submit"], button:has-text("Enviar")');

    await expect(
      page.locator("text=/revisa.*email|enviado|check.*email/i")
    ).toBeVisible({ timeout: 10000 });

    // Obtener token de reset
    let resetToken: string | null = null;
    for (let i = 0; i < 10; i++) {
      resetToken = await getResetToken(testEmail);
      if (resetToken) break;
      await page.waitForTimeout(1000);
    }

    expect(resetToken).not.toBeNull();
    if (!resetToken) throw new Error("No se encontró token de reset");

    // Confirmar reset con nueva contraseña
    const newPassword = "NewPassword123";
    await page.goto(`/auth/reset/${resetToken}`);
    await page.fill('input[name="password"], input[type="password"]:nth-of-type(1)', newPassword);
    
    // Si hay confirmación de password
    const confirmPasswordInput = page.locator('input[name="confirmPassword"], input[type="password"]:nth-of-type(2)');
    if (await confirmPasswordInput.count() > 0) {
      await confirmPasswordInput.fill(newPassword);
    }
    
    await page.click('button[type="submit"], button:has-text("Confirmar")');

    // Esperar mensaje de éxito
    await expect(
      page.locator("text=/actualizado|exitoso|success/i")
    ).toBeVisible({ timeout: 10000 });

    // Verificar que puedo loguear con la nueva contraseña
    await page.goto("/auth/login");
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', newPassword);
    await page.click('button[type="submit"], button:has-text("Iniciar")');

    await page.waitForURL(/\/(documents|dashboard)/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/(documents|dashboard)/);
  });

  test("Rutas protegidas redirigen a login sin sesión", async ({ page }) => {
    // Intentar acceder a una ruta protegida sin estar autenticado
    await page.goto("/documents");

    // Debería redirigir a login
    await page.waitForURL(/\/auth\/login/, { timeout: 5000 });
    expect(page.url()).toMatch(/\/auth\/login/);
  });
});
