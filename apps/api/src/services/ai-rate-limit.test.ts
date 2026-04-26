import { describe, expect, it } from "vitest";
import {
  consumeAiRateLimit,
  pruneExpiredEntries,
  type AiRateLimitEntry,
} from "./ai-rate-limit.js";

const WINDOW = 60_000;
const MAX = 30;

function emptyStore() {
  return new Map<string, AiRateLimitEntry>();
}

describe("consumeAiRateLimit", () => {
  it("permite la primera request y arranca la ventana", () => {
    const store = emptyStore();
    const result = consumeAiRateLimit({
      userId: "u1",
      store,
      now: 1000,
      max: MAX,
      windowMs: WINDOW,
    });
    expect(result.allowed).toBe(true);
    expect(store.get("ai:u1")).toEqual({ count: 1, resetAt: 1000 + WINDOW });
  });

  it("bloquea la request 31 dentro de la misma ventana", () => {
    const store = emptyStore();
    let result = { allowed: true, retryAfterSeconds: 0 };
    for (let i = 0; i < MAX; i++) {
      result = consumeAiRateLimit({ userId: "u1", store, now: 1000 + i, max: MAX, windowMs: WINDOW });
      expect(result.allowed).toBe(true);
    }
    const blocked = consumeAiRateLimit({ userId: "u1", store, now: 1500, max: MAX, windowMs: WINDOW });
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("resetea el contador cuando la ventana vence", () => {
    const store = emptyStore();
    for (let i = 0; i < MAX; i++) {
      consumeAiRateLimit({ userId: "u1", store, now: 1000, max: MAX, windowMs: WINDOW });
    }
    const afterWindow = consumeAiRateLimit({
      userId: "u1",
      store,
      now: 1000 + WINDOW + 1,
      max: MAX,
      windowMs: WINDOW,
    });
    expect(afterWindow.allowed).toBe(true);
    expect(store.get("ai:u1")?.count).toBe(1);
  });

  it("aísla a usuarios distintos", () => {
    const store = emptyStore();
    for (let i = 0; i < MAX; i++) {
      consumeAiRateLimit({ userId: "u1", store, now: 1000, max: MAX, windowMs: WINDOW });
    }
    const u1Blocked = consumeAiRateLimit({ userId: "u1", store, now: 1100, max: MAX, windowMs: WINDOW });
    const u2Allowed = consumeAiRateLimit({ userId: "u2", store, now: 1100, max: MAX, windowMs: WINDOW });
    expect(u1Blocked.allowed).toBe(false);
    expect(u2Allowed.allowed).toBe(true);
  });

  it("respeta un max custom", () => {
    const store = emptyStore();
    consumeAiRateLimit({ userId: "u1", store, now: 1, max: 1, windowMs: WINDOW });
    const blocked = consumeAiRateLimit({ userId: "u1", store, now: 2, max: 1, windowMs: WINDOW });
    expect(blocked.allowed).toBe(false);
  });
});

describe("pruneExpiredEntries", () => {
  it("borra sólo las entradas vencidas", () => {
    const store = emptyStore();
    store.set("ai:active", { count: 5, resetAt: 2_000 });
    store.set("ai:expired", { count: 5, resetAt: 500 });
    pruneExpiredEntries(store, 1_000);
    expect(store.has("ai:active")).toBe(true);
    expect(store.has("ai:expired")).toBe(false);
  });
});
