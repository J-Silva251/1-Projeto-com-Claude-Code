import { NextRequest, NextResponse } from "next/server";
import { decodeArticleId, fetchArticleDetail, fetchPlatformNews } from "@/lib/newsParser";

// Cache de 30 minutos — artigos raramente mudam
export const revalidate = 1800;

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const locale = req.nextUrl.searchParams.get("locale") ?? "pt";
  const decoded = decodeArticleId(params.id);
  if (!decoded) return NextResponse.json({ error: "ID inválido" }, { status: 400 });

  const { platform, originalUrl } = decoded;

  // Busca o artigo completo (com HTML) e notícias relacionadas em paralelo
  const [article, related] = await Promise.all([
    fetchArticleDetail(platform, originalUrl, locale),
    fetchPlatformNews(platform, locale),
  ]);

  if (!article) return NextResponse.json({ error: "Artigo não encontrado" }, { status: 404 });

  // Exclui o próprio artigo da lista de relacionados
  const relatedNews = related.filter((n) => n.id !== article.id).slice(0, 6);

  return NextResponse.json({ article, related: relatedNews });
}
