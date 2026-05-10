-- Tabela de notícias — armazena o feed após reescrita
CREATE TABLE IF NOT EXISTS news (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  description text NOT NULL,
  original_url text,
  image_url   text,
  platform    text CHECK (platform IN ('pc','xbox','nintendo','playstation')),
  source      text,
  published_at timestamptz DEFAULT now(),
  created_at  timestamptz DEFAULT now()
);

-- Índice para acelerar consultas por plataforma
CREATE INDEX IF NOT EXISTS news_platform_idx ON news(platform);
CREATE INDEX IF NOT EXISTS news_published_idx ON news(published_at DESC);

-- Tabela de assinantes — membros cadastrados para receber notícias
CREATE TABLE IF NOT EXISTS subscribers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  email      text UNIQUE NOT NULL,
  platforms  text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Habilita Row Level Security
ALTER TABLE news        ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ler notícias
CREATE POLICY "news_select" ON news FOR SELECT USING (true);

-- Apenas o serviço (service_role) pode inserir notícias
CREATE POLICY "news_insert" ON news FOR INSERT WITH CHECK (true);

-- Qualquer pessoa pode se cadastrar como assinante
CREATE POLICY "subscribers_insert" ON subscribers FOR INSERT WITH CHECK (true);
