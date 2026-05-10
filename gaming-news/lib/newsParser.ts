import Parser from "rss-parser";
import * as cheerio from "cheerio";
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
  mobile: [
    { url: "https://www.pocketgamer.com/rss/", source: "Pocket Gamer" },
    { url: "https://www.pocketgamer.biz/feed/", source: "Pocket Gamer Biz" },
  ],
};

// Seletores de conteúdo principal por domínio (do mais específico ao mais genérico)
const SITE_SELECTORS: Record<string, string[]> = {
  "pocketgamer.com":     [".article-body", ".article__body", ".article-content", ".post-content"],
  "pocketgamer.biz":     [".article-body", ".article__body", ".post-content"],
  "pcgamer.com":         ["#article-body", ".article-body", ".article__body"],
  "rockpapershotgun.com":[".article-content", ".entry-content", "article .content"],
  "purexbox.com":        [".article-body", ".article__body"],
  "pushsquare.com":      [".article-body", ".article__body"],
  "nintendolife.com":    [".article-body", ".article__body"],
  "mynintendonews.com":  [".entry-content", ".post-content"],
  "news.xbox.com":       [".c-article-body", ".article__body", ".content-body"],
  "blog.playstation.com":[".entry-content", ".article__body"],
};

// Seletores genéricos usados como fallback
const GENERIC_SELECTORS = [
  "[itemprop='articleBody']",
  "article .body",
  "article .content",
  ".article-body",
  ".post-body",
  ".entry-content",
  ".post-content",
  "article",
  "main",
];

// Elementos a remover antes de extrair o conteúdo
const JUNK_SELECTORS = [
  "script", "style", "noscript",
  "nav", "header", "footer",
  ".ad", ".ads", ".advertisement", ".advert",
  ".sidebar", ".widget",
  ".related", ".related-articles",
  ".newsletter", ".subscribe",
  ".social-share", ".share-buttons",
  ".cookie-notice", ".cookie-banner",
  "[class*='cookie']", "[class*='popup']", "[class*='modal']",
  "[id*='cookie']", "[id*='popup']", "[id*='banner']",
  "iframe[src*='doubleclick']", "iframe[src*='googlesyndication']",
];

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
    .replace(/<iframe([^>]*?)>/gi, '<div class="video-wrap"><iframe$1 loading="lazy">')
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

// Busca o conteúdo completo da página original via scraping
async function scrapeFullContent(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return null;
    const html = await res.text();
    const $ = cheerio.load(html);

    // Remove lixo
    JUNK_SELECTORS.forEach((sel) => {
      try { $(sel).remove(); } catch { /* ignora seletor inválido */ }
    });

    // Determina seletores prioritários pelo domínio
    const domain = new URL(url).hostname.replace("www.", "");
    const prioritySelectors =
      SITE_SELECTORS[domain] ??
      Object.entries(SITE_SELECTORS).find(([k]) => domain.includes(k))?.[1] ??
      [];

    const allSelectors = [...prioritySelectors, ...GENERIC_SELECTORS];

    for (const sel of allSelectors) {
      const el = $(sel).first();
      const text = el.text().trim();
      if (el.length && text.length > 300) {
        // Converte links relativos em absolutos
        const base = new URL(url).origin;
        el.find("img[src]").each((_, img) => {
          const src = $(img).attr("src") ?? "";
          if (src.startsWith("/")) $(img).attr("src", base + src);
        });
        el.find("a[href]").each((_, a) => {
          const href = $(a).attr("href") ?? "";
          if (href.startsWith("/")) $(a).attr("href", base + href);
        });
        return el.html() ?? null;
      }
    }

    return null;
  } catch {
    return null;
  }
}

// Traduz o texto do artigo preservando imagens e vídeos no lugar certo
async function buildTranslatedHtml(rawHtml: string, locale: string): Promise<string> {
  if (locale === "en") return rawHtml;

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

  // Traduz blocos de texto preservando estrutura HTML básica
  const translated = await Promise.all(
    segments.map(async (seg) => {
      if (seg.type === "media") return seg.content;
      const plain = htmlToText(seg.content);
      if (!plain.trim()) return seg.content;
      const translatedPlain = await translateText(plain.slice(0, 500), locale);
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

      const title      = item.title ?? "Sem título";
      const rssEncoded = (item as { contentEncoded?: string }).contentEncoded ?? item.content ?? "";

      // Tenta scraping da página completa para conteúdo integral
      const scrapedHtml = await scrapeFullContent(originalUrl);

      // Usa conteúdo scraped > RSS encoded > snippet
      const baseHtml = scrapedHtml
        ? scrapedHtml
        : rssEncoded
        ? rssEncoded
        : `<p>${item.contentSnippet ?? ""}</p>`;

      const rawHtml = sanitizeHtml(baseHtml);

      const [translatedTitle, translatedDesc, translatedHtml] = await Promise.all([
        translateText(title, locale),
        translateText(item.contentSnippet ?? item.summary ?? "", locale),
        buildTranslatedHtml(rawHtml, locale),
      ]);

      return {
        id: makeId(platform, originalUrl),
        title: paraphraseTitle(translatedTitle, locale),
        description: paraphraseDescription(translatedDesc),
        rawHtml: translatedHtml,
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
    const raw   = Buffer.from(id, "base64url").toString("utf-8");
    const colon = raw.indexOf(":");
    if (colon === -1) return null;
    return { platform: raw.slice(0, colon) as Platform, originalUrl: raw.slice(colon + 1) };
  } catch { return null; }
}
