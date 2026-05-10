import Parser from "rss-parser";
import { paraphraseTitle, paraphraseDescription } from "./paraphraser";
import { translateBatch } from "./translator";
import type { NewsItem, Platform } from "@/types";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
    ],
  },
  timeout: 8000,
});

const FEEDS: Record<Platform, { url: string; source: string }[]> = {
  pc: [
    { url: "https://www.pcgamer.com/rss/", source: "PC Gamer" },
    { url: "https://www.rockpapershotgun.com/feed", source: "Rock Paper Shotgun" },
  ],
  xbox: [
    { url: "https://news.xbox.com/en-us/feed/", source: "Xbox Wire" },
    { url: "https://www.purexbox.com/feeds/latest", source: "Pure Xbox" },
  ],
  playstation: [
    { url: "https://blog.playstation.com/feed/", source: "PlayStation Blog" },
    { url: "https://www.pushsquare.com/feeds/latest", source: "Push Square" },
  ],
  nintendo: [
    { url: "https://www.nintendolife.com/feeds/latest", source: "Nintendo Life" },
    { url: "https://mynintendonews.com/feed/", source: "My Nintendo News" },
  ],
};

interface RssItem {
  mediaContent?: { $: { url: string } };
  mediaThumbnail?: { $: { url: string } };
  enclosure?: { url: string };
  contentEncoded?: string;
}

function extractImage(item: RssItem, title: string): string {
  const fromEncoded = item.contentEncoded
    ?.match(/<img[^>]+src=["']([^"']+)["']/)?.[1];
  const img =
    item.mediaContent?.$.url ||
    item.mediaThumbnail?.$.url ||
    item.enclosure?.url ||
    fromEncoded;

  if (img) return img;
  return `https://picsum.photos/seed/${encodeURIComponent(title.slice(0, 20))}/800/450`;
}

// Gera um ID único e estável a partir da plataforma + URL original
function makeId(platform: Platform, url: string): string {
  const raw = `${platform}:${url}`;
  return Buffer.from(raw).toString("base64url");
}

// Extrai o texto limpo do conteúdo completo do RSS (remove HTML)
function extractFullContent(item: { contentEncoded?: string; content?: string; contentSnippet?: string }): string {
  const raw = item.contentEncoded ?? item.content ?? "";
  // Remove tags HTML mas mantém quebras de parágrafo como \n\n
  return raw
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

export async function fetchPlatformNews(platform: Platform, locale = "pt"): Promise<NewsItem[]> {
  const feeds = FEEDS[platform];
  const raw: Array<{
    id: string; title: string; description: string;
    fullContent: string; imageUrl: string; originalUrl: string;
    platform: Platform; source: string; publishedAt: string;
  }> = [];

  // Busca todos os feeds da plataforma em paralelo
  await Promise.allSettled(
    feeds.map(async ({ url, source }) => {
      try {
        const feed = await parser.parseURL(url);
        feed.items.slice(0, 12).forEach((item) => {
          const title = item.title ?? "Sem título";
          const description = item.contentSnippet ?? item.summary ?? "";
          const fullContent = extractFullContent(item as { contentEncoded?: string; content?: string; contentSnippet?: string });
          raw.push({
            id: makeId(platform, item.link ?? url),
            title,
            description,
            fullContent,
            imageUrl: extractImage(item as RssItem, title),
            originalUrl: item.link ?? "#",
            platform,
            source,
            publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          });
        });
      } catch {
        // Feed indisponível — segue com os outros
      }
    })
  );

  if (!raw.length) return [];

  // Traduz títulos e descrições em lote para o idioma escolhido
  const titles = await translateBatch(raw.map((r) => r.title), locale);
  const descs  = await translateBatch(raw.map((r) => r.description), locale);

  const items: NewsItem[] = raw.map((r, i) => ({
    ...r,
    // Adiciona prefixo de variação após a tradução
    title: paraphraseTitle(titles[i], locale),
    description: paraphraseDescription(descs[i]),
  }));

  return items
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 20);
}

export async function fetchAllNews(locale = "pt"): Promise<NewsItem[]> {
  const platforms: Platform[] = ["pc", "xbox", "playstation", "nintendo"];
  const all = await Promise.all(platforms.map((p) => fetchPlatformNews(p, locale)));
  return all
    .flat()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 60);
}

// Decodifica um ID de artigo e retorna plataforma + URL original
export function decodeArticleId(id: string): { platform: Platform; originalUrl: string } | null {
  try {
    const raw = Buffer.from(id, "base64url").toString("utf-8");
    const colonIdx = raw.indexOf(":");
    if (colonIdx === -1) return null;
    const platform = raw.slice(0, colonIdx) as Platform;
    const originalUrl = raw.slice(colonIdx + 1);
    return { platform, originalUrl };
  } catch {
    return null;
  }
}
