import createNextIntlPlugin from "next-intl/plugin";
import { securityHeaders } from "./lib/securityHeaders.mjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // standalone: cria um bundle mínimo para hospedar em qualquer servidor Node.js
  // pasta .next/standalone contém tudo necessário (~50MB em vez de 300MB+)
  output: "standalone",

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    // Desativa otimização de imagem para compatibilidade com servidores básicos
    // (a otimização nativa do Next.js requer recursos do servidor)
    unoptimized: true,
  },

  // Suprime avisos de hydration que ocorrem com framer-motion em SSR
  reactStrictMode: false,

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
