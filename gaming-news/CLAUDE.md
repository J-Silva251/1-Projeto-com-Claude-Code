# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Projeto

Site de notícias de games para portfólio — busca notícias reais via RSS, reescreve automaticamente, com visual cyberpunk animado.

## Comandos principais

```bash
npm run dev      # Servidor de desenvolvimento em http://localhost:3000
npm run build    # Build de produção
npm run lint     # ESLint
```

## Stack

- **Next.js 14** (App Router + TypeScript)
- **Tailwind CSS** — estilização utility-first
- **Framer Motion** — animações (ticker, cards, modais, tabs)
- **next-intl v4** — i18n com rotas `[locale]` (pt, en, es)
- **SWR** — fetching reativo com auto-refresh a cada 5 min
- **Supabase** — opcional para persistência de notícias e cadastro de membros
- **rss-parser** — parse de feeds RSS das plataformas

## Arquitetura

```
app/
├── [locale]/page.tsx     # Página principal (Client Component)
├── [locale]/layout.tsx   # Provê NextIntlClientProvider
├── api/news/[platform]/  # Retorna notícias por plataforma (cache 10 min)
└── api/subscribe/        # Cadastro de membros (Supabase opcional)

components/
├── Navbar.tsx            # Navbar com seletor de idioma e botão cadastrar
├── NewsTicker.tsx        # Faixa de scroll contínuo com Framer Motion
├── NewsGrid.tsx          # Orquestra abas + hero + grid, usa SWR
├── HeroNews.tsx          # Notícia destaque (primeira do feed)
├── NewsCard.tsx          # Card individual com hover 3D
├── PlatformTabs.tsx      # Abas PC/Xbox/Nintendo/PlayStation
├── SubscribeModal.tsx    # Modal de cadastro com animação
└── ParticleBackground.tsx # Canvas com partículas flutuantes

lib/
├── newsParser.ts         # Busca e processa feeds RSS por plataforma
├── paraphraser.ts        # Adiciona prefixo localizado às notícias
├── platforms.ts          # Configuração de cores/glows por plataforma
└── supabase.ts           # Client Supabase (retorna null se não configurado)
```

## Plataformas e cores

| Plataforma  | Cor principal | Variável CSS         |
|------------|--------------|----------------------|
| PC         | `#00D4FF`    | ciano tecnológico    |
| Xbox       | `#107C10`    | verde Xbox           |
| Nintendo   | `#E4000F`    | vermelho Nintendo    |
| PlayStation| `#00439C`    | azul PlayStation     |

## i18n

Idiomas suportados: `pt` (padrão), `en`, `es`. Arquivos em `messages/`.  
A troca de idioma no Navbar atualiza o prefixo da URL (`/pt`, `/en`, `/es`).

## Supabase (opcional)

Preencha `.env.local` com as credenciais do projeto Supabase.  
Execute `supabase/schema.sql` no SQL Editor do Supabase para criar as tabelas.  
Sem as variáveis configuradas, o site funciona normalmente via RSS direto.

## Auto-atualização

- API routes com `revalidate = 600` (cache 10 min via Next.js)
- SWR no cliente com `refreshInterval = 300000` (5 min)
- Para Vercel: adicione um Cron Job apontando para `/api/news/fetch` a cada 15 min
