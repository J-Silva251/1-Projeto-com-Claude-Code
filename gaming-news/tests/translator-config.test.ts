import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = readFileSync(resolve(__dirname, "../lib/translator.ts"), "utf-8");

describe("translator — sem segredo hardcoded", () => {
  it("não contém o email pessoal no código-fonte", () => {
    expect(src).not.toContain("astarkedu251@gmail.com");
  });

  it("lê o email da variável de ambiente", () => {
    expect(src).toContain("process.env.MYMEMORY_EMAIL");
  });

  it("traduz sem lançar quando a env está ausente", async () => {
    delete process.env.MYMEMORY_EMAIL;
    const { translateText } = await import("@/lib/translator");
    await expect(translateText("hello", "en")).resolves.toBe("hello");
  });
});
