export type Platform = "pc" | "xbox" | "nintendo" | "playstation";

export interface NewsItem {
  id: string;           // base64url de "platform:originalUrl" — usado na rota /news/[id]
  title: string;
  description: string;
  fullContent?: string; // Conteúdo completo do artigo (quando disponível no RSS)
  imageUrl: string;
  originalUrl: string;
  platform: Platform;
  source: string;
  publishedAt: string;
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
