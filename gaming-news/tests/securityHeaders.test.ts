import { describe, it, expect } from "vitest";
// @ts-expect-error — módulo .mjs sem tipos
import { securityHeaders } from "@/lib/securityHeaders.mjs";

const map = new Map(
  (securityHeaders as { key: string; value: string }[]).map((h) => [h.key, h.value])
);

describe("securityHeaders", () => {
  it("CSP impede clickjacking e restringe a origem", () => {
    const csp = map.get("Content-Security-Policy")!;
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("CSP permite os hosts de vídeo", () => {
    const csp = map.get("Content-Security-Policy")!;
    expect(csp).toContain("youtube.com");
    expect(csp).toContain("player.vimeo.com");
    expect(csp).toContain("player.twitch.tv");
  });

  it("inclui os headers anti-sniffing/clickjacking", () => {
    expect(map.get("X-Content-Type-Options")).toBe("nosniff");
    expect(map.get("X-Frame-Options")).toBe("DENY");
    expect(map.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin");
    expect(map.has("Strict-Transport-Security")).toBe(true);
  });
});
