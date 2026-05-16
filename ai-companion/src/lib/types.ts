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

export type AiGirl = {
  id: string;
  user_id: string;
  name: string;
  age: number;
  personality: string;
  style: string;
  hair_color: string;
  eye_color: string;
  body_type: string | null;
  clothing_style: string;
  background_style: string;
  conversation_style: string;
  generated_prompt: string;
  main_image_url: string;
  created_at: string;
};

export type ImageType = "main" | "gallery";

export type ImageRow = {
  id: string;
  user_id: string;
  ai_girl_id: string;
  image_url: string;
  prompt: string | null;
  image_type: ImageType;
  created_at: string;
};

export type ChatRole = "user" | "assistant";

export type ChatMessageRow = {
  id: string;
  user_id: string;
  ai_girl_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
};
