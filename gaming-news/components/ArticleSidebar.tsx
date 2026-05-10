"use client";

import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { NewsItem } from "@/types";
import { getPlatformConfig } from "@/lib/platforms";

interface ArticleSidebarProps {
  related: NewsItem[];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h > 24) return `${Math.floor(h / 24)}d`;
  if (h > 0) return `${h}h`;
  return `${Math.floor(diff / 60000)}m`;
}

export default function ArticleSidebar({ related }: ArticleSidebarProps) {
  const locale = useLocale();

  if (!related.length) return null;

  return (
    <aside className="space-y-2">
      <h3 className="text-xs font-mono font-bold text-white/50 uppercase tracking-widest mb-4">
        Em Alta
      </h3>

      {related.map((item) => {
        const platform = getPlatformConfig(item.platform);
        return (
          <Link
            key={item.id}
            href={`/${locale}/news/${item.id}`}
            className="flex gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
          >
            {/* Thumbnail */}
            <div className="relative flex-none w-20 h-14 rounded overflow-hidden bg-white/5">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span
                className="text-[9px] font-mono font-bold uppercase tracking-wider"
                style={{ color: platform.color }}
              >
                {platform.label}
              </span>
              <p className="text-xs text-white/70 leading-snug line-clamp-2 group-hover:text-white transition-colors mt-0.5">
                {item.title}
              </p>
              <span className="text-[10px] text-white/25 font-mono">{timeAgo(item.publishedAt)}</span>
            </div>
          </Link>
        );
      })}
    </aside>
  );
}
