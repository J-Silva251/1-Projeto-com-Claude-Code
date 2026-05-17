import { NextRequest, NextResponse } from "next/server";
import { decodeArticleId, fetchArticleDetail, fetchPlatformNews } from "@/lib/newsParser";
import { safeLocale } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { logRequest } from "@/lib/logger";

// Sem cache estático — locale varia por request
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = clientIp(req);

  if (!rateLimit(`article:${ip}`, 60, 60_000)) {
    logRequest("article", 429, { ip });
    return NextResponse.json({ error: "Muitas requisições." }, { status: 429 });
  }

  const locale = safeLocale(req.nextUrl.searchParams.get("locale"));
  const decoded = decodeArticleId(params.id);
  if (!decoded) {
    logRequest("article", 400, { ip });
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const { platform, originalUrl } = decoded;

  // Busca o artigo completo (com HTML) e notícias relacionadas em paralelo
  const [article, related] = await Promise.all([
    fetchArticleDetail(platform, originalUrl, locale),
    fetchPlatformNews(platform, locale),
  ]);

  if (!article) {
    logRequest("article", 404, { ip, platform });
    return NextResponse.json({ error: "Artigo não encontrado" }, { status: 404 });
  }

  // Exclui o próprio artigo da lista de relacionados
  const relatedNews = related.filter((n) => n.id !== article.id).slice(0, 6);

  logRequest("article", 200, { ip, platform });
  return NextResponse.json({ article, related: relatedNews });
}
