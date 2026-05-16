import type { SupabaseClient } from "@supabase/supabase-js";

export const COMPANION_BUCKET = "companion-images";

// The bucket is private; resolve storage paths to short-lived signed URLs.
export async function getSignedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn = 3600,
): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(COMPANION_BUCKET)
    .createSignedUrl(path, expiresIn);
  if (error || !data) return null;
  return data.signedUrl;
}
