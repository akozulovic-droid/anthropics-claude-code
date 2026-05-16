import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  hasServiceRole,
} from "./config";

// Service-role client. Bypasses RLS — use ONLY in trusted server contexts
// with no user session (e.g. verified Stripe webhooks). Never import this
// from a Client Component.
export function createAdminClient() {
  if (!hasServiceRole) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not configured (see .env.example).",
    );
  }
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
