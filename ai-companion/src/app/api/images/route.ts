import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { moderateCompanionText } from "@/lib/ai/moderation";
import { buildGalleryPrompt } from "@/lib/ai/prompt";
import { generateImage } from "@/lib/ai/image";
import {
  consumeImageCredit,
  refundImageCredit,
} from "@/lib/credits";
import { COMPANION_BUCKET, getSignedUrl } from "@/lib/storage";
import { checkRateLimit, sweepRateLimits } from "@/lib/rate-limit";
import type { AiGirl, ImageRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_PROMPT_LENGTH = 500;
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

export async function POST(request: Request) {
  if (!hasSupabaseEnv) {
    return NextResponse.json(
      { error: "Server is not configured." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  if (Math.random() < 0.05) sweepRateLimits();
  const rl = checkRateLimit(`img:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const prompt =
    typeof (body as { prompt?: unknown })?.prompt === "string"
      ? (body as { prompt: string }).prompt.trim()
      : "";

  if (!prompt) {
    return NextResponse.json(
      { error: "Describe the image you want." },
      { status: 400 },
    );
  }
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      { error: `Prompt is too long (max ${MAX_PROMPT_LENGTH}).` },
      { status: 400 },
    );
  }

  const moderation = await moderateCompanionText(prompt);
  if (!moderation.ok) {
    return NextResponse.json({ error: moderation.reason }, { status: 400 });
  }

  const { data: aiGirl } = await supabase
    .from("ai_girls")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle<AiGirl>();
  if (!aiGirl) {
    return NextResponse.json(
      { error: "Create your companion first." },
      { status: 400 },
    );
  }

  // Reserve a credit atomically BEFORE doing any expensive work.
  const credit = await consumeImageCredit(supabase);
  if (!credit) {
    return NextResponse.json(
      { error: "Could not check your credits. Try again." },
      { status: 500 },
    );
  }
  if (!credit.success) {
    return NextResponse.json(
      {
        error: "monthly_limit_reached",
        message:
          credit.limit >= 20
            ? "You've used all your image credits this month."
            : "You've used all 3 free image credits this month. Upgrade to Pro for 20 per month.",
        limit: credit.limit,
        remaining: 0,
      },
      { status: 402 },
    );
  }

  const finalPrompt = buildGalleryPrompt(aiGirl, prompt);

  let image;
  try {
    image = await generateImage(finalPrompt);
  } catch {
    await refundImageCredit(supabase);
    return NextResponse.json(
      { error: "Image generation failed. Your credit was not used." },
      { status: 502 },
    );
  }

  const path = `${user.id}/gallery/${randomUUID()}.${image.extension}`;
  const { error: uploadError } = await supabase.storage
    .from(COMPANION_BUCKET)
    .upload(path, image.bytes, {
      contentType: image.contentType,
      upsert: false,
    });
  if (uploadError) {
    await refundImageCredit(supabase);
    return NextResponse.json(
      { error: "Could not save the image. Your credit was not used." },
      { status: 500 },
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("images")
    .insert({
      user_id: user.id,
      ai_girl_id: aiGirl.id,
      image_url: path,
      prompt,
      image_type: "gallery",
    })
    .select("*")
    .single<ImageRow>();

  if (insertError || !inserted) {
    await supabase.storage.from(COMPANION_BUCKET).remove([path]);
    await refundImageCredit(supabase);
    return NextResponse.json(
      { error: "Could not save the image. Your credit was not used." },
      { status: 500 },
    );
  }

  const url = await getSignedUrl(supabase, path);

  return NextResponse.json({
    image: {
      id: inserted.id,
      url,
      prompt: inserted.prompt,
      image_type: inserted.image_type,
      created_at: inserted.created_at,
    },
    credits: {
      limit: credit.limit,
      used: credit.used,
      remaining: credit.remaining,
    },
  });
}
