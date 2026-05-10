"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { PLATFORMS } from "@/lib/platforms";
import type { Platform } from "@/types";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SubscribeModal({ open, onClose }: SubscribeModalProps) {
  const t = useTranslations("subscribe");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function togglePlatform(key: Platform) {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, platforms: selectedPlatforms }),
      });
      if (res.ok) {
        setStatus("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  function handleClose() {
    setStatus("idle");
    setName("");
    setEmail("");
    setSelectedPlatforms([]);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="glass border border-[#00D4FF]/30 rounded-xl p-6 mx-4"
              style={{ boxShadow: "0 0 60px rgba(0,212,255,0.2)" }}>

              {/* Fechar */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/40 hover:text-white text-xl font-bold transition-colors"
              >
                ✕
              </button>

              {status === "success" ? (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-6"
                >
                  <div className="text-5xl mb-4">🎮</div>
                  <h3 className="text-lg font-bold text-[#00D4FF] mb-2">{t("success")}</h3>
                  <p className="text-sm text-white/60">{t("successMessage")}</p>
                  <button
                    onClick={handleClose}
                    className="mt-6 px-6 py-2 bg-[#00D4FF] text-black font-mono font-bold rounded hover:scale-105 transition-transform"
                  >
                    {t("close")}
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">{t("title")}</h2>
                    <p className="text-xs text-white/50">{t("subtitle")}</p>
                  </div>

                  {/* Nome */}
                  <div>
                    <label className="text-xs font-mono text-white/60 mb-1 block">{t("name")}</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("namePlaceholder")}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D4FF]/60 transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-mono text-white/60 mb-1 block">{t("email")}</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("emailPlaceholder")}
                      className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D4FF]/60 transition-colors"
                    />
                  </div>

                  {/* Plataformas */}
                  <div>
                    <label className="text-xs font-mono text-white/60 mb-2 block">{t("platforms")}</label>
                    <div className="flex flex-wrap gap-2">
                      {PLATFORMS.map((p) => {
                        const selected = selectedPlatforms.includes(p.key);
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => togglePlatform(p.key)}
                            className="px-3 py-1.5 rounded text-xs font-mono font-bold transition-all"
                            style={{
                              color: selected ? "#000" : p.color,
                              backgroundColor: selected ? p.color : "transparent",
                              border: `1px solid ${selected ? p.color : p.color + "50"}`,
                            }}
                          >
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Botão submit */}
                  <motion.button
                    type="submit"
                    disabled={status === "loading"}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-2.5 bg-[#00D4FF] text-black font-mono font-bold rounded hover:bg-[#00D4FF]/90 transition-colors disabled:opacity-50"
                  >
                    {status === "loading" ? "..." : t("button")}
                  </motion.button>

                  {status === "error" && (
                    <p className="text-xs text-red-400 text-center">Erro. Tente novamente.</p>
                  )}
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
