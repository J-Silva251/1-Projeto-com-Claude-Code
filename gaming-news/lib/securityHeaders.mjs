// Headers de segurança aplicados a todas as rotas (consumido por next.config.mjs).
// CSP pragmática: permite inline para não quebrar Next.js/framer-motion.
// A defesa primária contra XSS é o DOMPurify em lib/newsParser.ts.

const VIDEO_FRAME_SRC = [
  "https://www.youtube.com",
  "https://www.youtube-nocookie.com",
  "https://player.vimeo.com",
  "https://player.twitch.tv",
  "https://clips.twitch.tv",
  "https://www.dailymotion.com",
  "https://geo.dailymotion.com",
  "https://players.brightcove.net",
].join(" ");

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https: http:",
  "media-src 'self' https:",
  `frame-src ${VIDEO_FRAME_SRC}`,
  "connect-src 'self' https://api.mymemory.translated.net https://*.supabase.co",
  "font-src 'self' data:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

export const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];
