import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { isValidEmail, cleanName, cleanPlatforms, sameOrigin } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rateLimit";
import { logRequest } from "@/lib/logger";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  if (!sameOrigin(req)) {
    logRequest("subscribe", 403, { ip });
    return NextResponse.json({ error: "Origem não permitida" }, { status: 403 });
  }

  if (!rateLimit(`subscribe:${ip}`, 5, 600_000)) {
    logRequest("subscribe", 429, { ip });
    return NextResponse.json({ error: "Muitas tentativas. Tente mais tarde." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    logRequest("subscribe", 400, { ip, reason: "bad-json" });
    return NextResponse.json({ error: "Requisição inválida" }, { status: 400 });
  }

  const { name: rawName, email, platforms: rawPlatforms } =
    (body ?? {}) as { name?: unknown; email?: unknown; platforms?: unknown };

  const name = cleanName(rawName);
  if (!name || !isValidEmail(email)) {
    logRequest("subscribe", 400, { ip, reason: "invalid-input" });
    return NextResponse.json({ error: "Nome e e-mail válidos são obrigatórios" }, { status: 400 });
  }
  const platforms = cleanPlatforms(rawPlatforms);

  // Sem Supabase configurado, simula sucesso (útil para demo/portfólio)
  if (!isSupabaseConfigured || !supabase) {
    logRequest("subscribe", 200, { ip, demo: true });
    return NextResponse.json({ success: true, demo: true });
  }

  const { error } = await supabase
    .from("subscribers")
    .upsert({ name, email, platforms }, { onConflict: "email" });

  if (error) {
    logRequest("subscribe", 500, { ip });
    return NextResponse.json({ error: "Erro ao salvar cadastro" }, { status: 500 });
  }

  logRequest("subscribe", 200, { ip, platforms: platforms.length });
  return NextResponse.json({ success: true });
}
