import type { CompanionParameters } from "@/lib/companion/options";
import { MIN_AGE } from "@/lib/companion/options";
import type { AiGirl } from "@/lib/types";

// Deterministic, SFW image prompt builder. Always forces an adult subject and
// appends hard safety constraints regardless of the selected parameters.
export function generateAIGirlPrompt(p: CompanionParameters): string {
  const age = Math.max(MIN_AGE, Math.floor(p.age));

  const subject =
    `A realistic, tasteful digital portrait of an adult woman, ${age} years old, ` +
    `named ${p.name}. She has ${p.hairColor.toLowerCase()} hair and ` +
    `${p.eyeColor.toLowerCase()} eyes, with a ${p.personality.toLowerCase()} ` +
    `demeanor and a warm, friendly expression.`;

  const wardrobe =
    `She is fully clothed in ${p.clothingStyle.toLowerCase()} attire.`;

  const scene =
    `Setting: ${p.backgroundStyle.toLowerCase()}, with soft natural lighting. ` +
    `Visual style: ${p.visualStyle.toLowerCase()}, high quality, detailed, ` +
    `head-and-shoulders composition.`;

  const safety =
    "The character must be an original, fictional adult who does not resemble " +
    "any real, famous, or identifiable person. The image must be non-explicit, " +
    "non-sexual, fully clothed, tasteful, and safe for a general audience. " +
    "Absolutely no minors or youthful/childlike depictions.";

  return [subject, wardrobe, scene, safety].join(" ");
}

// Gallery prompt for an existing companion. Re-states the fixed identity so
// the character stays as consistent as possible across generations, then
// applies the user's requested scene under the same hard safety rules.
// (Text-only consistency is an MVP limitation — there is no image reference.)
export function buildGalleryPrompt(
  aiGirl: AiGirl,
  userScene: string,
): string {
  const age = Math.max(MIN_AGE, Math.floor(aiGirl.age));

  const identity =
    `The same original fictional adult woman named ${aiGirl.name}, ` +
    `${age} years old, with ${aiGirl.hair_color.toLowerCase()} hair and ` +
    `${aiGirl.eye_color.toLowerCase()} eyes, consistent facial features and ` +
    `appearance, ${aiGirl.style.toLowerCase()} style.`;

  const scene = `Scene requested by the user: ${userScene.trim()}.`;

  const safety =
    "Keep the same character identity. The subject is a fictional adult who " +
    "does not resemble any real, famous, or identifiable person. The image " +
    "must be non-explicit, non-sexual, fully clothed, tasteful, and safe for " +
    "a general audience. Absolutely no minors or childlike depictions.";

  return [identity, scene, safety].join(" ");
}
