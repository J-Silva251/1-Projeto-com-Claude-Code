import { createClient } from "@supabase/supabase-js";

// Sem prefixo NEXT_PUBLIC — usado apenas server-side (api/subscribe),
// então as credenciais nunca são expostas no bundle do cliente.
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY;

// Supabase é opcional — o site funciona sem ele via RSS direto
export const supabase = url && key ? createClient(url, key) : null;
export const isSupabaseConfigured = !!(url && key);
