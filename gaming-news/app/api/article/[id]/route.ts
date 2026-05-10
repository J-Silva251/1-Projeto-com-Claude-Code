import { NextRequest, NextResponse } from "next/server";
import { decodeArticleId, fetchPlatformNews } from "@/lib/newsParser";
import { translateText } from "@/lib/translator";

// Cache de 10 minutos — artigos são re-buscados do feed se não estiverem em cache
export const revalidate = 600;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const locale = req.nextUrl.searchParams.get("locale") ?? "pt";
  const decoded = decodeArticleId(params.id);

  if (!decoded) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { platform, originalUrl } = decoded;

  // Re-busca o feed da plataforma para localizar o artigo pelo URL
  const news = await fetchPlatformNews(platform, locale);
  const article = news.find((n) => n.originalUrl === originalUrl);

  if (!article) {
    return NextResponse.json({ error: "Artigo não encontrado" }, { status: 404 });
  }

  // Traduz o conteúdo completo se disponível (limitado a 5000 chars para performance)
  let translatedFull = article.fullContent ?? "";
  if (translatedFull && locale !== "en") {
    const chunk = translatedFull.slice(0, 5000);
    translatedFull = await translateText(chunk, locale);
  }

  return NextResponse.json({ article: { ...article, fullContent: translatedFull } });
}
