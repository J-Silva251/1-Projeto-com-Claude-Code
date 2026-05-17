import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const src = readFileSync(resolve(__dirname, "../lib/supabase.ts"), "utf-8");

describe("supabase — credenciais não expostas no cliente", () => {
  it("não usa o prefixo NEXT_PUBLIC", () => {
    expect(src).not.toContain("NEXT_PUBLIC_SUPABASE");
  });

  it("usa variáveis server-only", () => {
    expect(src).toContain("process.env.SUPABASE_URL");
    expect(src).toContain("process.env.SUPABASE_ANON_KEY");
  });

  it("modo demo preservado quando env vazio", async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
    const mod = await import("@/lib/supabase");
    expect(mod.isSupabaseConfigured).toBe(false);
    expect(mod.supabase).toBe(null);
  });
});
