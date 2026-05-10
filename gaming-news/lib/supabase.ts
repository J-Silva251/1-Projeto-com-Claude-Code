import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase é opcional — o site funciona sem ele via RSS direto
export const supabase = url && key ? createClient(url, key) : null;
export const isSupabaseConfigured = !!(url && key);
