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
    { day: "numeric", month: "long", year: "numeric" }
  );
}

export default function ArticlePage() {
  const { id }   = useParams<{ id: string }>();
  const locale   = useLocale();
  const router   = useRouter();

  const [article, setArticle]  = useState<ArticleDetail | null>(null);
  const [related, setRelated]  = useState<NewsItem[]>([]);
  const [loading, setLoading]  = useState(true);
  const [error,   setError]    = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setArticle(null);
    fetch(`/api/article/${id}?locale=${locale}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d)  => { setArticle(d.article); setRelated(d.related ?? []); })
      .catch(()  => setError(true))
      .finally(() => setLoading(false));
  }, [id, locale]);

  /* ── Estado de carregamento ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-20">
      <div className="text-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/40 font-mono text-xs tracking-widest">
          {locale === "pt" ? "Traduzindo artigo..." : locale === "es" ? "Traduciendo artículo..." : "Loading article..."}
        </p>
      </div>
    </div>
  );

  /* ── Estado de erro ── */
  if (error || !article) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 pt-20">
      <p className="text-red-400/60 font-mono text-sm">
        {locale === "pt" ? "Artigo não encontrado." : "Article not found."}
      </p>
      <button onClick={() => router.back()} className="text-[#00D4FF] font-mono text-sm hover:underline">
        ← {locale === "pt" ? "Voltar" : "Back"}
      </button>
    </div>
  );

  const platform   = getPlatformConfig(article.platform);
  const articleUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-xs font-mono text-white/30 mb-6 flex-wrap">
          <Link href={`/${locale}`} className="hover:text-white/70 transition-colors">
            {locale === "pt" ? "Início" : locale === "es" ? "Inicio" : "Home"}
          </Link>
          <span>/</span>
          <span style={{ color: platform.color }}>{platform.label}</span>
          <span>/</span>
          <span className="text-white/40 truncate max-w-xs">{article.title.slice(0, 50)}…</span>
        </nav>

        {/* ── Layout de 2 colunas ── */}
        <div className="flex flex-col lg:flex-row gap-10">

          {/* ════════════════ COLUNA PRINCIPAL ════════════════ */}
          <article className="flex-1 min-w-0">

            {/* Badge da plataforma */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className="platform-badge"
                style={{ backgroundColor: `${platform.color}18`, color: platform.color, border: `1px solid ${platform.color}50` }}
              >
                {platform.label}
              </span>
            </div>

            {/* Título principal */}
            <h1
              className="text-2xl md:text-3xl lg:text-[2rem] font-extrabold text-white leading-tight mb-5"
              style={{ textShadow: `0 0 25px ${platform.glowColor}` }}
            >
              {article.title}
            </h1>

            {/* Meta: fonte + data */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/10">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-none"
                style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
              >
                {article.source.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-xs font-semibold text-white/70">{article.source}</p>
                <p className="text-[10px] text-white/30 font-mono">{formatDate(article.publishedAt, locale)}</p>
              </div>

              {/* Link para original — discreto */}
              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto text-[10px] font-mono hover:underline flex-none"
                style={{ color: platform.color }}
              >
                {locale === "pt" ? "Ver original ↗" : locale === "es" ? "Ver original ↗" : "View original ↗"}
              </a>
            </div>

            {/* Botões de compartilhar — antes do corpo (como Nintendo Life) */}
            <ShareButtons title={article.title} url={articleUrl} />

            {/* Imagem hero */}
            <div
              className="relative w-full rounded-2xl overflow-hidden my-6"
              style={{ aspectRatio: "16/9", boxShadow: `0 8px 48px ${platform.glowColor}` }}
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
            <p className="text-[1.05rem] text-white/80 leading-relaxed mb-8 pb-8 border-b border-white/10 font-medium italic">
              {article.description}
            </p>

            {/* Corpo do artigo com texto traduzido + imagens/vídeos preservados */}
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: article.rawHtml }}
            />

            {/* Seção de compartilhar — também no final */}
            <div className="mt-10 pt-6 border-t border-white/10">
              <ShareButtons title={article.title} url={articleUrl} />
            </div>

            {/* Comentários */}
            <Comments articleId={article.id} />
          </article>

          {/* ════════════════ SIDEBAR ════════════════ */}
          <aside className="lg:w-72 xl:w-80 flex-none">
            <div className="lg:sticky lg:top-20 space-y-4">

              {/* Botão voltar */}
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-sm font-mono text-white/40 hover:text-white transition-colors w-full"
              >
                ← {locale === "pt" ? "Voltar" : locale === "es" ? "Volver" : "Back"}
              </button>

              {/* Related news */}
              {related.length > 0 && (
                <div className="glass rounded-2xl border border-white/8 overflow-hidden">
                  <div
                    className="px-4 py-3 text-xs font-mono font-bold uppercase tracking-widest"
                    style={{ backgroundColor: `${platform.color}15`, color: platform.color }}
                  >
                    {locale === "pt" ? "Mais notícias" : locale === "es" ? "Más noticias" : "More news"}
                  </div>
                  <div className="p-3">
                    <ArticleSidebar related={related} />
                  </div>
                </div>
              )}
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}
