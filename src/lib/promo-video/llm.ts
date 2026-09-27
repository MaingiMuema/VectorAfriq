/**
 * Promo Video — OpenRouter LLM layer.
 *
 *  - generateScript(): asks the selected chat model to write a structured
 *    video script (scenes, narration, copy, image requests).
 *  - generateImage(): uses OpenRouter's Image API (qwen/qwen-image-3-pro) to
 *    create custom assets when stock/platform sources come up short.
 */

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_IMAGE_URL = "https://openrouter.ai/api/v1/images";
export const IMAGE_GEN_MODEL = "qwen/qwen-image-3-pro";

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error("OPENROUTER_API_KEY is not set in environment");
  }
  return key;
}

function headers(): Record<string, string> {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    "HTTP-Referer":
      process.env.NEXT_PUBLIC_SITE_URL || "https://vectorafriqproperties.co.ke",
    "X-Title": "VectorAfriq Promo Video Studio",
  };
}

/** fetch with a hard timeout so a hung network can never stall a job forever. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export interface ScriptGenerationResult {
  script: import("./types").JobScript;
  costUsd: number;
  raw: string;
}

const SCRIPT_SYSTEM_PROMPT = `You are the creative director of a property marketplace's promotional video studio.
You write short, punchy 20–40 second promo video scripts for the VectorAfriq.co.ke brand
(a Kenyan real-estate platform: buy, rent, invest). Respond ONLY with a valid JSON object.

JSON schema:
{
  "brand": { "name": "VectorAfriq", "tagline": "<6-9 word brand tagline>", "website": "vectorafriqproperties.co.ke" },
  "design": {
    "name": "<short art-direction title, e.g. 'Bold Sunset' or 'Minimal Grid'>",
    "description": "<one sentence explaining the creative direction you chose for this brief>",
    "tone": "warm | bold | minimal | sunset | midnight",
    "background": "blobs | gradient | grid | sunburst | split",
    "energy": "calm | steady | energetic",
    "wipe": "band | slide | iris | fade | none",
    "accent": "red | sun | green | ink",
    "case": "normal | uppercase | title",
    "texture": "film | paper | clean",
    "headline": "accent-word | underline | mark | plain",
    "layout": "center | left | split",
    "scenes": { "<scene type>": { "layout": "center | left | split", "headline": "accent-word | underline | mark | plain", "size": "default | large | compact" } }
  },
  "scenes": [
    {
      "type": "intro",
      "narration": "<1 sentence, max 90 characters>"
    },
    {
      "type": "message",
      "narration": "<1 sentence, max 90 characters>",
      "kicker": "<2-4 word label, e.g. 'The problem'>",
      "headline": "<6-10 words>",
      "subline": "<optional 6-12 words>"
    },
    {
      "type": "listing",
      "narration": "<1 sentence, max 90 characters>",
      "kicker": "<2-4 word label, e.g. 'Smart search'>",
      "headline": "<4-8 words>",
      "subline": "<1-5 word accent phrase>",
      "searchQuery": "<a natural search like '3-bedroom house in Kilimani'>",
      "items": [
        { "title": "<e.g. '4 Bed Villa — Kilimani'>", "price": "<e.g. 'KSh 48,500,000'>", "imageQuery": "<descriptive English image search query for stock photo or AI image, 4-10 words>" }
      ]
    },
    {
      "type": "services",
      "narration": "<1 sentence, max 90 characters>",
      "kicker": "<2-4 word label>",
      "headline": "<4-8 words>",
      "subline": "<1-4 word accent phrase>",
      "items": [
        { "title": "<service name>", "sub": "<6-10 words>", "icon": "<single emoji>", "imageQuery": "<descriptive image search query>" }
      ]
    },
    {
      "type": "cta",
      "narration": "<1 sentence, max 90 characters>",
      "headline": "<2-5 SHOUTING words, e.g. 'STOP SCROLLING.'>",
      "subline": "<2-5 SHOUTING words>",
      "button": "<short call to action, e.g. 'Find your home →'>"
    },
    {
      "type": "outro",
      "narration": "<1 sentence, max 90 characters>"
    }
  ]
}

Rules:
- Exactly 6 to 8 scenes. The FIRST scene must be type "intro" and the LAST must be type "outro".
- Recommended order: intro, message, listing, message, services, cta, outro (7 scenes) or intro, message, listing, services, cta, outro (6 scenes).
- Every scene MUST have a narration line: one short spoken sentence (max 90 characters) — it will be read aloud by a voice-over.
- "listing" scenes: exactly 2-3 items. Prices in KSh (Kenyan Shillings) with commas. Use real Nairobi-area neighbourhoods (Kilimani, Westlands, Karen, Lavington, Kileleshwa, South B, Thika Road, Syokimau, Mombasa, Kisumu, Eldoret).
- "services" scenes: exactly 4 items; pick from: Valuation, Mortgages, Legal, Moving, Interior Design, Property Management, Short-stay Rentals, Land Buying.
- "message" scenes: 0-2 of them, used for problem/solution beats. Keep headlines short.
- imageQuery: plain English phrases describing a photo (e.g. "modern luxury villa exterior nairobi", "bright apartment interior with wooden floors", "happy family moving boxes into new home"). No brand names, no trademarked terms.
- Keep everything tasteful, warm and aspirational — matches a premium property brand.
- Website must be "vectorafriqproperties.co.ke".

Design rules — this is what makes each video feel bespoke instead of a default template:
- Choose a DISTINCT art direction that fits the brief (bold campaign → bold tone + energetic motion; quiet premium launch → minimal or warm + calm; aspirational summer push → sunset; dramatic reveal → midnight). Two different prompts should never look the same.
- NEVER invent colors or hex codes. The renderer builds every color from the fixed brand palette: cream #f6efe3, deep cream #ecdfcc, ink #241a0f, brand red #e6374f, amber sun #f2a03d, sage green #2f9e77. You only pick roles:
  - tone = surface mood (warm: cream; bold: white; minimal: clean cream + monochrome; sunset: amber-dominant; midnight: dark ink with cream text)
  - accent = which brand color leads buttons, chips, glows and rules (red, sun, green, or ink)
- background: the scene backdrop treatment (blobs, gradient, grid, sunburst, split).
- energy: animation speed and fade timing (calm, steady, energetic).
- wipe: how scenes transition (band, slide, iris, fade, none).
- headline: how display headlines are emphasized (accent-word, underline, mark, plain).
- layout: the default scene composition (center, left, split).
- scenes: optional per-scene overrides keyed by scene type ("message", "listing", "services") — only include a scene when it should break from the global direction.
- Match headline/case choices to the tone (e.g. uppercase shouting headlines for bold/midnight, quieter normal case for minimal/warm).
- Vary tone + accent + background combinations so every video is visibly different.`;

const FALLBACK_SCRIPT = {
  brand: {
    name: "VectorAfriq",
    tagline: "Your home. Your future.",
    website: "vectorafriqproperties.co.ke",
  },
  design: {
    name: "Warm Editorial",
    description: "Cream paper, serif display type and the signature brand-red accent — the classic VectorAfriq look.",
    tone: "warm",
    background: "blobs",
    energy: "steady",
    wipe: "band",
    accent: "red",
    case: "normal",
    texture: "film",
    headline: "accent-word",
    layout: "center",
  },
  scenes: [
    {
      type: "intro",
      narration: "Finding your home in Kenya shouldn't feel like a full-time job.",
    },
    {
      type: "message",
      narration: "Endless scrolling and listings that don't match the photos.",
      kicker: "The problem",
      headline: "Searching for a home shouldn't be this hard.",
      subline: "Thousands of homes, zero clarity.",
    },
    {
      type: "listing",
      narration: "Filter by neighbourhood, budget and bedrooms. Find your match in seconds.",
      kicker: "Smart search",
      headline: "Filter like a pro.",
      subline: "Find your match.",
      searchQuery: "3-bedroom house in Kilimani",
      items: [
        { title: "4 Bed Villa — Kilimani", price: "KSh 48,500,000", imageQuery: "luxury villa exterior modern nairobi" },
        { title: "3 Bed Apartment — Westlands", price: "KSh 26,000,000", imageQuery: "modern apartment building exterior" },
        { title: "5 Bed Mansion — Karen", price: "KSh 92,000,000", imageQuery: "elegant mansion garden estate" },
      ],
    },
    {
      type: "services",
      narration: "Valuations, mortgages, legal support, even moving day.",
      kicker: "Beyond the listing",
      headline: "The whole journey.",
      subline: "One platform.",
      items: [
        { title: "Valuation", sub: "Know your property's true worth", icon: "🏠", imageQuery: "modern home exterior" },
        { title: "Mortgages", sub: "Financing that fits your budget", icon: "🏦", imageQuery: "modern bank building" },
        { title: "Legal", sub: "Verified title checks & conveyancing", icon: "⚖️", imageQuery: "lawyer desk documents" },
        { title: "Moving", sub: "We help you settle in smoothly", icon: "🚚", imageQuery: "moving boxes new home" },
      ],
    },
    {
      type: "cta",
      narration: "So stop scrolling. Start living.",
      headline: "STOP SCROLLING.",
      subline: "START LIVING.",
      button: "Find your home →",
    },
    {
      type: "outro",
      narration: "VectorAfriq. Your home. Your future.",
    },
  ],
} as const;

const DESIGN_TONES = new Set(["warm", "bold", "minimal", "sunset", "midnight"]);
const DESIGN_BACKGROUNDS = new Set(["blobs", "gradient", "grid", "sunburst", "split"]);
const DESIGN_ENERGIES = new Set(["calm", "steady", "energetic"]);
const DESIGN_WIPES = new Set(["band", "slide", "iris", "fade", "none"]);
const DESIGN_ACCENTS = new Set(["red", "sun", "green", "ink"]);
const DESIGN_CASES = new Set(["normal", "uppercase", "title"]);
const DESIGN_TEXTURES = new Set(["film", "paper", "clean"]);
const DESIGN_HEADLINES = new Set(["accent-word", "underline", "mark", "plain"]);
const DESIGN_LAYOUTS = new Set(["center", "left", "split"]);
const DESIGN_SIZES = new Set(["default", "large", "compact"]);

/**
 * Normalize + validate the AI-authored design direction. Unknown or missing
 * values fall back to the classic Warm Editorial defaults so a stray token
 * can never break (or miscolor) a render.
 */
function normalizeDesign(raw: unknown): import("./types").JobDesign {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pick = <T,>(value: unknown, allowed: Set<string>, fallback: T): T =>
    typeof value === "string" && allowed.has(value) ? (value as T) : fallback;

  const scenes: Record<string, import("./types").JobSceneDesign> = {};
  const scenesRaw = d.scenes;
  if (scenesRaw && typeof scenesRaw === "object" && !Array.isArray(scenesRaw)) {
    for (const [key, value] of Object.entries(scenesRaw)) {
      if (!value || typeof value !== "object" || Array.isArray(value)) continue;
      const o = value as Record<string, unknown>;
      const entry: import("./types").JobSceneDesign = {
        layout: pick(o.layout, DESIGN_LAYOUTS, undefined),
        headline: pick(o.headline, DESIGN_HEADLINES, undefined),
        size: pick(o.size, DESIGN_SIZES, undefined),
      };
      scenes[key] = entry;
    }
  }

  return {
    name:
      typeof d.name === "string" && d.name.trim()
        ? d.name.trim().slice(0, 60)
        : "Warm Editorial",
    description:
      typeof d.description === "string" && d.description.trim()
        ? d.description.trim().slice(0, 220)
        : undefined,
    tone: pick(d.tone, DESIGN_TONES, "warm"),
    background: pick(d.background, DESIGN_BACKGROUNDS, "blobs"),
    energy: pick(d.energy, DESIGN_ENERGIES, "steady"),
    wipe: pick(d.wipe, DESIGN_WIPES, "band"),
    accent: pick(d.accent, DESIGN_ACCENTS, "red"),
    case: pick(d.case, DESIGN_CASES, "normal"),
    texture: pick(d.texture, DESIGN_TEXTURES, "film"),
    headline: pick(d.headline, DESIGN_HEADLINES, "accent-word"),
    layout: pick(d.layout, DESIGN_LAYOUTS, "center"),
    ...(Object.keys(scenes).length > 0 ? { scenes } : {}),
  };
}

/** Normalize + validate a raw script from the LLM. Throws on structural errors. */
function normalizeScript(raw: unknown): import("./types").JobScript {
  const obj = raw as { brand?: unknown; design?: unknown; scenes?: unknown };
  if (!obj || typeof obj !== "object") throw new Error("Script is not an object");
  const design = normalizeDesign(obj.design);

  const brandRaw = obj.brand as { name?: unknown; tagline?: unknown; website?: unknown } | undefined;
  const brand = {
    name:
      typeof brandRaw?.name === "string" && brandRaw.name.trim()
        ? brandRaw.name.trim().slice(0, 40)
        : "VectorAfriq",
    tagline:
      typeof brandRaw?.tagline === "string" && brandRaw.tagline.trim()
        ? brandRaw.tagline.trim().slice(0, 90)
        : "Your home. Your future.",
    website:
      typeof brandRaw?.website === "string" && brandRaw.website.trim()
        ? brandRaw.website.trim().slice(0, 60)
        : "vectorafriqproperties.co.ke",
  };

  if (!Array.isArray(obj.scenes) || obj.scenes.length < 2) {
    throw new Error("Script must contain at least 2 scenes");
  }

  const VALID_TYPES = new Set(["intro", "message", "listing", "services", "cta", "outro"]);
  const MAX_SCENES = 8;

  const scenes = obj.scenes
    .slice(0, MAX_SCENES)
    .map((sRaw, i) => {
      const s = sRaw as Record<string, unknown>;
      const type = String(s.type || "message");
      const scene: import("./types").JobScene = {
        type: VALID_TYPES.has(type) ? (type as import("./types").JobScene["type"]) : "message",
        narration:
          typeof s.narration === "string" && s.narration.trim()
            ? s.narration.trim().slice(0, 110)
            : undefined,
        kicker:
          typeof s.kicker === "string" && s.kicker.trim() ? s.kicker.trim().slice(0, 40) : undefined,
        headline:
          typeof s.headline === "string" && s.headline.trim()
            ? s.headline.trim().slice(0, 90)
            : undefined,
        subline:
          typeof s.subline === "string" && s.subline.trim()
            ? s.subline.trim().slice(0, 90)
            : undefined,
        searchQuery:
          typeof s.searchQuery === "string" && s.searchQuery.trim()
            ? s.searchQuery.trim().slice(0, 60)
            : undefined,
        button:
          typeof s.button === "string" && s.button.trim() ? s.button.trim().slice(0, 30) : undefined,
      };

      if (scene.type === "listing") {
        const items = Array.isArray(s.items) ? s.items.slice(0, 3) : [];
        scene.items = items.map((itRaw, j) => {
          const it = itRaw as Record<string, unknown>;
          return {
            title: String(it.title || `Listing ${j + 1}`).slice(0, 40),
            price: typeof it.price === "string" ? it.price.slice(0, 20) : undefined,
            imageQuery:
              typeof it.imageQuery === "string" && it.imageQuery.trim()
                ? it.imageQuery.trim().slice(0, 120)
                : undefined,
          };
        });
        if (scene.items.length === 0) {
          scene.items = [{ title: "Featured listing", imageQuery: "beautiful home" }];
        }
      }

      if (scene.type === "services") {
        const items = Array.isArray(s.items) ? s.items.slice(0, 4) : [];
        scene.items = items.map((itRaw, j) => {
          const it = itRaw as Record<string, unknown>;
          return {
            title: String(it.title || `Service ${j + 1}`).slice(0, 30),
            sub: String(it.sub || "").slice(0, 60),
            icon: typeof it.icon === "string" ? it.icon.slice(0, 4) : undefined,
            imageQuery:
              typeof it.imageQuery === "string" && it.imageQuery.trim()
                ? it.imageQuery.trim().slice(0, 120)
                : undefined,
          };
        });
        if (scene.items.length === 0) {
          scene.items = [
            { title: "Valuation", sub: "Know your property's worth", icon: "🏠", imageQuery: "modern home" },
            { title: "Mortgages", sub: "Financing that fits", icon: "🏦", imageQuery: "modern building" },
          ];
        }
      }

      // Every scene must be narratable — derive a default from the copy if missing.
      if (!scene.narration) {
        scene.narration =
          scene.headline ||
          (scene.items && "title" in scene.items[0] ? scene.items[0].title : undefined) ||
          "Welcome to VectorAfriq.";
      }
      return scene;
    });

  // Force first = intro, last = outro so the composition always opens/closes
  // well. Trim to 7 scenes FIRST so the forced bookends always survive, and
  // give the intro its own narration (never reuse scene 1's — that would speak
  // the same line twice).
  let working = scenes.slice(0, 7);
  if (working[0].type !== "intro") {
    working.unshift({
      type: "intro",
      narration: `Welcome to ${brand.name}.`,
    });
  }
  if (working[working.length - 1].type !== "outro") {
    working.push({
      type: "outro",
      narration: `${brand.name}. ${brand.tagline}`,
    });
  }

  return { brand, design, scenes: working };
}

/**
 * Ask the selected model to write the promo video script.
 * Falls back to the curated default script when the LLM output is unusable.
 */
export async function generateScript(
  prompt: string,
  model: string
): Promise<ScriptGenerationResult> {
  const userPrompt = `Write a promotional video script for this brief:

"${prompt.slice(0, 2000)}"

Remember: short narration lines (max 90 characters each), 6-8 scenes, first scene intro, last scene outro, Kenyan flavour, premium and aspirational tone.

Also pick a DISTINCT design direction in the "design" field that matches the brief's mood (tone, background, energy, wipe, accent, headline treatment, layout). Stay strictly within the palette roles — never invent colors. Make this video look different from any generic template.`;

  const body = {
    model,
    messages: [
      { role: "system", content: SCRIPT_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4096,
    response_format: { type: "json_object" },
  };

  const response = await fetchWithTimeout(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  }, 90_000);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter chat error ${response.status}: ${errorText.substring(0, 300)}`
    );
  }

  const data = await response.json();
  const content: string = data.choices?.[0]?.message?.content || "";
  const usage = data.usage || { prompt_tokens: 0, completion_tokens: 0 };
  const costUsd = Number(data.usage?.cost ?? 0) || 0;

  let script: import("./types").JobScript | null = null;
  try {
    const parsed = JSON.parse(content.trim());
    script = normalizeScript(parsed);
  } catch (err) {
    console.warn("[PromoVideo] LLM script parse failed, retrying once:", err);
    try {
      const retry = await fetchWithTimeout(OPENROUTER_CHAT_URL, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          ...body,
          temperature: 0.4,
          max_tokens: 4096,
        }),
      }, 90_000);
      const retryData = await retry.json();
      const retryContent: string = retryData.choices?.[0]?.message?.content || "";
      const retryParsed = JSON.parse(retryContent.trim());
      script = normalizeScript(retryParsed);
    } catch (retryErr) {
      console.error("[PromoVideo] LLM script retry failed, using fallback:", retryErr);
      script = JSON.parse(JSON.stringify(FALLBACK_SCRIPT)) as import("./types").JobScript;
    }
  }

  return {
    script,
    costUsd,
    raw: content,
  };
}

/**
 * Generate a custom asset with OpenRouter's Image API (qwen/qwen-image-3-pro).
 * Returns PNG/JPEG/WebP bytes. Throws on failure so callers can fall back.
 */
export async function generateImage(
  prompt: string,
  aspectRatio: "16:9" | "9:16" = "16:9"
): Promise<{ buffer: Buffer; mediaType: string; costUsd: number }> {
  const body = {
    model: IMAGE_GEN_MODEL,
    prompt: prompt.slice(0, 1000),
    n: 1,
    resolution: "1K",
    aspect_ratio: aspectRatio,
    quality: "medium",
  };

  const response = await fetchWithTimeout(OPENROUTER_IMAGE_URL, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  }, 150_000);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `OpenRouter image error ${response.status}: ${errorText.substring(0, 300)}`
    );
  }

  const data = await response.json();
  const item = data?.data?.[0];
  if (!item || typeof item.b64_json !== "string") {
    throw new Error("OpenRouter image API returned no image data");
  }

  const mediaType: string = item.media_type || "image/png";
  return {
    buffer: Buffer.from(item.b64_json, "base64"),
    mediaType,
    costUsd: Number(data?.usage?.cost ?? 0) || 0,
  };
}
