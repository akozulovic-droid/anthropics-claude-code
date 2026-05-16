// Image generation. Uses the OpenAI Images API when OPENAI_API_KEY is set,
// otherwise falls back to a deterministic local SVG so the full creation
// flow remains testable without a paid API key (documented in the README).

export type GeneratedImage = {
  bytes: Buffer;
  contentType: string;
  extension: "png" | "svg";
};

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";

export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return placeholderImage(prompt);
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      size: "1024x1024",
      n: 1,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      `Image provider error (${res.status}). ${detail.slice(0, 200)}`,
    );
  }

  const json = (await res.json()) as {
    data?: { b64_json?: string; url?: string }[];
  };

  const b64 = json.data?.[0]?.b64_json;
  if (b64) {
    return {
      bytes: Buffer.from(b64, "base64"),
      contentType: "image/png",
      extension: "png",
    };
  }

  const url = json.data?.[0]?.url;
  if (url) {
    const img = await fetch(url);
    const buf = Buffer.from(await img.arrayBuffer());
    return { bytes: buf, contentType: "image/png", extension: "png" };
  }

  throw new Error("Image provider returned no image data.");
}

// Stable pseudo-random gradient avatar derived from the prompt text.
function placeholderImage(seed: string): GeneratedImage {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  }
  const hue = h % 360;
  const initial = (seed.match(/named\s+(\p{L})/u)?.[1] ?? "A").toUpperCase();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(${hue} 70% 55%)"/>
      <stop offset="100%" stop-color="hsl(${(hue + 60) % 360} 70% 45%)"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#g)"/>
  <circle cx="512" cy="420" r="190" fill="rgba(255,255,255,0.18)"/>
  <text x="512" y="500" font-family="system-ui, sans-serif" font-size="220" font-weight="700" fill="#fff" text-anchor="middle">${initial}</text>
  <text x="512" y="760" font-family="system-ui, sans-serif" font-size="40" fill="rgba(255,255,255,0.85)" text-anchor="middle">AI-generated placeholder</text>
</svg>`;

  return {
    bytes: Buffer.from(svg, "utf8"),
    contentType: "image/svg+xml",
    extension: "svg",
  };
}
