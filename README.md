# ⚡ GameNews

Agregador de notícias de games com visual cyberpunk animado. Busca notícias reais via RSS de múltiplas plataformas, traduz automaticamente e exibe o conteúdo limpo do artigo (incluindo vídeos embutidos).

> Projeto de portfólio — foco em arquitetura, internacionalização, segurança e testes.

## ✨ Funcionalidades

- 📰 **Agregação real via RSS** — PC, Xbox, Nintendo, PlayStation e Mobile
- 🌍 **Internacionalização** — interface e artigos em 3 idiomas (PT / EN / ES)
- 🧹 **Extração limpa de conteúdo** com Readability, preservando vídeos embutidos (YouTube, Vimeo, Twitch, etc.)
- 🎨 **UI cyberpunk animada** — ticker contínuo, cards com hover 3D, partículas e modais (Framer Motion)
- 🔄 **Atualização reativa** do feed via SWR
- 🔐 **Hardening de segurança** — CSP + headers de segurança, rate limiting, validação/sanitização de input e logger estruturado
- ✅ **Suíte de testes** automatizada (Vitest)

## 🛠️ Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** — estilização utility-first
- **Framer Motion** — animações
- **next-intl** — i18n com rotas por locale
- **SWR** — fetching reativo com auto-refresh
- **Supabase** (opcional) — persistência de notícias e cadastro de membros
- **Vitest** — testes unitários

## 🚀 Como rodar

```bash
cd gaming-news
npm install
npm run dev      # http://localhost:3000
```

Outros comandos:

```bash
npm run build    # build de produção
npm run lint     # ESLint
npm test         # suíte de testes (Vitest)
```

> O Supabase é opcional: sem as variáveis em `.env.local`, o site funciona normalmente via RSS direto. Veja `gaming-news/.env.example`.

## 📁 Estrutura

```
gaming-news/
├── app/
│   ├── [locale]/         # Páginas (App Router) por idioma
│   └── api/              # Rotas de API (notícias, artigo, cadastro)
├── components/           # Navbar, NewsGrid, HeroNews, NewsCard, modais…
├── lib/                  # newsParser, translator, segurança, validação, logger
└── tests/                # Suíte Vitest
```

## 📄 Licença

Projeto de portfólio. Conteúdo de notícias agregado de fontes públicas via RSS.
