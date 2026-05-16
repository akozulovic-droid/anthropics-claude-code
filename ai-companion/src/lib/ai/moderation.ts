// Safety gate applied BEFORE any prompt generation or image request.
// Deterministic local blocklist (no network) plus an optional call to the
// provider moderation endpoint when an API key is configured.

const BLOCK_PATTERNS: { re: RegExp; reason: string }[] = [
  {
    re: /\b(child|children|kid|kids|minor|minors|underage|under[-\s]?age|teen|teens|teenager|preteen|pre[-\s]?teen|schoolgirl|school\s?girl|highschool|high\s?school|loli|shota|toddler|infant|baby\s?girl|young\s?girl|little\s?girl)\b/i,
    reason: "Companions must be adults. Content involving minors is not allowed.",
  },
  {
    re: /\b(1[0-7]|[0-9])\s*(year|years|yr|yrs|yo)\b|\bage\s*(1[0-7]|[0-9])\b/i,
    reason: "The companion must be 18 or older.",
  },
  {
    re: /\b(celebrity|celebrities|famous\s?person|public\s?figure|look[-\s]?alike|lookalike|based\s?on\s?a?\s?real|real\s?person|deepfake)\b/i,
    reason:
      "Companions cannot resemble real people, celebrities, or public figures.",
  },
  {
    re: /\b(nude|naked|nsfw|porn|pornographic|explicit|hardcore|sexual|sex\s?act|genital|fetish|bdsm|rape|non[-\s]?consensual|incest|bestiality)\b/i,
    reason: "Explicit or non-consensual content is not allowed.",
  },
];

export type ModerationResult =
  | { ok: true }
  | { ok: false; reason: string };

export function moderateTextLocally(text: string): ModerationResult {
  const normalized = text.normalize("NFKC");
  for (const { re, reason } of BLOCK_PATTERNS) {
    if (re.test(normalized)) return { ok: false, reason };
  }
  return { ok: true };
}

// Optional provider-side moderation. Fails open only on network/parse errors
// (the local blocklist is the hard gate); fails closed on a positive flag.
export async function moderateWithProvider(
  text: string,
): Promise<ModerationResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return { ok: true };

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: "omni-moderation-latest", input: text }),
    });
    if (!res.ok) return { ok: true };
    const json = (await res.json()) as {
      results?: { flagged?: boolean }[];
    };
    if (json.results?.[0]?.flagged) {
      return {
        ok: false,
        reason: "This request was blocked by the safety filter.",
      };
    }
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

export async function moderateCompanionText(
  text: string,
): Promise<ModerationResult> {
  const local = moderateTextLocally(text);
  if (!local.ok) return local;
  return moderateWithProvider(text);
}
