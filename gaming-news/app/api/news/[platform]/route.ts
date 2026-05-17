import { NextRequest, NextResponse } from "next/server";
import { fetchPlatformNews, fetchAllNews } from "@/lib/newsParser";
import { safeLocale } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { logRequest } from "@/lib/logger";
import type { Platform } from "@/types";

const VALID: Platform[] = ["pc", "xbox", "nintendo", "playstation", "mobile"];

// Sem cache estático — locale varia por request e precisa de resposta correta por idioma
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  const ip = clientIp(req);

  if (!rateLimit(`news:${ip}`, 60, 60_000)) {
    logRequest("news", 429, { ip });
    return NextResponse.json({ error: "Muitas requisições." }, { status: 429 });
  }

  const { platform } = params;
  const locale = safeLocale(req.nextUrl.searchParams.get("locale"));

  try {
    const news =
      platform === "all"
        ? await fetchAllNews(locale)
        : VALID.includes(platform as Platform)
        ? await fetchPlatformNews(platform as Platform, locale)
        : null;

    if (!news) {
      logRequest("news", 400, { ip, platform });
      return NextResponse.json({ error: "Plataforma inválida" }, { status: 400 });
    }
    logRequest("news", 200, { ip, platform });
    return NextResponse.json({ news, updatedAt: new Date().toISOString() });
  } catch {
    logRequest("news", 500, { ip, platform });
    return NextResponse.json({ error: "Falha ao buscar notícias" }, { status: 500 });
  }
}
