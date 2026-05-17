"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import type { NewsItem } from "@/types";
import { getPlatformConfig } from "@/lib/platforms";

interface NewsCardProps {
  item: NewsItem;
  index?: number;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d`;
  if (h > 0)  return `${h}h`;
  if (m > 0)  return `${m}m`;
  return "agora";
}

export default function NewsCard({ item, index = 0 }: NewsCardProps) {
  const t = useTranslations("card");
  const locale = useLocale();
  const platform = getPlatformConfig(item.platform);
  const href = `/${locale}/news/${item.id}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="card-3d group relative glass rounded-lg overflow-hidden border-l-2 flex flex-col cursor-pointer"
      style={{ borderLeftColor: platform.color }}
      onClick={() => window.location.href = href}
    >
      {/* Imagem de capa */}
      <div className="relative h-44 overflow-hidden bg-white/5">
        <Image
          src={item.imageUrl}
          alt={item.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          priority={index === 0}
          unoptimized
        />
        {/* Gradiente sobre a imagem */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050510]/80 to-transparent" />

        {/* Badge de plataforma */}
        <span
          className="absolute top-3 left-3 platform-badge"
          style={{
            backgroundColor: `${platform.color}25`,
            color: platform.color,
            border: `1px solid ${platform.color}60`,
          }}
        >
          {platform.label}
        </span>
      </div>

      {/* Conteúdo */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-semibold text-white leading-snug line-clamp-2 group-hover:text-[#00D4FF] transition-colors">
          {item.title}
        </h3>
        <p className="text-xs text-white/50 leading-relaxed line-clamp-3 flex-1">
          {item.description}
        </p>

        {/* Rodapé do card */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2 text-[10px] text-white/30 font-mono">
            <span>{item.source}</span>
            <span>•</span>
            <span>{timeAgo(item.publishedAt)}</span>
          </div>
          <Link
            href={href}
            className="text-xs font-mono transition-colors"
            style={{ color: platform.color }}
          >
            {t("readMore")}
          </Link>
        </div>
      </div>

      {/* Glow hover */}
      <div
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: `inset 0 0 30px ${platform.glowColor}` }}
      />
    </motion.article>
  );
}
