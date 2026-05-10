"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { motion } from "framer-motion";
import { getPlatformConfig } from "@/lib/platforms";
import type { NewsItem } from "@/types";

function timeFormatted(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale === "pt" ? "pt-BR" : locale, {
    day: "2-digit", month: "long", year: "numeric",
  });
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations();

  const [article, setArticle] = useState<(NewsItem & { fullContent?: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/article/${id}?locale=${locale}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => setArticle(d.article))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.p
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/40 font-mono text-sm"
        >
          {t("loading")}
        </motion.p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-400/70 font-mono text-sm">{t("error")}</p>
        <button onClick={() => router.back()} className="text-[#00D4FF] font-mono text-sm hover:underline">
          ← Voltar
        </button>
      </div>
    );
  }

  const platform = getPlatformConfig(article.platform);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">

      {/* Botão voltar */}
      <motion.button
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-mono text-white/50 hover:text-white transition-colors mb-8"
      >
        ← Voltar
      </motion.button>

      {/* Badge da plataforma */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-4"
      >
        <span
          className="platform-badge"
          style={{
            backgroundColor: `${platform.color}20`,
            color: platform.color,
            border: `1px solid ${platform.color}60`,
          }}
        >
          {platform.label}
        </span>
        <span className="text-xs text-white/30 font-mono">{article.source}</span>
        <span className="text-xs text-white/20 font-mono">
          {timeFormatted(article.publishedAt, locale)}
        </span>
      </motion.div>

      {/* Título */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl md:text-3xl font-bold text-white leading-snug mb-6"
        style={{ textShadow: `0 0 40px ${platform.glowColor}` }}
      >
        {article.title}
      </motion.h1>

      {/* Imagem de capa */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15 }}
        className="relative h-64 md:h-96 rounded-xl overflow-hidden mb-8"
        style={{ boxShadow: `0 0 40px ${platform.glowColor}` }}
      >
        <Image
          src={article.imageUrl}
          alt={article.title}
          fill
          className="object-cover"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050510]/60 to-transparent" />
      </motion.div>

      {/* Conteúdo do artigo */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6 md:p-8"
        style={{ borderLeft: `3px solid ${platform.color}` }}
      >
        {/* Descrição/resumo em destaque */}
        <p className="text-base text-white/80 leading-relaxed mb-6 font-medium border-b border-white/10 pb-6">
          {article.description}
        </p>

        {/* Corpo completo do artigo */}
        {article.fullContent ? (
          <div className="text-sm text-white/60 leading-loose space-y-4">
            {article.fullContent.split("\n\n").filter(Boolean).map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-white/40 italic font-mono">
            Conteúdo completo disponível na fonte original.
          </p>
        )}
      </motion.div>

      {/* Link para a fonte original */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-6 flex items-center justify-between"
      >
        <p className="text-xs text-white/30 font-mono">
          Fonte: {article.source}
        </p>
        <a
          href={article.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono transition-colors hover:underline"
          style={{ color: platform.color }}
        >
          Ver original →
        </a>
      </motion.div>
    </main>
  );
}
