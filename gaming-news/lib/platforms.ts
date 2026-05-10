import type { PlatformConfig } from "@/types";

// Configuração central de cada plataforma — cores, glows e labels
export const PLATFORMS: PlatformConfig[] = [
  {
    key: "pc",
    label: "PC",
    color: "#00D4FF",
    darkColor: "#0099CC",
    glowColor: "rgba(0,212,255,0.4)",
    borderClass: "border-[#00D4FF]",
    glowClass: "border-glow-pc",
    badgeBg: "bg-[#00D4FF]/20 text-[#00D4FF]",
  },
  {
    key: "xbox",
    label: "Xbox",
    color: "#107C10",
    darkColor: "#0a5a0a",
    glowColor: "rgba(16,124,16,0.4)",
    borderClass: "border-[#107C10]",
    glowClass: "border-glow-xbox",
    badgeBg: "bg-[#107C10]/20 text-[#107C10]",
  },
  {
    key: "nintendo",
    label: "Nintendo",
    color: "#E4000F",
    darkColor: "#a30009",
    glowColor: "rgba(228,0,15,0.4)",
    borderClass: "border-[#E4000F]",
    glowClass: "border-glow-nintendo",
    badgeBg: "bg-[#E4000F]/20 text-[#E4000F]",
  },
  {
    key: "playstation",
    label: "PlayStation",
    color: "#00439C",
    darkColor: "#002d6b",
    glowColor: "rgba(0,67,156,0.4)",
    borderClass: "border-[#00439C]",
    glowClass: "border-glow-playstation",
    badgeBg: "bg-[#00439C]/20 text-[#5599FF]",
  },
];

export function getPlatformConfig(key: string): PlatformConfig {
  return PLATFORMS.find((p) => p.key === key) ?? PLATFORMS[0];
}
