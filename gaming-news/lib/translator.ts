import { translate } from "@vitalets/google-translate-api";

// Cache em memória — evita retraduzir o mesmo texto enquanto o processo vive
const cache = new Map<string, string>();

const LANG_MAP: Record<string, string> = { pt: "pt", es: "es", en: "en" };

async function translateOne(text: string, to: string): Promise<string> {
  if (!text.trim() || to === "en") return text;

  const lang = LANG_MAP[to] ?? "pt";
  const key = `${lang}::${text.slice(0, 120)}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const result = await translate(text, { to: lang, from: "en" });
    cache.set(key, result.text);
    return result.text;
  } catch {
    // Retorna original se a tradução falhar (rate limit, timeout, etc.)
    return text;
  }
}

// Traduz vários textos em lotes para não disparar rate limit do Google Translate
export async function translateBatch(
  texts: string[],
  locale: string
): Promise<string[]> {
  if (locale === "en") return texts;

  const BATCH = 5;
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const translated = await Promise.all(slice.map((t) => translateOne(t, locale)));
    results.push(...translated);
    // Pequena pausa entre lotes para evitar bloqueio pelo Google
    if (i + BATCH < texts.length) await new Promise((r) => setTimeout(r, 120));
  }

  return results;
}

export async function translateText(text: string, locale: string): Promise<string> {
  return translateOne(text, locale);
}
