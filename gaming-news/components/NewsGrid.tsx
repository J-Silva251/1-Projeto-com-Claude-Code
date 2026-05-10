"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import type { NewsItem, Platform } from "@/types";
import NewsCard from "./NewsCard";
import HeroNews from "./HeroNews";
import PlatformTabs from "./PlatformTabs";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Auto-atualiza notícias a cada 5 minutos
const REFRESH_INTERVAL = 5 * 60 * 1000;

export default function NewsGrid() {
  const t = useTranslations();
  const locale = useLocale();
  const [activePlatform, setActivePlatform] = useState<Platform | "all">("pc");

  const { data, isLoading, error } = useSWR(
    `/api/news/${activePlatform}?locale=${locale}`,
    fetcher,
    { refreshInterval: REFRESH_INTERVAL, revalidateOnFocus: false }
  );

  const news: NewsItem[] = data?.news ?? [];
  const hero = news[0];
  const rest = news.slice(1);

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">

      {/* Abas de plataforma */}
      <div className="mb-6">
        <PlatformTabs active={activePlatform} onChange={setActivePlatform} />
      </div>

      {/* Estado de carregamento */}
      {isLoading && (
        <div className="flex items-center justify-center py-20 text-white/40 font-mono text-sm">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {t("loading")}
          </motion.div>
        </div>
      )}

      {/* Estado de erro */}
      {error && !isLoading && (
        <div className="text-center py-20 text-red-400/70 font-mono text-sm">
          {t("error")}
        </div>
      )}

      {/* Conteúdo */}
      <AnimatePresence mode="wait">
        {!isLoading && !error && news.length > 0 && (
          <motion.div
            key={activePlatform}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Notícia destaque */}
            {hero && (
              <div className="mb-8">
                <HeroNews item={hero} />
              </div>
            )}

            {/* Grid de notícias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((item, i) => (
                <NewsCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </motion.div>
        )}

        {!isLoading && !error && news.length === 0 && (
          <div className="text-center py-20 text-white/30 font-mono text-sm">
            {t("noNews")}
          </div>
        )}
      </AnimatePresence>

      {/* Indicador de última atualização */}
      {data?.updatedAt && (
        <p className="mt-6 text-right text-[10px] text-white/20 font-mono">
          {new Date(data.updatedAt).toLocaleTimeString(locale)}
        </p>
      )}
    </section>
  );
}
