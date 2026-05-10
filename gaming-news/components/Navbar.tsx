"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

interface NavbarProps {
  onSubscribeClick: () => void;
}

const LOCALES = [
  { code: "pt", label: "PT", flag: "🇧🇷" },
  { code: "en", label: "EN", flag: "🇺🇸" },
  { code: "es", label: "ES", flag: "🇪🇸" },
];

export default function Navbar({ onSubscribeClick }: NavbarProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  function switchLocale(newLocale: string) {
    // Substitui o prefixo de locale na URL atual
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/") || "/");
    setLangOpen(false);
  }

  const currentLocale = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-xl font-mono font-black tracking-widest glow-pc">
            ⚡ {t("logo")}
          </span>
        </motion.div>

        {/* Plataformas — desktop */}
        <div className="hidden md:flex items-center gap-6 text-sm font-mono text-white/60">
          {["PC", "Xbox", "Nintendo", "PlayStation"].map((p) => (
            <span
              key={p}
              className="hover:text-white transition-colors cursor-pointer hover:glow-pc"
            >
              {p}
            </span>
          ))}
        </div>

        {/* Ações direita */}
        <div className="flex items-center gap-3">

          {/* Seletor de idioma */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1 glass px-3 py-1.5 rounded text-sm font-mono text-white/80 hover:text-white transition-colors"
            >
              <span>{currentLocale.flag}</span>
              <span>{currentLocale.label}</span>
              <span className="text-xs opacity-50">▼</span>
            </button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-1 glass rounded overflow-hidden min-w-[100px] border border-white/10"
                >
                  {LOCALES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => switchLocale(l.code)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-mono hover:bg-white/10 transition-colors ${
                        l.code === locale ? "text-[#00D4FF]" : "text-white/80"
                      }`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Botão cadastrar */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            onClick={onSubscribeClick}
            className="hidden sm:flex items-center gap-2 bg-[#00D4FF]/10 border border-[#00D4FF]/50 text-[#00D4FF] px-4 py-1.5 rounded text-sm font-mono hover:bg-[#00D4FF]/20 transition-colors"
          >
            + {t("subscribe")}
          </motion.button>

          {/* Hamburguer mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white/80 hover:text-white p-1"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden glass border-t border-white/10 px-4 py-3 flex flex-col gap-3"
          >
            {["PC", "Xbox", "Nintendo", "PlayStation"].map((p) => (
              <span key={p} className="text-sm font-mono text-white/70">{p}</span>
            ))}
            <button
              onClick={() => { onSubscribeClick(); setMenuOpen(false); }}
              className="text-left text-sm font-mono text-[#00D4FF]"
            >
              + {t("subscribe")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
