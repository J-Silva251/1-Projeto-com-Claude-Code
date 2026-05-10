"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { NewsItem } from "@/types";
import { getPlatformConfig } from "@/lib/platforms";

interface HeroNewsProps {
  item: NewsItem;
}

export default function HeroNews({ item }: HeroNewsProps) {
  const t = useTranslations("hero");
  const platform = getPlatformConfig(item.platform);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="relative rounded-xl overflow-hidden group"
      style={{ minHeight: 420 }}
    >
      {/* Imagem de fundo */}
      <Image
        src={item.imageUrl}
        alt={item.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-700"
        priority
        unoptimized
      />

      {/* Gradiente escuro na parte inferior */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-[#050510]/60 to-transparent" />

      {/* Glow de plataforma nas bordas */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{ boxShadow: `0 0 60px ${platform.glowColor}, inset 0 0 60px ${platform.glowColor}` }}
      />

      {/* Conteúdo sobreposto */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        {/* Badge destaque */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 mb-4"
        >
          <span
            className="platform-badge"
            style={{
              backgroundColor: `${platform.color}25`,
              color: platform.color,
              border: `1px solid ${platform.color}80`,
            }}
          >
            {platform.label}
          </span>
          <span
            className="platform-badge animate-pulse"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}
          >
            {t("featured")}
          </span>
        </motion.div>

        {/* Título */}
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xl md:text-3xl font-bold text-white leading-tight mb-3 max-w-2xl"
          style={{ textShadow: `0 0 30px ${platform.glowColor}` }}
        >
          {item.title}
        </motion.h2>

        {/* Descrição */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-sm text-white/60 mb-5 max-w-xl line-clamp-2"
        >
          {item.description}
        </motion.p>

        {/* Rodapé */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-4"
        >
          <a
            href={item.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-2 rounded font-mono text-sm font-bold transition-all hover:scale-105"
            style={{
              backgroundColor: platform.color,
              color: "#000",
              boxShadow: `0 0 20px ${platform.glowColor}`,
            }}
          >
            {t("readMore")} →
          </a>
          <span className="text-xs text-white/40 font-mono">{item.source}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
