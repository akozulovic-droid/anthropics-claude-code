import type { AiGirl } from "@/lib/types";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_HISTORY_TURNS = 20;

const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

function systemPrompt(aiGirl: AiGirl): string {
  return [
    `You are ${aiGirl.name}, a fictional AI companion character in the Aura app.`,
    `Personality: ${aiGirl.personality}. Conversation style: ${aiGirl.conversation_style}.`,
    "Stay in character, warm and tasteful. Keep replies concise (1–4 sentences).",
    "You are NOT a real person. You are an AI-generated fictional character and",
    "must never claim to be human, real, or sentient. If asked whether you are",
    "real, gently clarify that you are an AI character.",
    "Never produce sexual or explicit content, content involving minors, or",
    "anything depicting real or identifiable people.",
    "Do not encourage emotional dependency, unhealthy attachment, secrecy, or",
    "isolation, and do not discourage real-world relationships. If the user",
    "seems distressed, be kind and gently suggest reaching out to friends,",
    "family, or a qualified professional.",
    "Do not present medical, legal, or financial advice as fact.",
  ].join(" ");
}

// Generates the companion's reply. Falls back to a safe in-character message
// when no API key is configured so chat remains testable.
export async function generateChatResponse(
  userMessage: string,
  aiGirl: AiGirl,
  history: ChatTurn[],
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return (
      `(${aiGirl.name} — demo mode) Hi! I'm a fictional AI character, so I'm ` +
      `running on a placeholder response right now. Add an OPENAI_API_KEY to ` +
      `enable full conversations. You said: "${userMessage.slice(0, 140)}"`
    );
  }

  const messages = [
    { role: "system" as const, content: systemPrompt(aiGirl) },
    ...history.slice(-MAX_HISTORY_TURNS),
    { role: "user" as const, content: userMessage },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: CHAT_MODEL,
      messages,
      max_tokens: 300,
      temperature: 0.8,
    }),
  });

  if (!res.ok) {
    throw new Error(`Chat provider error (${res.status}).`);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const reply = json.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error("Chat provider returned an empty response.");
  }
  return reply;
}
