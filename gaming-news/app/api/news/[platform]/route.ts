import { NextRequest, NextResponse } from "next/server";
import { fetchPlatformNews, fetchAllNews } from "@/lib/newsParser";
import type { Platform } from "@/types";

const VALID: Platform[] = ["pc", "xbox", "nintendo", "playstation", "mobile"];

// Sem cache estático — locale varia por request e precisa de resposta correta por idioma
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { platform: string } }) {
  const { platform } = params;
  const locale = req.nextUrl.searchParams.get("locale") ?? "pt";

  try {
    const news =
      platform === "all"
        ? await fetchAllNews(locale)
        : VALID.includes(platform as Platform)
        ? await fetchPlatformNews(platform as Platform, locale)
        : null;

    if (!news) return NextResponse.json({ error: "Plataforma inválida" }, { status: 400 });
    return NextResponse.json({ news, updatedAt: new Date().toISOString() });
  } catch {
    return NextResponse.json({ error: "Falha ao buscar notícias" }, { status: 500 });
  }
}
