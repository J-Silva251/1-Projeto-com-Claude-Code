export type Platform = "pc" | "xbox" | "nintendo" | "playstation";

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
