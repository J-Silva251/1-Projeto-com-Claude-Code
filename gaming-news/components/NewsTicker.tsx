"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { NewsItem } from "@/types";
import { getPlatformConfig } from "@/lib/platforms";

interface TickerProps {
  news: NewsItem[];
}

export default function NewsTicker({ news }: TickerProps) {
  const t = useTranslations("ticker");
  const containerRef = useRef<HTMLDivElement>(null);

  if (!news.length) return null;

  // Duplica a lista para criar loop visual perfeito
  const doubled = [...news, ...news];

  return (
    <div className="relative overflow-hidden bg-black/40 border-y border-white/5 h-9 flex items-center">

      {/* Label fixo à esquerda */}
      <div className="flex-none z-10 bg-[#00D4FF] text-black text-xs font-mono font-bold px-3 h-full flex items-center gap-1 select-none">
        <span className="animate-pulse">●</span>
        {t("label")}
      </div>

      {/* Faixa de scroll contínuo */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        <motion.div
          className="flex items-center gap-8 whitespace-nowrap"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
        >
          {doubled.map((item, i) => {
            const platform = getPlatformConfig(item.platform);
            return (
              <a
                key={`${item.id}-${i}`}
                href={item.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-mono text-white/70 hover:text-white transition-colors group"
              >
                {/* Bullet colorido por plataforma */}
                <span
                  className="w-1.5 h-1.5 rounded-full flex-none"
                  style={{ backgroundColor: platform.color }}
                />
                <span className="group-hover:underline">{item.title}</span>
                <span className="text-white/20 mx-2">•</span>
              </a>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
