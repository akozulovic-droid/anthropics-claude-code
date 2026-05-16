export type Plan = "free" | "pro";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: Plan;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  monthly_image_limit: number;
  image_credits_used_this_month: number;
  credits_reset_date: string | null;
  ai_girl_created: boolean;
  created_at: string;
  updated_at: string;
};
