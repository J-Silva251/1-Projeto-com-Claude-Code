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
  timeout: 8000,
});

// Um feed por plataforma — 2x mais rápido que dois feeds
const FEEDS: Record<Platform, { url: string; source: string }[]> = {
  pc: [
    { url: "https://www.pcgamer.com/rss/", source: "PC Gamer" },
  ],
  xbox: [
    { url: "https://www.purexbox.com/feeds/latest", source: "Pure Xbox" },
  ],
  playstation: [
    { url: "https://www.pushsquare.com/feeds/latest", source: "Push Square" },
  ],
  nintendo: [
    { url: "https://www.nintendolife.com/feeds/latest", source: "Nintendo Life" },
  ],
  mobile: [
    { url: "https://toucharcade.com/feed/", source: "Touch Arcade" },
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

// Sanitiza HTML do conteúdo do artigo — remove scripts e estilos, mantém imagens e vídeos
function sanitizeHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    // Garante que imagens tenham loading lazy
    .replace(/<img([^>]*?)>/gi, "<img$1 loading=\"lazy\">")
    // Envolve iframes (YouTube, etc.) em container responsivo
    .replace(/<iframe([^>]*?)>/gi, '<div class="video-wrap"><iframe$1>')
    .replace(/<\/iframe>/gi, "</iframe></div>");
}

// Extrai texto puro para tradução (sem tags HTML)
function htmlToText(html: string): string {
  return html
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/\s{3,}/g, "\n\n")
    .trim();
}

function makeId(platform: Platform, url: string): string {
  return Buffer.from(`${platform}:${url}`).toString("base64url");
}

export async function fetchPlatformNews(platform: Platform, locale = "pt"): Promise<NewsItem[]> {
  const feeds = FEEDS[platform] ?? [];
  const raw: Array<{ id: string; title: string; description: string; imageUrl: string; originalUrl: string; platform: Platform; source: string; publishedAt: string }> = [];

  await Promise.allSettled(
    feeds.map(async ({ url, source }) => {
      try {
        const feed = await parser.parseURL(url);
        // Reduzido para 8 itens por feed — mais rápido e suficiente para o grid
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
      } catch { /* Feed indisponível — segue com os outros */ }
    })
  );

  if (!raw.length) return [];

  // Traduz somente títulos no grid — muito mais rápido que traduzir tudo
  const titles = await translateBatch(raw.map((r) => r.title), locale);
  // Descrição: traduz apenas os primeiros 120 chars para não atrasar
  const shortDescs = await translateBatch(raw.map((r) => r.description.slice(0, 120)), locale);

  return raw
    .map((r, i) => ({
      ...r,
      title: paraphraseTitle(titles[i], locale),
      description: paraphraseDescription(shortDescs[i]),
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

// Busca o artigo completo com HTML sanitizado para a página de detalhe
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

      const title = item.title ?? "Sem título";
      const rawEncoded = (item as { contentEncoded?: string }).contentEncoded ?? item.content ?? "";
      const rawHtml = rawEncoded ? sanitizeHtml(rawEncoded) : `<p>${item.contentSnippet ?? ""}</p>`;
      const plainText = htmlToText(rawHtml);

      // Traduz título para o idioma escolhido
      // O corpo em rawHtml mantém imagens e vídeos do original
      const translatedTitle = await translateText(title, locale);
      // Suprimir uso de plainText — usado apenas para referência futura
      void plainText;

      return {
        id: makeId(platform, originalUrl),
        title: paraphraseTitle(translatedTitle, locale),
        description: paraphraseDescription(
          await translateText(item.contentSnippet ?? item.summary ?? "", locale)
        ),
        rawHtml,                        // HTML original (imagens e vídeos intactos)
        imageUrl: extractImage(item as RssItem, title),
        originalUrl,
        platform,
        source,
        publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
      };
    } catch { /* Tenta o próximo feed */ }
  }
  return null;
}

export function decodeArticleId(id: string): { platform: Platform; originalUrl: string } | null {
  try {
    const raw = Buffer.from(id, "base64url").toString("utf-8");
    const colonIdx = raw.indexOf(":");
    if (colonIdx === -1) return null;
    return { platform: raw.slice(0, colonIdx) as Platform, originalUrl: raw.slice(colonIdx + 1) };
  } catch { return null; }
}
