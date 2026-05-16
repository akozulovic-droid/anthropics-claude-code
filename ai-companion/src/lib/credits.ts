import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "@/lib/types";

export type CreditStatus = {
  plan: Plan;
  limit: number;
  used: number;
  remaining: number;
  resetDate: string | null;
};

// Applies any due monthly reset and returns the live credit state.
export async function syncImageCredits(
  supabase: SupabaseClient,
): Promise<CreditStatus | null> {
  const { data, error } = await supabase.rpc("sync_image_credits");
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;
  const limit = row.monthly_image_limit ?? 3;
  const used = row.image_credits_used_this_month ?? 0;
  return {
    plan: (row.plan as Plan) ?? "free",
    limit,
    used,
    remaining: Math.max(0, limit - used),
    resetDate: row.credits_reset_date ?? null,
  };
}

export type ConsumeResult = {
  success: boolean;
  limit: number;
  used: number;
  remaining: number;
};

// Atomically reserves one credit. success=false means none left.
export async function consumeImageCredit(
  supabase: SupabaseClient,
): Promise<ConsumeResult | null> {
  const { data, error } = await supabase.rpc("consume_image_credit");
  const row = Array.isArray(data) ? data[0] : data;
  if (error || !row) return null;
  const limit = row.monthly_image_limit ?? 3;
  const used = row.image_credits_used_this_month ?? 0;
  return {
    success: Boolean(row.success),
    limit,
    used,
    remaining: Math.max(0, limit - used),
  };
}

export async function refundImageCredit(
  supabase: SupabaseClient,
): Promise<void> {
  await supabase.rpc("refund_image_credit");
}
