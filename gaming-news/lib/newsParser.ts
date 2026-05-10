import Parser from "rss-parser";
import { paraphraseTitle, paraphraseDescription } from "./paraphraser";
import { translateBatch, translateText } from "./translator";
import type { NewsItem, ArticleDetail, Platform } from "@/types";

const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
      ["content:encoded", "contentEncoded"],
    ],
  },
  timeout: 10000,
});

const FEEDS: Record<Platform, { url: string; source: string }[]> = {
  pc: [
    { url: "https://www.pcgamer.com/rss/", source: "PC Gamer" },
    { url: "https://www.rockpapershotgun.com/feed", source: "Rock Paper Shotgun" },
  ],
  xbox: [
    { url: "https://www.purexbox.com/feeds/latest", source: "Pure Xbox" },
    { url: "https://news.xbox.com/en-us/feed/", source: "Xbox Wire" },
  ],
  playstation: [
    { url: "https://www.pushsquare.com/feeds/latest", source: "Push Square" },
    { url: "https://blog.playstation.com/feed/", source: "PlayStation Blog" },
  ],
  nintendo: [
    { url: "https://www.nintendolife.com/feeds/latest", source: "Nintendo Life" },
    { url: "https://mynintendonews.com/feed/", source: "My Nintendo News" },
  ],
  // Feeds de jogos mobile — múltiplos para garantir disponibilidade
  mobile: [
    { url: "https://www.pocketgamer.com/rss/", source: "Pocket Gamer" },
    { url: "https://www.pocketgamer.biz/feed/", source: "Pocket Gamer Biz" },
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
  return img ?? `https://picsum.photos/seed/${encodeURIComponent(title.slice(0, 20))}/800/450`;
}

function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/<img([^>]*?)(\s*\/?>)/gi, '<img$1 loading="lazy"$2')
    .replace(/<iframe([^>]*?)>/gi, '<div class="video-wrap"><iframe$1>')
    .replace(/<\/iframe>/gi, "</iframe></div>");
}

function htmlToText(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

// Traduz o texto do artigo preservando imagens e vídeos no lugar certo
async function buildTranslatedHtml(rawHtml: string, locale: string): Promise<string> {
  if (locale === "en") return rawHtml;

  // Divide o HTML em blocos: texto e mídia (imgs e iframes envoltos em .video-wrap)
  const mediaPattern = /(<img[^>]+>|<div class="video-wrap">[\s\S]*?<\/div>)/gi;
  const segments: { type: "text" | "media"; content: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mediaPattern.exec(rawHtml)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: rawHtml.slice(lastIndex, match.index) });
    }
    segments.push({ type: "media", content: match[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < rawHtml.length) {
    segments.push({ type: "text", content: rawHtml.slice(lastIndex) });
  }

  // Traduz os blocos de texto em paralelo (limite de 2000 chars por bloco)
  const translated = await Promise.all(
    segments.map(async (seg) => {
      if (seg.type === "media") return seg.content;
      const plain = htmlToText(seg.content);
      if (!plain.trim()) return seg.content;
      const translatedPlain = await translateText(plain.slice(0, 2000), locale);
      // Reconstrói HTML com parágrafos traduzidos
      return translatedPlain
        .split("\n\n")
        .filter(Boolean)
        .map((p) => `<p>${p.trim()}</p>`)
        .join("\n");
    })
  );

  return translated.join("\n");
}

function makeId(platform: Platform, url: string): string {
  return Buffer.from(`${platform}:${url}`).toString("base64url");
}

export async function fetchPlatformNews(platform: Platform, locale = "pt"): Promise<NewsItem[]> {
  const feeds = FEEDS[platform] ?? [];
  const raw: Array<{
    id: string; title: string; description: string;
    imageUrl: string; originalUrl: string;
    platform: Platform; source: string; publishedAt: string;
  }> = [];

  await Promise.allSettled(
    feeds.map(async ({ url, source }) => {
      try {
        const feed = await parser.parseURL(url);
        feed.items.slice(0, 8).forEach((item) => {
          raw.push({
            id: makeId(platform, item.link ?? url),
            title: item.title ?? "Sem título",
            description: item.contentSnippet ?? item.summary ?? "",
            imageUrl: extractImage(item as RssItem, item.title ?? ""),
            originalUrl: item.link ?? "#",
            platform,
            source,
            publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
          });
        });
      } catch { /* Feed indisponível */ }
    })
  );

  if (!raw.length) return [];

  const titles    = await translateBatch(raw.map((r) => r.title), locale);
  const shortDesc = await translateBatch(raw.map((r) => r.description.slice(0, 120)), locale);

  return raw
    .map((r, i) => ({
      ...r,
      title: paraphraseTitle(titles[i], locale),
      description: paraphraseDescription(shortDesc[i]),
    }))
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 16);
}

export async function fetchAllNews(locale = "pt"): Promise<NewsItem[]> {
  const platforms: Platform[] = ["pc", "xbox", "playstation", "nintendo", "mobile"];
  const all = await Promise.all(platforms.map((p) => fetchPlatformNews(p, locale)));
  return all.flat()
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 40);
}

export async function fetchArticleDetail(
  platform: Platform,
  originalUrl: string,
  locale = "pt"
): Promise<ArticleDetail | null> {
  const feeds = FEEDS[platform] ?? [];

  for (const { url, source } of feeds) {
    try {
      const feed = await parser.parseURL(url);
      const item = feed.items.find((i) => i.link === originalUrl);
      if (!item) continue;

      const title       = item.title ?? "Sem título";
      const rawEncoded  = (item as { contentEncoded?: string }).contentEncoded ?? item.content ?? "";
      const rawHtml     = rawEncoded ? sanitizeHtml(rawEncoded) : `<p>${item.contentSnippet ?? ""}</p>`;

      // Traduz título, descrição e corpo do artigo para o idioma escolhido
      const [translatedTitle, translatedDesc, translatedHtml] = await Promise.all([
        translateText(title, locale),
        translateText(item.contentSnippet ?? item.summary ?? "", locale),
        buildTranslatedHtml(rawHtml, locale),
      ]);

      return {
        id: makeId(platform, originalUrl),
        title: paraphraseTitle(translatedTitle, locale),
        description: paraphraseDescription(translatedDesc),
        rawHtml: translatedHtml, // HTML com texto traduzido + imagens/vídeos preservados
        imageUrl: extractImage(item as RssItem, title),
        originalUrl,
        platform,
        source,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      };
    } catch { /* Tenta próximo feed */ }
  }
  return null;
}

export function decodeArticleId(id: string): { platform: Platform; originalUrl: string } | null {
  try {
    const raw    = Buffer.from(id, "base64url").toString("utf-8");
    const colon  = raw.indexOf(":");
    if (colon === -1) return null;
    return { platform: raw.slice(0, colon) as Platform, originalUrl: raw.slice(colon + 1) };
  } catch { return null; }
}
