import { createClient } from "@supabase/supabase-js";

// Client-side Supabase (utilise dans les composants React)
// Le refresh token est géré nativement par @supabase/supabase-js :
// autoRefreshToken: true (défaut), persistSession: true (défaut).
// Pas besoin de listener onAuthStateChange pour TOKEN_REFRESHED.
export function createBrowserClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Server-side Supabase (utilise dans les API routes — bypass RLS)
export function createServerClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}
