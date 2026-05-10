"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import type { Platform } from "@/types";
import { PLATFORMS } from "@/lib/platforms";

interface PlatformTabsProps {
  active: Platform | "all";
  onChange: (p: Platform | "all") => void;
}

export default function PlatformTabs({ active, onChange }: PlatformTabsProps) {
  const t = useTranslations("tabs");

  const tabs = [
    { key: "all" as const, label: t("tabs.all"), color: "#00D4FF" },
    ...PLATFORMS.map((p) => ({ key: p.key as Platform, label: p.label, color: p.color })),
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className="relative flex-none px-5 py-2 rounded font-mono text-sm font-bold transition-all"
            style={{
              color: isActive ? "#000" : tab.color,
              backgroundColor: isActive ? tab.color : "transparent",
              border: `1px solid ${isActive ? tab.color : tab.color + "50"}`,
            }}
          >
            {/* Glow atrás do botão ativo */}
            {isActive && (
              <motion.div
                layoutId="tab-glow"
                className="absolute inset-0 rounded"
                style={{ boxShadow: `0 0 20px ${tab.color}` }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
