// Generates free TTS narration using edge-tts (Microsoft Edge neural voices).
// Usage: node scripts/gen-tts.mjs
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT_DIR = join(ROOT, "assets", "narration");
mkdirSync(OUT_DIR, { recursive: true });

// Voice: warm, clear British-English female — well suited to the Kenyan market.
const VOICE = process.env.PF_VOICE || "en-GB-SoniaNeural";
const RATE = process.env.PF_RATE || "+2%";
const PITCH = process.env.PF_PITCH || "+0Hz";

const LINES = {
  hook: "Finding your home in Kenya shouldn't feel like a full-time job.",
  problem:
    "Endless scrolling. Conflicting listings. And that sinking feeling, when what you see online, isn't what you get.",
  solution:
    "Meet VectorAfriq. Kenya's smartest way to buy, rent, and invest. Thousands of verified homes, all in one place.",
  search:
    "Search by neighbourhood, budget, and bedrooms. Find exactly what you want, in seconds.",
  ai: "Not sure where to start? Just describe it, and our AI finds your perfect match.",
  services:
    "Valuations. Mortgages. Legal support. Even moving day. We cover the whole journey.",
  cta: "So stop scrolling. Start living. Find your next home on VectorAfriq today.",
  outro: "VectorAfriq. Your home. Your future.",
};

let failed = false;
for (const [name, text] of Object.entries(LINES)) {
  const out = join(OUT_DIR, `${name}.mp3`);
  console.log(`[tts] ${name} -> ${out}`);
  try {
    execFileSync(
      "edge-tts",
      [
        "--voice", VOICE,
        `--rate=${RATE}`,
        `--pitch=${PITCH}`,
        "--text", text,
        "--write-media", out,
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    const size = existsSync(out) ? `${(sizeOf(out) / 1024).toFixed(1)} KB` : "MISSING";
    console.log(`  ok (${size})`);
  } catch (err) {
    failed = true;
    const detail = err.stderr ? err.stderr.toString() : String(err.message);
    console.error(`  FAILED: ${detail.slice(0, 500)}`);
  }
}

function sizeOf(p) {
  return statSync(p).size;
}

if (failed) process.exit(1);
console.log(`\nDone. Voice: ${VOICE} rate:${RATE} pitch:${PITCH}`);
