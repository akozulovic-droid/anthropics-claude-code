"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { parseCompanionParameters } from "@/lib/companion/options";
import { moderateCompanionText } from "@/lib/ai/moderation";
import { generateAIGirlPrompt } from "@/lib/ai/prompt";
import { generateImage } from "@/lib/ai/image";
import { COMPANION_BUCKET } from "@/lib/storage";

export type CreateState = { error?: string };

export async function createCompanionAction(
  _prev: CreateState,
  formData: FormData,
): Promise<CreateState> {
  if (!hasSupabaseEnv) {
    return { error: "Server is not configured. Please try again later." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  // 1. Strict server-side validation.
  const parsed = parseCompanionParameters(formData);
  if (!parsed.ok) {
    return { error: parsed.error };
  }
  const params = parsed.value;

  // 2. One-time guard (also enforced atomically in the DB function).
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_girl_created")
    .eq("id", user.id)
    .single<{ ai_girl_created: boolean }>();
  if (profile?.ai_girl_created) {
    return { error: "You have already created your AI companion." };
  }

  // 3. Safety moderation on the user-supplied name + final prompt.
  const prompt = generateAIGirlPrompt(params);
  const nameCheck = await moderateCompanionText(params.name);
  if (!nameCheck.ok) return { error: nameCheck.reason };
  const promptCheck = await moderateCompanionText(prompt);
  if (!promptCheck.ok) return { error: promptCheck.reason };

  // 4. Generate the main image.
  let image;
  try {
    image = await generateImage(prompt);
  } catch {
    return {
      error: "Image generation failed. Please try again in a moment.",
    };
  }

  // 5. Upload to the user-scoped private storage path.
  const path = `${user.id}/main.${image.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(COMPANION_BUCKET)
    .upload(path, image.bytes, {
      contentType: image.contentType,
      upsert: false,
    });
  if (uploadError) {
    return {
      error: "Could not save the generated image. Please try again.",
    };
  }

  // 6. Atomic, one-time persistence (insert companion + main image +
  //    flip profile flag). Throws if a companion already exists.
  const { error: rpcError } = await supabase.rpc("create_ai_girl", {
    p_name: params.name,
    p_age: params.age,
    p_personality: params.personality,
    p_style: params.visualStyle,
    p_hair_color: params.hairColor,
    p_eye_color: params.eyeColor,
    p_body_type: null,
    p_clothing_style: params.clothingStyle,
    p_background_style: params.backgroundStyle,
    p_conversation_style: params.conversationStyle,
    p_generated_prompt: prompt,
    p_main_image_url: path,
  });

  if (rpcError) {
    // Best-effort cleanup of the orphaned upload.
    await supabase.storage.from(COMPANION_BUCKET).remove([path]);
    const alreadyExists = /already created/i.test(rpcError.message);
    return {
      error: alreadyExists
        ? "You have already created your AI companion."
        : "Could not create your companion. Please try again.",
    };
  }

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
