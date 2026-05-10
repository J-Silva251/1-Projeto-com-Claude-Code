import Parser from "rss-parser";
import { paraphraseTitle, paraphraseDescription } from "./paraphraser";
import type { NewsItem, Platform } from "@/types";

// Parser configurado para extrair campos de mídia extras
const parser = new Parser({
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["enclosure", "enclosure"],
    ],
  },
  timeout: 8000,
});

// Feeds RSS por plataforma — todos gratuitos e públicos
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
  "content:encoded"?: string;
}

// Tenta extrair imagem de vários campos possíveis do item RSS
function extractImage(item: RssItem, title: string): string {
  const encodedImg = item["content:encoded"]
    ?.match(/<img[^>]+src=["']([^"']+)["']/)?.[1];
  const img =
    item.mediaContent?.$.url ||
    item.mediaThumbnail?.$.url ||
    item.enclosure?.url ||
    encodedImg;

  // Fallback: imagem baseada no título para consistência visual
  if (img) return img;
  return `https://picsum.photos/seed/${encodeURIComponent(title.slice(0, 20))}/800/450`;
}

export async function fetchPlatformNews(platform: Platform, locale = "pt"): Promise<NewsItem[]> {
  const feeds = FEEDS[platform];
  const results: NewsItem[] = [];

  await Promise.allSettled(
    feeds.map(async ({ url, source }) => {
      try {
        const feed = await parser.parseURL(url);
        const items = feed.items.slice(0, 12).map((item, i): NewsItem => ({
          id: `${platform}-${source}-${i}-${item.isoDate ?? Date.now()}`,
          title: paraphraseTitle(item.title ?? "Sem título", locale),
          description: paraphraseDescription(
            item.contentSnippet ?? item.content ?? item.summary ?? ""
          ),
          imageUrl: extractImage(item, item.title ?? ""),
          originalUrl: item.link ?? "#",
          platform,
          source,
          publishedAt: item.isoDate ?? item.pubDate ?? new Date().toISOString(),
        }));
        results.push(...items);
      } catch {
        // Feed indisponível — apenas ignora e segue com outros
      }
    })
  );

  return results
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
