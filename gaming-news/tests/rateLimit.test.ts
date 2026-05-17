import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { rateLimit } from "@/lib/rateLimit";

describe("rateLimit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("permite até o limite e bloqueia o excedente", () => {
    const k = "test:a";
    expect(rateLimit(k, 3, 1000)).toBe(true);
    expect(rateLimit(k, 3, 1000)).toBe(true);
    expect(rateLimit(k, 3, 1000)).toBe(true);
    expect(rateLimit(k, 3, 1000)).toBe(false);
  });

  it("libera após a janela expirar", () => {
    const k = "test:b";
    expect(rateLimit(k, 1, 1000)).toBe(true);
    expect(rateLimit(k, 1, 1000)).toBe(false);
    vi.advanceTimersByTime(1001);
    expect(rateLimit(k, 1, 1000)).toBe(true);
  });

  it("bloqueia flood de 100 chamadas (anti brute-force)", () => {
    const k = "test:flood";
    const allowed = Array.from({ length: 100 }, () => rateLimit(k, 5, 60_000)).filter(Boolean);
    expect(allowed.length).toBe(5);
  });
});
