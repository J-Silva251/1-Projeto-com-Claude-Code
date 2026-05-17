import { routing } from "@/i18n/routing";

/** Garante que o locale seja um dos suportados; senão usa o padrão. */
export function safeLocale(input: string | null | undefined): string {
  const locales = routing.locales as readonly string[];
  return input && locales.includes(input) ? input : routing.defaultLocale;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Valida formato e tamanho de email. */
export function isValidEmail(input: unknown): input is string {
  return typeof input === "string" && input.length <= 254 && EMAIL_RE.test(input);
}

/** Normaliza o nome: remove < >, espaços extras, limita a 80 chars. */
export function cleanName(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const v = input.replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
  return v.length ? v : null;
}

/**
 * Defesa CSRF pragmática: o Origin (quando presente) deve bater com o Host.
 * Sem auth/cookies de sessão, isso barra POST cross-site sem máquina de tokens.
 * Origin ausente é aceito (fetch same-origin pode omiti-lo).
 */
export function sameOrigin(req: { headers: { get(name: string): string | null } }): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

const VALID_PLATFORMS = ["pc", "xbox", "nintendo", "playstation", "mobile"];

/** Mantém só plataformas conhecidas, sem duplicatas, no máximo 5. */
export function cleanPlatforms(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return Array.from(new Set(input))
    .filter((p): p is string => typeof p === "string" && VALID_PLATFORMS.includes(p))
    .slice(0, 5);
}
