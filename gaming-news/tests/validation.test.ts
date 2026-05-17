import { describe, it, expect } from "vitest";
import { safeLocale, isValidEmail, cleanName, cleanPlatforms, sameOrigin } from "@/lib/validation";

function reqWith(headers: Record<string, string>) {
  return { headers: { get: (n: string) => headers[n.toLowerCase()] ?? null } };
}

describe("safeLocale", () => {
  it("aceita locales suportados", () => {
    expect(safeLocale("pt")).toBe("pt");
    expect(safeLocale("en")).toBe("en");
    expect(safeLocale("es")).toBe("es");
  });

  it("rejeita path traversal e cai no padrão", () => {
    expect(safeLocale("../../etc/passwd")).toBe("pt");
  });

  it("rejeita injeção e cai no padrão", () => {
    expect(safeLocale("<script>alert(1)</script>")).toBe("pt");
  });

  it("trata null/undefined/vazio como padrão", () => {
    expect(safeLocale(null)).toBe("pt");
    expect(safeLocale(undefined)).toBe("pt");
    expect(safeLocale("")).toBe("pt");
  });
});

describe("isValidEmail", () => {
  it("aceita emails válidos", () => {
    expect(isValidEmail("a@b.co")).toBe(true);
    expect(isValidEmail("user.name@exemplo.com.br")).toBe(true);
  });

  it("rejeita inválidos", () => {
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("a@b")).toBe(false);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail(123)).toBe(false);
    expect(isValidEmail("a@b.c" + "o".repeat(300))).toBe(false);
  });
});

describe("cleanName", () => {
  it("remove < > e limita tamanho", () => {
    expect(cleanName("  <script>Bob ")).toBe("scriptBob");
    expect(cleanName("x".repeat(200))?.length).toBe(80);
  });

  it("retorna null para vazio ou não-string", () => {
    expect(cleanName("   ")).toBe(null);
    expect(cleanName(42)).toBe(null);
  });
});

describe("cleanPlatforms", () => {
  it("mantém só válidas, sem duplicatas", () => {
    expect(cleanPlatforms(["pc", "pc", "hack", "xbox"])).toEqual(["pc", "xbox"]);
  });

  it("não-array vira lista vazia", () => {
    expect(cleanPlatforms("'; DROP TABLE subscribers;--")).toEqual([]);
    expect(cleanPlatforms(undefined)).toEqual([]);
  });
});

describe("sameOrigin", () => {
  it("aceita mesma origem", () => {
    expect(sameOrigin(reqWith({ origin: "https://site.com", host: "site.com" }))).toBe(true);
  });

  it("rejeita origem cross-site", () => {
    expect(sameOrigin(reqWith({ origin: "https://evil.com", host: "site.com" }))).toBe(false);
  });

  it("aceita quando origin ausente (same-origin pode omitir)", () => {
    expect(sameOrigin(reqWith({ host: "site.com" }))).toBe(true);
  });

  it("rejeita origin malformado", () => {
    expect(sameOrigin(reqWith({ origin: "not a url", host: "site.com" }))).toBe(false);
  });
});
