import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { moderateCompanionText } from "@/lib/ai/moderation";
import {
  generateChatResponse,
  MAX_MESSAGE_LENGTH,
  MAX_HISTORY_TURNS,
  type ChatTurn,
} from "@/lib/ai/chat";
import { checkRateLimit, sweepRateLimits } from "@/lib/rate-limit";
import type { AiGirl, ChatMessageRow } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Basic abuse brake: 20 messages / 60s per user.
const RATE_LIMIT = 20;
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
  const rl = checkRateLimit(`chat:${user.id}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "You're sending messages too fast. Please slow down." },
      {
        status: 429,
        headers: { "Retry-After": String(rl.retryAfterSeconds) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const message =
    typeof (body as { message?: unknown })?.message === "string"
      ? (body as { message: string }).message.trim()
      : "";

  if (!message) {
    return NextResponse.json(
      { error: "Message cannot be empty." },
      { status: 400 },
    );
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message is too long (max ${MAX_MESSAGE_LENGTH}).` },
      { status: 400 },
    );
  }

  const moderation = await moderateCompanionText(message);
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

  // Load recent history BEFORE persisting, so a provider failure leaves
  // nothing half-saved.
  const { data: historyRows } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY_TURNS);

  const history: ChatTurn[] = (historyRows ?? [])
    .reverse()
    .map((r) => ({
      role: r.role as ChatTurn["role"],
      content: r.content as string,
    }));

  let reply: string;
  try {
    reply = await generateChatResponse(message, aiGirl, history);
  } catch {
    return NextResponse.json(
      { error: "Your companion is unavailable right now. Try again." },
      { status: 502 },
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from("chat_messages")
    .insert([
      { user_id: user.id, ai_girl_id: aiGirl.id, role: "user", content: message },
      {
        user_id: user.id,
        ai_girl_id: aiGirl.id,
        role: "assistant",
        content: reply,
      },
    ])
    .select("*");

  if (insertError || !inserted) {
    return NextResponse.json(
      { error: "Could not save the conversation." },
      { status: 500 },
    );
  }

  const assistant = (inserted as ChatMessageRow[]).find(
    (m) => m.role === "assistant",
  );

  return NextResponse.json({ reply: assistant });
}
