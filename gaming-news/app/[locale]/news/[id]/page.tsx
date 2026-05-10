"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Image from "next/image";
import Link from "next/link";
import { getPlatformConfig } from "@/lib/platforms";
import type { ArticleDetail, NewsItem } from "@/types";
import ShareButtons from "@/components/ShareButtons";
import Comments from "@/components/Comments";
import ArticleSidebar from "@/components/ArticleSidebar";

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(
    locale === "pt" ? "pt-BR" : locale === "es" ? "es-ES" : "en-US",
    { day: "2-digit", month: "long", year: "numeric" }
  );
}

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const locale = useLocale();
  const router = useRouter();

  const [article, setArticle] = useState<ArticleDetail | null>(null);
  const [related, setRelated] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    fetch(`/api/article/${id}?locale=${locale}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setArticle(d.article); setRelated(d.related ?? []); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white/40 font-mono text-xs">Carregando artigo...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-20">
        <p className="text-red-400/70 font-mono text-sm">Artigo não encontrado.</p>
        <button onClick={() => router.back()} className="text-[#00D4FF] font-mono text-sm hover:underline">← Voltar</button>
      </div>
    );
  }

  const platform = getPlatformConfig(article.platform);
  const articleUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs font-mono text-white/30 mb-6">
          <Link href={`/${locale}`} className="hover:text-white transition-colors">Home</Link>
          <span>/</span>
          <span style={{ color: platform.color }}>{platform.label}</span>
          <span>/</span>
          <span className="text-white/50 truncate max-w-xs">{article.title.slice(0, 40)}...</span>
        </nav>

        {/* Layout: artigo (esquerda) + sidebar (direita) */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* ── COLUNA PRINCIPAL ── */}
          <article className="flex-1 min-w-0">

            {/* Badges */}
            <div className="flex items-center gap-3 mb-4">
              <span
                className="platform-badge"
                style={{ backgroundColor: `${platform.color}20`, color: platform.color, border: `1px solid ${platform.color}60` }}
              >
                {platform.label}
              </span>
              <span className="text-xs text-white/40 font-mono">{article.source}</span>
              <span className="text-xs text-white/30 font-mono">{formatDate(article.publishedAt, locale)}</span>
            </div>

            {/* Título */}
            <h1
              className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight mb-6"
              style={{ textShadow: `0 0 30px ${platform.glowColor}` }}
            >
              {article.title}
            </h1>

            {/* Imagem hero */}
            <div
              className="relative w-full rounded-xl overflow-hidden mb-8"
              style={{ aspectRatio: "16/9", boxShadow: `0 4px 40px ${platform.glowColor}` }}
            >
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
                priority
                unoptimized
              />
            </div>

            {/* Resumo em destaque */}
            <p className="text-base md:text-lg text-white/75 leading-relaxed mb-8 pb-8 border-b border-white/10 font-medium">
              {article.description}
            </p>

            {/* Corpo do artigo — HTML completo com imagens e vídeos */}
            {article.rawHtml ? (
              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: article.rawHtml }}
              />
            ) : (
              <p className="text-sm text-white/40 italic font-mono">
                Conteúdo completo disponível na fonte original.
              </p>
            )}

            {/* Fonte original */}
            <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono">
              <span className="text-white/30">Fonte: {article.source}</span>
              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
                style={{ color: platform.color }}
              >
                Ver original →
              </a>
            </div>

            {/* Compartilhar */}
            <ShareButtons title={article.title} url={articleUrl} />

            {/* Comentários */}
            <Comments articleId={article.id} />
          </article>

          {/* ── SIDEBAR ── */}
          <aside className="lg:w-72 xl:w-80 flex-none">
            <div className="lg:sticky lg:top-20 space-y-6">
              {/* Botão voltar */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-mono text-white/40 hover:text-white transition-colors"
              >
                ← Voltar
              </button>

              {/* Notícias relacionadas */}
              <div className="glass rounded-xl p-4 border border-white/8">
                <ArticleSidebar related={related} />
              </div>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
