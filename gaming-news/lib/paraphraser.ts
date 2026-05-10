// Prefixos por idioma para variar a apresentação das notícias
const PREFIXES: Record<string, string[]> = {
  pt: ["Em destaque:", "Confirmado:", "Atenção:", "Novidade:", "Revelado:", "Imperdível:", "Exclusivo:", "Breaking:"],
  en: ["Breaking:", "Confirmed:", "Revealed:", "Featured:", "Update:", "Exclusive:", "Just in:", "Hot take:"],
  es: ["Destacado:", "Confirmado:", "Revelado:", "Novedad:", "Atención:", "Exclusivo:", "Última hora:", "En vivo:"],
};

// Hash determinístico para escolher o mesmo prefixo para o mesmo título
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function paraphraseTitle(title: string, locale = "pt"): string {
  const list = PREFIXES[locale] ?? PREFIXES.pt;
  const prefix = list[hashString(title) % list.length];
  return `${prefix} ${title}`;
}

export function paraphraseDescription(raw: string): string {
  // Remove tags HTML que alguns feeds incluem na descrição
  const clean = raw.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

  const MAX = 220;
  if (clean.length <= MAX) return clean;

  // Tenta cortar em ponto final para não deixar frase incompleta
  const cut = clean.slice(0, MAX);
  const lastStop = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
  if (lastStop > 80) return cut.slice(0, lastStop + 1);

  return cut.slice(0, cut.lastIndexOf(" ")) + "...";
}
