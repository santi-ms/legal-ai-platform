/**
 * Tests unitarios para audit-log.
 *
 * Contrato crítico: auditLog NUNCA debe tirar, porque se usa fire-and-forget
 * en endpoints de escritura. Si falla el log, el request principal igual debe
 * completar.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const createMock = vi.fn();

vi.mock("../db.js", () => ({
  prisma: {
    auditLog: {
      create: (...args: unknown[]) => createMock(...args),
    },
  },
}));

vi.mock("../utils/logger.js", () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

import { auditLog } from "./audit-log.js";
import { logger } from "../utils/logger.js";

describe("auditLog", () => {
  beforeEach(() => {
    createMock.mockReset();
    vi.mocked(logger.error).mockClear();
  });

  it("llama a prisma.auditLog.create con los campos básicos", async () => {
    createMock.mockResolvedValue({});
    await auditLog({
      tenantId: "t1",
      userId: "u1",
      action: "client.archive",
      resourceType: "Client",
      resourceId: "c1",
    });
    expect(createMock).toHaveBeenCalledTimes(1);
    const arg = createMock.mock.calls[0][0];
    expect(arg.data).toMatchObject({
      tenantId: "t1",
      userId: "u1",
      action: "client.archive",
      resourceType: "Client",
      resourceId: "c1",
      ipAddress: null,
      userAgent: null,
    });
  });

  it("extrae ip y user-agent del request si se pasa", async () => {
    createMock.mockResolvedValue({});
    const fakeRequest = {
      ip: "1.2.3.4",
      headers: { "user-agent": "Mozilla/5.0" },
    };
    await auditLog({
      tenantId: "t1",
      action: "doc.create",
      request: fakeRequest as any,
    });
    const arg = createMock.mock.calls[0][0];
    expect(arg.data.ipAddress).toBe("1.2.3.4");
    expect(arg.data.userAgent).toBe("Mozilla/5.0");
  });

  it("prefiere x-forwarded-for si no hay request.ip", async () => {
    createMock.mockResolvedValue({});
    const fakeRequest = {
      ip: undefined,
      headers: { "x-forwarded-for": "10.0.0.1, 192.168.1.1" },
    };
    await auditLog({
      tenantId: "t1",
      action: "doc.create",
      request: fakeRequest as any,
    });
    expect(createMock.mock.calls[0][0].data.ipAddress).toBe("10.0.0.1");
  });

  it("NO propaga errores de la DB — solo loggea", async () => {
    createMock.mockRejectedValue(new Error("db down"));
    await expect(
      auditLog({
        tenantId: "t1",
        action: "client.delete",
      }),
    ).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("audit"),
      expect.objectContaining({ action: "client.delete" }),
    );
  });

  it("soporta userId null (acción de sistema/webhook)", async () => {
    createMock.mockResolvedValue({});
    await auditLog({
      tenantId: "t1",
      action: "webhook.mp.payment",
      resourceType: "Invoice",
      resourceId: "inv1",
    });
    expect(createMock.mock.calls[0][0].data.userId).toBeNull();
  });
});
