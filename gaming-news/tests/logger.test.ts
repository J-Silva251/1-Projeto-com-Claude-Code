import { describe, it, expect, vi, afterEach } from "vitest";
import { logRequest } from "@/lib/logger";

describe("logRequest", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emite JSON válido com route e status", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logRequest("subscribe", 200, { ip: "1.2.3.4", demo: true });

    expect(spy).toHaveBeenCalledOnce();
    const logged = JSON.parse(spy.mock.calls[0][0] as string);
    expect(logged.route).toBe("subscribe");
    expect(logged.status).toBe(200);
    expect(logged.ip).toBe("1.2.3.4");
    expect(typeof logged.ts).toBe("string");
  });

  it("não vaza PII (sem chaves email/name)", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logRequest("subscribe", 200, { ip: "1.2.3.4" });
    const raw = spy.mock.calls[0][0] as string;
    expect(raw).not.toMatch(/email|"name"/i);
  });
});
