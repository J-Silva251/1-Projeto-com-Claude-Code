import { describe, it, expect } from "vitest";
import { sanitizeFinalHtml } from "@/lib/newsParser";

describe("sanitizeFinalHtml — bloqueio de XSS", () => {
  it("remove <script>", () => {
    const out = sanitizeFinalHtml('<p>oi</p><script>alert(document.cookie)</script>');
    expect(out).not.toContain("<script");
    expect(out).toContain("<p>oi</p>");
  });

  it("remove handler onerror de <img>", () => {
    const out = sanitizeFinalHtml('<img src="https://x.com/a.jpg" onerror="alert(1)">');
    expect(out).not.toMatch(/onerror/i);
  });

  it("remove href com javascript:", () => {
    const out = sanitizeFinalHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toMatch(/javascript:/i);
  });

  it("neutraliza <svg onload=...>", () => {
    const out = sanitizeFinalHtml('<svg/onload=alert(document.cookie)>');
    expect(out).not.toMatch(/onload/i);
    expect(out).not.toContain("<script");
  });

  it("remove iframe de host não permitido", () => {
    const out = sanitizeFinalHtml('<iframe src="https://evil.com/x"></iframe>');
    expect(out).not.toContain("evil.com");
    expect(out).not.toContain("<iframe");
  });

  it("preserva conteúdo legítimo", () => {
    const html =
      '<p>texto</p><img src="https://cdn.com/a.jpg" alt="a">' +
      '<div class="video-wrap"><iframe src="https://www.youtube.com/embed/abc"></iframe></div>';
    const out = sanitizeFinalHtml(html);
    expect(out).toContain("<p>texto</p>");
    expect(out).toContain("https://cdn.com/a.jpg");
    expect(out).toContain("youtube.com/embed/abc");
    expect(out).toContain("video-wrap");
  });

  it("string vazia retorna vazio", () => {
    expect(sanitizeFinalHtml("")).toBe("");
  });
});
