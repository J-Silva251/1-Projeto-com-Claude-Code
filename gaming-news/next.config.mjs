import createNextIntlPlugin from "next-intl/plugin";

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
};

export default withNextIntl(nextConfig);
