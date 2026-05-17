import type { NextRequest } from "next/server";

// Janela deslizante em memória. Suficiente para portfólio (single-instance).
const hits = new Map<string, number[]>();

/** true = permitido; false = excedeu o limite na janela. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

/** IP do cliente a partir dos headers de proxy. */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
