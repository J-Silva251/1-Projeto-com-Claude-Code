// Cache em memória — evita retraduzir o mesmo texto enquanto o processo vive
const cache = new Map<string, string>();

// Email registrado aumenta o limite do MyMemory de 5k para 10k chars/dia
const MYMEMORY_EMAIL = "astarkedu251@gmail.com";

async function translateOne(text: string, to: string): Promise<string> {
  if (!text.trim() || to === "en") return text;

  const key = `${to}::${text.slice(0, 120)}`;
  if (cache.has(key)) return cache.get(key)!;

  try {
    const url =
      `https://api.mymemory.translated.net/get` +
      `?q=${encodeURIComponent(text.slice(0, 500))}` +
      `&langpair=en|${to}` +
      `&de=${encodeURIComponent(MYMEMORY_EMAIL)}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "GamingNewsApp/1.0" },
    });

    if (!res.ok) return text;

    const data = await res.json();

    // Ignora aviso de limite esgotado — retorna original
    const translated: string = data?.responseData?.translatedText ?? "";
    if (
      data?.responseStatus === 200 &&
      translated &&
      !translated.startsWith("MYMEMORY WARNING")
    ) {
      cache.set(key, translated);
      return translated;
    }

    return text;
  } catch {
    return text;
  }
}

// Traduz vários textos em lotes para não exceder rate limit
export async function translateBatch(
  texts: string[],
  locale: string
): Promise<string[]> {
  if (locale === "en") return texts;

  const BATCH = 4;
  const results: string[] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const slice = texts.slice(i, i + BATCH);
    const translated = await Promise.all(
      slice.map((t) => translateOne(t, locale))
    );
    results.push(...translated);
    if (i + BATCH < texts.length) await new Promise((r) => setTimeout(r, 150));
  }

  return results;
}

export async function translateText(text: string, locale: string): Promise<string> {
  return translateOne(text, locale);
}
