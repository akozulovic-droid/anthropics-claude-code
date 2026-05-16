// Allowed values for the AI companion creation form. Using fixed option
// sets (not free text) keeps generated prompts safe and predictable.

export const PERSONALITIES = [
  "Warm & caring",
  "Playful & witty",
  "Calm & thoughtful",
  "Confident & bold",
  "Shy & sweet",
  "Adventurous",
] as const;

export const HAIR_COLORS = [
  "Black",
  "Brown",
  "Blonde",
  "Red",
  "Auburn",
  "Silver",
] as const;

export const EYE_COLORS = [
  "Brown",
  "Blue",
  "Green",
  "Hazel",
  "Gray",
] as const;

export const CLOTHING_STYLES = [
  "Elegant casual",
  "Business chic",
  "Cozy & relaxed",
  "Sporty",
  "Bohemian",
  "Classic formal",
] as const;

export const VISUAL_STYLES = [
  "Realistic portrait",
  "Cinematic",
  "Soft painterly",
  "Stylized 3D",
] as const;

export const BACKGROUND_STYLES = [
  "Cozy modern apartment",
  "Sunlit cafe",
  "City rooftop at dusk",
  "Quiet library",
  "Garden terrace",
  "Minimal studio",
] as const;

export const CONVERSATION_STYLES = [
  "Friendly & supportive",
  "Flirty & playful",
  "Intellectual & curious",
  "Chill & easygoing",
] as const;

export const MIN_AGE = 18;
export const MAX_AGE = 60;

export type CompanionParameters = {
  name: string;
  age: number;
  personality: (typeof PERSONALITIES)[number];
  hairColor: (typeof HAIR_COLORS)[number];
  eyeColor: (typeof EYE_COLORS)[number];
  clothingStyle: (typeof CLOTHING_STYLES)[number];
  visualStyle: (typeof VISUAL_STYLES)[number];
  backgroundStyle: (typeof BACKGROUND_STYLES)[number];
  conversationStyle: (typeof CONVERSATION_STYLES)[number];
};

function inSet<T extends readonly string[]>(
  set: T,
  value: unknown,
): value is T[number] {
  return typeof value === "string" && (set as readonly string[]).includes(value);
}

export type ParseResult =
  | { ok: true; value: CompanionParameters }
  | { ok: false; error: string };

// Strict server-side parsing of the raw form payload. Never trust the client.
export function parseCompanionParameters(form: FormData): ParseResult {
  const name = String(form.get("name") ?? "").trim();
  if (name.length < 2 || name.length > 40) {
    return { ok: false, error: "Name must be between 2 and 40 characters." };
  }
  if (!/^[\p{L}][\p{L}\p{M} '.-]*$/u.test(name)) {
    return { ok: false, error: "Name contains invalid characters." };
  }

  const age = Number(form.get("age"));
  if (!Number.isInteger(age) || age < MIN_AGE || age > MAX_AGE) {
    return {
      ok: false,
      error: `Age must be a whole number between ${MIN_AGE} and ${MAX_AGE}.`,
    };
  }

  const personality = form.get("personality");
  const hairColor = form.get("hairColor");
  const eyeColor = form.get("eyeColor");
  const clothingStyle = form.get("clothingStyle");
  const visualStyle = form.get("visualStyle");
  const backgroundStyle = form.get("backgroundStyle");
  const conversationStyle = form.get("conversationStyle");

  if (
    !inSet(PERSONALITIES, personality) ||
    !inSet(HAIR_COLORS, hairColor) ||
    !inSet(EYE_COLORS, eyeColor) ||
    !inSet(CLOTHING_STYLES, clothingStyle) ||
    !inSet(VISUAL_STYLES, visualStyle) ||
    !inSet(BACKGROUND_STYLES, backgroundStyle) ||
    !inSet(CONVERSATION_STYLES, conversationStyle)
  ) {
    return { ok: false, error: "Please choose a valid option for every field." };
  }

  return {
    ok: true,
    value: {
      name,
      age,
      personality,
      hairColor,
      eyeColor,
      clothingStyle,
      visualStyle,
      backgroundStyle,
      conversationStyle,
    },
  };
}
