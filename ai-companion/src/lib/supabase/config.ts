// Centralised Supabase env access. Keeping this in one place lets the app
// render the public/marketing pages even before Supabase is wired up, while
// still failing loudly the moment an auth feature is actually used.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const hasSupabaseEnv =
  SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

export function assertSupabaseEnv() {
  if (!hasSupabaseEnv) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
        "NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local (see .env.example).",
    );
  }
}
