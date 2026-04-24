/**
 * Tests unitarios para plan-limits.
 *
 * Enfoque: mockeamos `getPlanForTenant` (la única dependencia externa) y
 * validamos el algoritmo de enforcement sin tocar DB.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock del módulo de billing: Prisma real no está disponible en los tests
// unitarios, así que reemplazamos `getPlanForTenant` con un stub controlado.
vi.mock("../routes.billing.js", () => ({
  getPlanForTenant: vi.fn(),
}));

import { getPlanForTenant } from "../routes.billing.js";
import { checkMonthlyLimit, checkResourceLimit, planLimitExceededResponse } from "./plan-limits.js";

const mockedGetPlan = vi.mocked(getPlanForTenant);

function mockPlan(limits: Record<string, number>) {
  mockedGetPlan.mockResolvedValue({
    subscription: null,
    plan: { code: "test", name: "Test", limits } as any,
  } as any);
}

describe("checkMonthlyLimit", () => {
  beforeEach(() => {
    mockedGetPlan.mockReset();
  });

  it("permite pasar cuando used < limit", async () => {
    mockPlan({ docsPerMonth: 10 });
    const result = await checkMonthlyLimit({
      tenantId: "t1",
      limitKey: "docsPerMonth",
      fallbackLimit: 5,
      resourceLabel: "documentos",
      countQuery: async () => 3,
    });
    expect(result.ok).toBe(true);
    expect(result.limit).toBe(10);
    expect(result.used).toBe(3);
  });

  it("bloquea cuando used >= limit", async () => {
    mockPlan({ docsPerMonth: 10 });
    const result = await checkMonthlyLimit({
      tenantId: "t1",
      limitKey: "docsPerMonth",
      fallbackLimit: 5,
      resourceLabel: "documentos",
      countQuery: async () => 10,
    });
    expect(result.ok).toBe(false);
  });

  it("trata -1 como ilimitado y no ejecuta el countQuery", async () => {
    mockPlan({ docsPerMonth: -1 });
    const countSpy = vi.fn(async () => 999_999);
    const result = await checkMonthlyLimit({
      tenantId: "t1",
      limitKey: "docsPerMonth",
      fallbackLimit: 5,
      resourceLabel: "documentos",
      countQuery: countSpy,
    });
    expect(result.ok).toBe(true);
    expect(result.limit).toBe(-1);
    expect(countSpy).not.toHaveBeenCalled();
  });

  it("usa fallbackLimit cuando el plan no define el key", async () => {
    mockPlan({ /* sin docsPerMonth */ });
    const result = await checkMonthlyLimit({
      tenantId: "t1",
      limitKey: "docsPerMonth",
      fallbackLimit: 5,
      resourceLabel: "documentos",
      countQuery: async () => 5,
    });
    expect(result.limit).toBe(5);
    expect(result.ok).toBe(false); // 5 >= 5
  });

  it("usa fallbackLimit cuando el valor del plan no es un número", async () => {
    mockedGetPlan.mockResolvedValue({
      subscription: null,
      plan: { limits: { docsPerMonth: "not-a-number" as unknown as number } } as any,
    } as any);
    const result = await checkMonthlyLimit({
      tenantId: "t1",
      limitKey: "docsPerMonth",
      fallbackLimit: 7,
      resourceLabel: "documentos",
      countQuery: async () => 3,
    });
    expect(result.limit).toBe(7);
    expect(result.ok).toBe(true);
  });

  it("usa fallbackLimit si el tenant no tiene plan", async () => {
    mockedGetPlan.mockResolvedValue({ subscription: null, plan: null } as any);
    const result = await checkMonthlyLimit({
      tenantId: "t1",
      limitKey: "docsPerMonth",
      fallbackLimit: 2,
      resourceLabel: "documentos",
      countQuery: async () => 1,
    });
    expect(result.limit).toBe(2);
    expect(result.ok).toBe(true);
  });
});

describe("checkResourceLimit", () => {
  beforeEach(() => {
    mockedGetPlan.mockReset();
  });

  it("cuenta total de recursos y bloquea al alcanzar el tope", async () => {
    mockPlan({ maxClients: 3 });
    const result = await checkResourceLimit({
      tenantId: "t1",
      limitKey: "maxClients",
      fallbackLimit: 3,
      resourceLabel: "clientes",
      countQuery: async () => 3,
    });
    expect(result.ok).toBe(false);
    expect(result.used).toBe(3);
  });

  it("ilimitado skippea el count", async () => {
    mockPlan({ maxClients: -1 });
    const countSpy = vi.fn(async () => 100);
    const result = await checkResourceLimit({
      tenantId: "t1",
      limitKey: "maxClients",
      fallbackLimit: 3,
      resourceLabel: "clientes",
      countQuery: countSpy,
    });
    expect(result.ok).toBe(true);
    expect(countSpy).not.toHaveBeenCalled();
  });
});

describe("planLimitExceededResponse", () => {
  it("construye la respuesta 429 con el formato esperado", () => {
    const body = planLimitExceededResponse({
      ok: false,
      limit: 5,
      used: 5,
      resource: "documentos",
    });
    expect(body).toEqual({
      ok: false,
      error: "PLAN_LIMIT_EXCEEDED",
      message: "Alcanzaste el límite de 5 documentos este mes. Actualizá tu plan para continuar.",
      limit: 5,
      used: 5,
    });
  });
});
