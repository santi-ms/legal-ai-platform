import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import jwt from "jsonwebtoken";
import { getUserFromRequest, requireAuth } from "./auth.js";
import type { FastifyRequest } from "fastify";

const TEST_SECRET = "test-secret-for-unit-tests";

function makeRequest(authHeader?: string): FastifyRequest {
  return {
    headers: {
      authorization: authHeader,
    },
  } as unknown as FastifyRequest;
}

function makeToken(payload: object, secret = TEST_SECRET, options?: jwt.SignOptions) {
  return jwt.sign(payload, secret, options);
}

describe("getUserFromRequest", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.NEXTAUTH_SECRET;
  });

  it("retorna null si no hay header Authorization", () => {
    const req = makeRequest(undefined);
    expect(getUserFromRequest(req)).toBeNull();
  });

  it("retorna null si el header no empieza con 'Bearer '", () => {
    const token = makeToken({ id: "u1", email: "a@b.com" });
    expect(getUserFromRequest(makeRequest(`Token ${token}`))).toBeNull();
    expect(getUserFromRequest(makeRequest(token))).toBeNull();
  });

  it("retorna null si NEXTAUTH_SECRET no está configurado", () => {
    delete process.env.NEXTAUTH_SECRET;
    const token = makeToken({ id: "u1", email: "a@b.com" });
    expect(getUserFromRequest(makeRequest(`Bearer ${token}`))).toBeNull();
  });

  it("retorna null con token firmado con secret incorrecto", () => {
    const token = makeToken({ id: "u1", email: "a@b.com" }, "wrong-secret");
    expect(getUserFromRequest(makeRequest(`Bearer ${token}`))).toBeNull();
  });

  it("retorna null con token expirado", () => {
    const token = makeToken(
      { id: "u1", email: "a@b.com" },
      TEST_SECRET,
      { expiresIn: -1 }
    );
    expect(getUserFromRequest(makeRequest(`Bearer ${token}`))).toBeNull();
  });

  it("retorna null con token malformado", () => {
    expect(getUserFromRequest(makeRequest("Bearer not.a.jwt"))).toBeNull();
  });

  it("retorna AuthUser con token válido usando campo 'id'", () => {
    const token = makeToken({
      id: "user-123",
      tenantId: "tenant-456",
      role: "owner",
      email: "test@example.com",
    });
    const user = getUserFromRequest(makeRequest(`Bearer ${token}`));
    expect(user).not.toBeNull();
    expect(user!.userId).toBe("user-123");
    expect(user!.tenantId).toBe("tenant-456");
    expect(user!.role).toBe("owner");
    expect(user!.email).toBe("test@example.com");
  });

  it("retorna AuthUser usando campo 'sub' si no hay 'id'", () => {
    const token = makeToken({
      sub: "user-789",
      email: "sub@example.com",
    });
    const user = getUserFromRequest(makeRequest(`Bearer ${token}`));
    expect(user).not.toBeNull();
    expect(user!.userId).toBe("user-789");
  });

  it("usa 'user' como role por defecto si no viene en el token", () => {
    const token = makeToken({ id: "u1", email: "a@b.com" });
    const user = getUserFromRequest(makeRequest(`Bearer ${token}`));
    expect(user!.role).toBe("user");
  });
});

describe("requireAuth", () => {
  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    delete process.env.NEXTAUTH_SECRET;
  });

  it("lanza error UNAUTHORIZED si no hay token", () => {
    expect(() => requireAuth(makeRequest(undefined))).toThrow("UNAUTHORIZED");
  });

  it("retorna el usuario si el token es válido", () => {
    const token = makeToken({ id: "u1", email: "a@b.com", role: "editor" });
    const user = requireAuth(makeRequest(`Bearer ${token}`));
    expect(user.userId).toBe("u1");
    expect(user.role).toBe("editor");
  });
});
