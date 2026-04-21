/**
 * Helpers para manejar la DB de test: reset, seed, crear tenants y usuarios.
 *
 * El test runner debe haber importado `./env.ts` antes de este archivo, para
 * que DATABASE_URL apunte al Postgres de Docker (puerto 5433).
 */

import { execSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "../../src/db.js";

/**
 * Aplica las migraciones al Postgres de test. Idempotente.
 */
export function applyMigrations() {
  execSync("npx prisma migrate deploy --schema prisma/schema.prisma", {
    stdio: "inherit",
    env: { ...process.env },
  });
}

/**
 * Trunca todas las tablas del schema de test respetando FK constraints.
 * Sólo toca el schema aislado (process.env.TEST_SCHEMA), nunca `public`.
 */
export async function resetDatabase() {
  const schema = process.env.TEST_SCHEMA || "test_e2e";
  const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
    `SELECT tablename FROM pg_tables WHERE schemaname = $1 AND tablename NOT LIKE '_prisma%'`,
    schema,
  );

  if (tables.length === 0) return;

  const names = tables.map((t) => `"${schema}"."${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${names} RESTART IDENTITY CASCADE;`);
}

export interface TestTenant {
  id: string;
  name: string;
}

export interface TestUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  password: string;
  token: string; // JWT válido para Authorization: Bearer ...
}

export async function createTenant(name = "TestStudio"): Promise<TestTenant> {
  const id = randomUUID();
  const tenant = await prisma.tenant.create({
    data: {
      id,
      name: `${name}-${id.slice(0, 6)}`,
      updatedAt: new Date(),
    },
  });
  return { id: tenant.id, name: tenant.name };
}

export async function createUser(
  tenantId: string,
  opts: { email?: string; role?: string; password?: string; emailVerified?: boolean } = {},
): Promise<TestUser> {
  const email = opts.email ?? `user-${randomUUID().slice(0, 8)}@test.local`;
  const password = opts.password ?? "TestPassw0rd!";
  const passwordHash = await bcrypt.hash(password, 4); // rounds bajos en test
  const role = opts.role ?? "user";

  const user = await prisma.user.create({
    data: {
      id: randomUUID(),
      email,
      passwordHash,
      role,
      tenantId,
      emailVerified: opts.emailVerified === false ? null : new Date(),
      updatedAt: new Date(),
    } as any,
  });

  const secret = process.env.NEXTAUTH_SECRET!;
  const token = jwt.sign(
    { id: user.id, sub: user.id, email, role, tenantId },
    secret,
    { expiresIn: "1h" },
  );

  return { id: user.id, email, tenantId, role, password, token };
}

export async function closeDb() {
  await prisma.$disconnect();
}
