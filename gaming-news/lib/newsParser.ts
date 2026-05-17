import Parser from "rss-parser";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import DOMPurify from "isomorphic-dompurify";
import { paraphraseTitle, paraphraseDescription } from "./paraphraser";
import { translateBatch, translateText } from "./translator";
import type { NewsItem, ArticleDetail, Platform } from "@/types";

// Hosts de vídeo permitidos em <iframe> — qualquer outro iframe é descartado
export const VIDEO_HOSTS = [
  "youtube.com", "youtube-nocookie.com", "youtu.be", "vimeo.com",
  "twitch.tv", "player.twitch.tv", "dailymotion.com", "players.brightcove.net",
];

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

// Frases que indicam blocos de "leia a seguir" / "veja também"
const READ_NEXT_PHRASES = [
  "read next", "read more", "see also", "related:", "more from",
  "leia também", "leia a seguir", "veja também", "mais sobre",
  "lea también", "también te puede", "sigue leyendo",
  "don't miss", "check out", "trending now", "most popular",
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
    // Imagens com lazy-load: converte data-src/data-lazy-src → src
    .replace(/<img([^>]*?)\s+data-(?:lazy-)?src=["']([^"']+)["']([^>]*?)(\s*\/?>)/gi,
      (_, before, lazySrc, after, close) => `<img${before} src="${lazySrc}"${after} loading="lazy"${close}`)
    .replace(/<img([^>]*?)(\s*\/?>)/gi, '<img$1 loading="lazy"$2')
    // Iframes com data-src (YouTube lazy) → src real
    .replace(/<iframe([^>]*?)\s+data-src=["']([^"']+)["']([^>]*?)>/gi,
      (_, before, dataSrc, after) => `<div class="video-wrap"><iframe${before} src="${dataSrc}"${after} loading="lazy">`)
    // Iframes normais com src
    .replace(/<iframe([^>]*?src=["'][^"']+["'][^>]*?)>/gi,
      '<div class="video-wrap"><iframe$1 loading="lazy">')
    .replace(/<\/iframe>/gi, "</iframe></div>")
    // Vídeos nativos
    .replace(/<video([^>]*?)>/gi, '<video$1 controls style="max-width:100%;border-radius:10px;margin:1.5rem 0">');
}

/**
 * Sanitização final (defesa principal contra XSS) aplicada ao HTML já traduzido
 * imediatamente antes de ir para o cliente. Usa DOMPurify com allowlist estrita
 * e depois remove qualquer <iframe> cujo host não seja de vídeo conhecido.
 */
export function sanitizeFinalHtml(html: string): string {
  if (!html) return "";

  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "blockquote",
      "figure", "figcaption", "img", "video", "source", "iframe",
      "strong", "em", "a", "br", "div",
    ],
    ALLOWED_ATTR: [
      "src", "alt", "href", "class", "controls", "loading",
      "allowfullscreen", "allow", "width", "height", "style", "target", "rel",
    ],
    ALLOWED_URI_REGEXP: /^(?:https?:|data:image\/)/i,
    ADD_ATTR: ["allowfullscreen"],
  });

  // Remove iframes que não sejam de hosts de vídeo permitidos
  return clean.replace(/<iframe\b[^>]*>/gi, (tag) => {
    const src = tag.match(/\ssrc=["']([^"']+)["']/i)?.[1] ?? "";
    return VIDEO_HOSTS.some((h) => src.includes(h)) ? tag : "";
  });
}

/** Converte qualquer URL relativa ou protocol-relative em absoluta */
function toAbsolute(href: string, base: string): string {
  if (!href) return href;
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("//")) return "https:" + href;
  try { return new URL(href, base).href; } catch { return href; }
}

interface ScrapeResult {
  html: string | null;
  author: string | null;
}

/** Busca o conteúdo completo via Readability (Firefox Reader Mode) + fallback Cheerio */
async function scrapeFullContent(url: string): Promise<ScrapeResult> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return { html: null, author: null };
    const rawHtmlStr = await res.text();

    // Pré-processa o HTML bruto para resolver lazy-load ANTES do Readability
    // (Readability não executa JS, então data-src precisa virar src antes dele rodar)
    // Remove src existente e usa data-src como src para evitar atributos duplicados
    const preProcessed = rawHtmlStr
      // iframes: remove src="" original e usa data-src como src
      .replace(/<iframe([^>]*?)\s+data-src=(["'])([^"']+)\2([^>]*?)>/gi,
        (_, before, q, dataSrc, after) => {
          const cleanBefore = before.replace(/\s+src=(["'])[^"']*\1/gi, "");
          const cleanAfter = after.replace(/\s+src=(["'])[^"']*\1/gi, "");
          return `<iframe${cleanBefore} src="${dataSrc}"${cleanAfter}>`;
        })
      // imagens: usa data-src/data-lazy-src como src
      .replace(/<img([^>]*?)\s+data-(?:lazy-)?src=(["'])([^"']+)\2([^>]*?)>/gi,
        (_, before, q, lazySrc, after) => {
          const cleanBefore = before.replace(/\s+src=(["'])[^"']*\1/gi, "");
          const cleanAfter = after.replace(/\s+src=(["'])[^"']*\1/gi, "");
          return `<img${cleanBefore} src="${lazySrc}"${cleanAfter}>`;
        })
      .replace(/<img([^>]*?)\s+data-original=(["'])([^"']+)\2([^>]*?)>/gi,
        (_, before, q, orig, after) => {
          const cleanBefore = before.replace(/\s+src=(["'])[^"']*\1/gi, "");
          const cleanAfter = after.replace(/\s+src=(["'])[^"']*\1/gi, "");
          return `<img${cleanBefore} src="${orig}"${cleanAfter}>`;
        });

    // Extrai vídeos do HTML bruto ANTES do Readability (Readability remove iframes)
    const VIDEO_SRC_RE = /(?:src|data-src)=(["'])(https?:\/\/[^"']*(?:youtube\.com|youtube-nocookie\.com|youtu\.be|vimeo\.com|twitch\.tv|players\.brightcove\.net|dailymotion\.com)[^"']*)\1/i;
    const embeddedVideos: string[] = [];
    const iframeTagRe = /<iframe[^>]+>/gi;
    let iframeTagMatch;
    while ((iframeTagMatch = iframeTagRe.exec(rawHtmlStr)) !== null) {
      const srcMatch = VIDEO_SRC_RE.exec(iframeTagMatch[0]);
      if (srcMatch) {
        // Remove autoplay e usa src limpo
        const src = srcMatch[2].replace(/[?&]autoplay=1/gi, (m) => m.startsWith("?") ? "?" : "");
        embeddedVideos.push(
          `<div class="video-wrap"><iframe src="${src}" loading="lazy" allowfullscreen ` +
          `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`
        );
      }
    }

    // Readability (mesmo motor do Firefox Reader Mode)
    const dom = new JSDOM(preProcessed, { url });
    const reader = new Readability(dom.window.document, { keepClasses: false });
    const parsed = reader.parse();

    if (!parsed?.content) return { html: null, author: null };

    // Processa o HTML limpo do Readability com Cheerio
    const $ = cheerio.load(parsed.content);

    // Reconstrói HTML limpo — só texto, imagens e vídeos na ordem original
    let cleanHtml = buildCleanArticle($, $.root(), url);

    // Injeta vídeos que o Readability descartou — após o primeiro parágrafo
    if (cleanHtml && embeddedVideos.length > 0) {
      const videosHtml = embeddedVideos.join("\n");
      const firstClose = cleanHtml.indexOf("</p>");
      if (firstClose !== -1) {
        cleanHtml = cleanHtml.slice(0, firstClose + 4) + "\n" + videosHtml + cleanHtml.slice(firstClose + 4);
      } else {
        cleanHtml = videosHtml + "\n" + cleanHtml;
      }
    }

    return {
      html: cleanHtml,
      author: parsed.byline?.replace(/^by\s+/i, "").trim() ?? null,
    };
  } catch {
    return { html: null, author: null };
  }
}

/**
 * Reconstrói o artigo do zero com HTML limpo.
 * Abordagem whitelist: só extrai p, h2-h6, ul, ol, blockquote, figure, img e vídeos.
 * Remove qualquer div, section, aside, widget, enquete ou lixo estrutural.
 */
function buildCleanArticle(
  $: ReturnType<typeof cheerio.load>,
  contentEl: ReturnType<ReturnType<typeof cheerio.load>>,
  baseUrl: string
): string | null {
  const parts: string[] = [];
  // Primeira imagem é sempre o hero (já exibido acima do corpo), então pulamos
  let firstImageSkipped = false;

  contentEl.find("p, h2, h3, h4, h5, h6, ul, ol, blockquote, figure, img, video, iframe").each((_, el) => {
    const $el = $(el);
    const tag = (el as { tagName: string }).tagName.toLowerCase();

    // Não reprocessa elementos já capturados pelo seu container
    if (["p", "h2", "h3", "h4", "h5", "h6"].includes(tag) && $el.closest("blockquote, li, figure").length > 0) return;
    if (tag === "img" && $el.closest("figure").length > 0) return;
    if (tag === "iframe" && $el.closest("figure").length > 0) return;

    if (tag === "iframe") {
      const src = toAbsolute($el.attr("src") ?? $el.attr("data-src") ?? "", baseUrl);
      if (VIDEO_HOSTS.some((h) => src.includes(h))) {
        parts.push(
          `<div class="video-wrap"><iframe src="${src}" loading="lazy" allowfullscreen ` +
          `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>`
        );
      }
      return;
    }

    if (tag === "video") {
      const src = toAbsolute(
        $el.find("source").first().attr("src") ?? $el.attr("src") ?? "", baseUrl
      );
      if (src) parts.push(`<video src="${src}" controls style="max-width:100%;border-radius:10px;margin:1.5rem 0"></video>`);
      return;
    }

    if (tag === "img") {
      const src = toAbsolute($el.attr("src") ?? "", baseUrl);
      const alt = $el.attr("alt") ?? "";
      const w = parseInt($el.attr("width") ?? "100", 10);
      const h = parseInt($el.attr("height") ?? "100", 10);
      if (!src || w <= 10 || h <= 10) return;
      // Pula a primeira imagem — é o hero já exibido acima do corpo
      if (!firstImageSkipped) { firstImageSkipped = true; return; }
      parts.push(`<img src="${src}" alt="${alt}" loading="lazy">`);
      return;
    }

    if (tag === "figure") {
      const caption = $el.find("figcaption").first().text().trim();

      // Verifica se tem iframe de vídeo dentro da figure
      const iframeEl = $el.find("iframe").first();
      if (iframeEl.length) {
        const iframeSrc = toAbsolute(iframeEl.attr("src") ?? iframeEl.attr("data-src") ?? "", baseUrl);
        if (iframeSrc && VIDEO_HOSTS.some((h) => iframeSrc.includes(h))) {
          parts.push(
            `<div class="video-wrap"><iframe src="${iframeSrc}" loading="lazy" allowfullscreen ` +
            `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe></div>` +
            (caption ? `<p class="video-caption">${caption}</p>` : "")
          );
        }
        return;
      }

      // Imagem normal na figure
      const img = $el.find("img").first();
      const src = toAbsolute(
        img.attr("src") ?? img.attr("data-src") ?? img.attr("data-lazy-src") ?? "", baseUrl
      );
      const alt = img.attr("alt") ?? "";
      if (!src) return;
      // Pula a primeira figura — é o hero já exibido acima do corpo
      if (!firstImageSkipped) { firstImageSkipped = true; return; }
      parts.push(
        `<figure><img src="${src}" alt="${alt}" loading="lazy">${caption ? `<figcaption>${caption}</figcaption>` : ""}</figure>`
      );
      return;
    }

    const text = $el.text().trim();
    if (!text || text.length < 2) return;

    // Filtra frases de "leia a seguir" etc
    const lower = text.toLowerCase();
    if (text.length < 150 && READ_NEXT_PHRASES.some((p) => lower.includes(p))) return;

    if (tag === "blockquote") {
      parts.push(`<blockquote><p>${text}</p></blockquote>`);
    } else if (tag === "ul" || tag === "ol") {
      const items = $el.find("li").map((_, li) => `<li>${$(li).text().trim()}</li>`).get().filter(Boolean);
      if (items.length) parts.push(`<${tag}>${items.join("")}</${tag}>`);
    } else {
      // p, h2, h3, h4, h5, h6
      parts.push(`<${tag}>${text}</${tag}>`);
    }
  });

  return parts.length ? parts.join("\n") : null;
}

/** Quebra texto em chunks de até 490 chars preservando frases */
function chunkText(text: string): string[] {
  if (text.length <= 490) return [text];
  const result: string[] = [];
  let buf = "";
  for (const part of text.split(/(?<=[.!?])\s+/)) {
    if (buf && (buf + " " + part).length > 490) {
      result.push(buf.trim());
      buf = part;
    } else {
      buf = buf ? `${buf} ${part}` : part;
    }
  }
  if (buf.trim()) result.push(buf.trim());
  return result.length ? result : [text.slice(0, 490)];
}

/** Traduz texto longo dividindo em chunks para respeitar o limite da API */
async function translateLong(text: string, locale: string): Promise<string> {
  const chunks = chunkText(text);
  if (chunks.length === 1) return translateText(chunks[0], locale);
  const parts = await translateBatch(chunks, locale);
  return parts.join(" ");
}

/** Traduz o HTML preservando a estrutura de blocos (h2, h3, p, li, etc.) */
async function buildTranslatedHtml(rawHtml: string, locale: string): Promise<string> {
  if (locale === "en") return rawHtml;

  const $ = cheerio.load(`<div id="__t">${rawHtml}</div>`);
  const root = $("#__t");

  const BLOCKS = "p, h2, h3, h4, h5, h6, li, blockquote, figcaption, td";
  type QueueEntry = { $el: ReturnType<typeof $>; text: string };
  const queue: QueueEntry[] = [];

  root.find(BLOCKS).each((_, el) => {
    const $el = $(el);
    // Ignora li com listas aninhadas para não destruir estrutura
    if ((el as { tagName?: string }).tagName === "li" && $el.find("ul, ol").length > 0) return;
    // Texto sem elementos de mídia
    const text = $el.clone().find("img,video,iframe,picture").remove().end().text().trim();
    if (text.length > 3) queue.push({ $el, text });
  });

  if (!queue.length) return rawHtml;

  const BATCH = 3;
  for (let i = 0; i < queue.length; i += BATCH) {
    const slice = queue.slice(i, i + BATCH);
    const results = await Promise.all(slice.map(({ text }) => translateLong(text, locale)));

    slice.forEach(({ $el }, j) => {
      // Salva mídia filha para restaurar depois
      const savedMedia: string[] = [];
      $el.find("img,video,iframe,picture,source").each((_, m) => {
        savedMedia.push($.html($(m)));
      });
      // Substitui o texto (preserva a tag de bloco mas perde formatação inline)
      $el.text(results[j]);
      // Restaura mídia
      if (savedMedia.length) $el.append(savedMedia.join(""));
    });

    if (i + BATCH < queue.length) await new Promise((r) => setTimeout(r, 200));
  }

  return root.html() ?? rawHtml;
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

      // Conteúdo completo: scraping da página > RSS contentEncoded > snippet
      const scraped = await scrapeFullContent(originalUrl);
      const baseHtml =
        scraped.html ||
        (rssEncoded ? rssEncoded : `<p>${item.contentSnippet ?? ""}</p>`);

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
        rawHtml: sanitizeFinalHtml(translatedHtml),
        imageUrl: extractImage(item as RssItem, title),
        originalUrl,
        platform,
        source,
        author: scraped.author ?? undefined,
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
