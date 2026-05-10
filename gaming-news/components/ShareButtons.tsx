"use client";

import { useState } from "react";

interface ShareButtonsProps {
  title: string;
  url: string;
}

export default function ShareButtons({ title, url }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const encoded = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Web Share API — abre o compartilhamento nativo do dispositivo (mobile)
  async function nativeShare() {
    if (navigator.share) {
      await navigator.share({ title, url });
    }
  }

  const buttons = [
    {
      label: "X / Twitter",
      icon: "𝕏",
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encoded}`,
      color: "#1a1a1a",
      border: "#333",
    },
    {
      label: "WhatsApp",
      icon: "💬",
      href: `https://wa.me/?text=${encodedTitle}%20${encoded}`,
      color: "#075e54",
      border: "#128c7e",
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 py-4 border-t border-white/10">
      <span className="text-xs font-mono text-white/40 mr-1">Compartilhar:</span>

      {buttons.map((b) => (
        <a
          key={b.label}
          href={b.href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-white/70 hover:text-white transition-all hover:scale-105"
          style={{ backgroundColor: b.color, border: `1px solid ${b.border}` }}
          aria-label={`Compartilhar no ${b.label}`}
        >
          <span>{b.icon}</span>
          <span>{b.label}</span>
        </a>
      ))}

      {/* Copiar link */}
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all hover:scale-105"
        style={{
          backgroundColor: copied ? "rgba(0,212,255,0.2)" : "rgba(255,255,255,0.06)",
          border: `1px solid ${copied ? "#00D4FF" : "rgba(255,255,255,0.15)"}`,
          color: copied ? "#00D4FF" : "rgba(255,255,255,0.7)",
        }}
      >
        <span>{copied ? "✓" : "🔗"}</span>
        <span>{copied ? "Copiado!" : "Copiar link"}</span>
      </button>

      {/* Compartilhamento nativo (mobile) */}
      {typeof navigator !== "undefined" && "share" in navigator && (
        <button
          onClick={nativeShare}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono text-white/70 hover:text-white transition-all hover:scale-105"
          style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)" }}
        >
          <span>↑</span>
          <span>Mais</span>
        </button>
      )}
    </div>
  );
}
