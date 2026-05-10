import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, platforms } = body;

  if (!name || !email) {
    return NextResponse.json({ error: "Nome e e-mail são obrigatórios" }, { status: 400 });
  }

  // Sem Supabase configurado, simula sucesso (útil para demo/portfólio)
  if (!isSupabaseConfigured || !supabase) {
    return NextResponse.json({ success: true, demo: true });
  }

  const { error } = await supabase
    .from("subscribers")
    .upsert({ name, email, platforms: platforms ?? [] }, { onConflict: "email" });

  if (error) {
    return NextResponse.json({ error: "Erro ao salvar cadastro" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
