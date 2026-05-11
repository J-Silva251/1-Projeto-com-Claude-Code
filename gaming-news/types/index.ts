export type Platform = "pc" | "xbox" | "nintendo" | "playstation" | "mobile";

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  originalUrl: string;
  platform: Platform;
  source: string;
  publishedAt: string;
}

// Extensão usada apenas na página de artigo (não trafega no grid)
export interface ArticleDetail extends NewsItem {
  rawHtml: string;
  author?: string;
}

export interface PlatformConfig {
  key: Platform;
  label: string;
  color: string;
  darkColor: string;
  glowColor: string;
  borderClass: string;
  glowClass: string;
  badgeBg: string;
}

export interface Subscriber {
  name: string;
  email: string;
  platforms: Platform[];
}

export interface Comment {
  id: string;
  articleId: string;
  name: string;
  text: string;
  timestamp: string;
}
