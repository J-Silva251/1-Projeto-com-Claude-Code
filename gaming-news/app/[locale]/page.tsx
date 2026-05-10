"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import Navbar from "@/components/Navbar";
import NewsTicker from "@/components/NewsTicker";
import NewsGrid from "@/components/NewsGrid";
import SubscribeModal from "@/components/SubscribeModal";
import ParticleBackground from "@/components/ParticleBackground";
import type { NewsItem } from "@/types";

export default function HomePage() {
  const locale = useLocale();
  const t = useTranslations("footer");
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [tickerNews, setTickerNews] = useState<NewsItem[]>([]);

  // Busca notícias para o ticker ao montar a página
  useEffect(() => {
    fetch(`/api/news/all?locale=${locale}`)
      .then((r) => r.json())
      .then((d) => setTickerNews(d.news ?? []))
      .catch(() => {});
  }, [locale]);

  return (
    <>
      {/* Fundo animado */}
      <div className="grid-background" />
      <div className="scan-line" />
      <div className="depth-gradient" />
      <ParticleBackground />

      {/* Conteúdo principal sobre o fundo */}
      <div className="relative z-10 min-h-screen flex flex-col">

        {/* Barra de navegação */}
        <Navbar onSubscribeClick={() => setSubscribeOpen(true)} />

        {/* Ticker de notícias logo abaixo do navbar */}
        <div className="mt-16">
          <NewsTicker news={tickerNews} />
        </div>

        {/* Área principal com as abas e grid de notícias */}
        <main className="flex-1">
          <NewsGrid />
        </main>

        {/* Rodapé */}
        <footer className="border-t border-white/5 py-6 text-center">
          <p className="text-xs text-white/20 font-mono">
            ⚡ GAMENEWS · {new Date().getFullYear()} · {t("rights")}
          </p>
          <p className="text-[10px] text-white/10 mt-1">
            {t("disclaimer")}
          </p>
        </footer>
      </div>

      {/* Modal de cadastro */}
      <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} />
    </>
  );
}
