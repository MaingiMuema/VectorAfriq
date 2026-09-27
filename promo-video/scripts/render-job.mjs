#!/usr/bin/env node
/**
 * Renders a scripted promo video for the admin promo-video pipeline.
 *
 * The Next.js worker (src/lib/promo-video/worker.ts) prepares a job directory
 * containing:
 *   script.json   — the JobScript (scenes + brand, items already resolved to
 *                   image filenames under assets/images/resolved/*)
 *   assets/images — bundled image assets (logo.png + resolved images)
 *
 * This script:
 *   1. Synthesizes TTS narration for every scene (npm edge-tts, no API key)
 *   2. Measures durations with ffprobe and lays out the scene schedule
 *   3. Synthesizes a music bed sized to the narration (pure Node)
 *   4. Bundles the Remotion composition with the job dir as the public dir
 *   5. Renders h264 mp4 for the requested format(s)
 *   6. Writes result.json + progress lines for the parent worker
 *
 * Usage:
 *   node scripts/render-job.mjs --jobDir <dir> [--format landscape|vertical|both] [--voice en-GB-SoniaNeural]
 *
 * Progress is reported on stdout as tab-separated lines:
 *   PROMO_JOB_PROGRESS\t<stage>\t<pct 0-100>\t<message>
 *   PROMO_JOB_LOG\t<message>
 *   PROMO_JOB_DONE\t<json>
 *   PROMO_JOB_ERROR\t<message>
 */
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import { synthesizeMusic } from "./lib/music.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FPS = 30;

// ─── args ─────────────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, "");
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "";
    args[key] = value;
  }
  return args;
}

const args = parseArgs(process.argv.slice(2));
const jobDir = args.jobDir;
const formats = args.format === "both" ? ["landscape", "vertical"] : [args.format || "landscape"];
const voice = args.voice || "en-GB-SoniaNeural";

if (!jobDir) {
  console.error("PROMO_JOB_ERROR\tMissing --jobDir");
  process.exit(1);
}

const assetsDir = join(jobDir, "assets");
const imagesDir = join(assetsDir, "images");
mkdirSync(imagesDir, { recursive: true });
mkdirSync(join(assetsDir, "narration"), { recursive: true });

const progress = (stage, pct, message = "") =>
  console.log(`PROMO_JOB_PROGRESS\t${stage}\t${Math.round(pct)}\t${message}`);
const log = (message) => console.log(`PROMO_JOB_LOG\t${message}`);

const GAP_AFTER = {
  intro: 0.6,
  message: 0.5,
  listing: 0.5,
  services: 0.5,
  cta: 0.7,
  outro: 4.5,
};

/**
 * Locate the edge-tts CLI. Preference order:
 *   1. EDGE_TTS_BIN env var
 *   2. promo-video/.tts-venv/bin/edge-tts (Python venv created by npm run tts:setup)
 *   3. edge-tts on PATH
 */
function resolveTtsBin() {
  if (process.env.EDGE_TTS_BIN) return process.env.EDGE_TTS_BIN;
  const venv = join(ROOT, ".tts-venv", "bin", "edge-tts");
  if (existsSync(venv)) return venv;
  return "edge-tts";
}

async function synthesizeLine(bin, text, out) {
  try {
    execFileSync(
      bin,
      [
        "--text", text,
        "--voice", voice,
        `--rate=+2%`,
        `--pitch=+0Hz`,
        "--write-media", out,
      ],
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    return true;
  } catch (err) {
    log(`TTS failed for "${text.slice(0, 40)}…": ${err.stderr ? err.stderr.toString().slice(0, 200) : err.message}`);
    return false;
  }
}

async function probeDuration(filePath) {
  const out = execFileSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf8" }
  ).trim();
  const n = Number(out);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`ffprobe returned invalid duration for ${filePath}`);
  return n;
}

// ─── 0. copy bundled default images (logo + fallbacks) ───────────────────────
const bundledImagesDir = join(ROOT, "assets", "images");
if (existsSync(bundledImagesDir)) {
  for (const file of readdirSync(bundledImagesDir)) {
    const dest = join(imagesDir, file);
    if (!existsSync(dest)) cpSync(join(bundledImagesDir, file), dest);
  }
}

// ─── 1. TTS narration ─────────────────────────────────────────────────────────
const script = JSON.parse(readFileSync(join(jobDir, "script.json"), "utf8"));
const scenes = Array.isArray(script?.scenes) ? script.scenes : [];
if (scenes.length === 0) {
  console.error("PROMO_JOB_ERROR\tScript has no scenes");
  process.exit(1);
}

const ttsBin = resolveTtsBin();
const durations = new Array(scenes.length).fill(2.5);
for (let i = 0; i < scenes.length; i++) {
  const text = (scenes[i].narration || "").trim();
  if (!text) {
    log(`Scene ${i + 1} (${scenes[i].type}) has no narration — using default slot`);
    continue;
  }
  const out = join(assetsDir, "narration", `${i}.mp3`);
  const ok = await synthesizeLine(ttsBin, text, out);
  if (!ok) {
    console.error(
      `PROMO_JOB_ERROR\tedge-tts failed for scene ${i + 1}. Install it with ` +
      `"cd promo-video && npm run tts:setup" (creates a Python venv) or set EDGE_TTS_BIN.`
    );
    process.exit(1);
  }
  durations[i] = await probeDuration(out);
  progress("narration", ((i + 1) / scenes.length) * 100, `Narration ${i + 1}/${scenes.length}`);
}

// ─── 2. schedule + total duration ─────────────────────────────────────────────
let cursor = 0;
const schedule = scenes.map((scene, i) => {
  const start = cursor;
  cursor += durations[i] + (GAP_AFTER[scene.type] ?? 0.5);
  return { scene: i, start, duration: durations[i] };
});
const totalSeconds = cursor;
const durationInFrames = Math.ceil((totalSeconds * FPS) / 30) * 30;
log(`Total duration: ${totalSeconds.toFixed(2)}s -> ${durationInFrames} frames`);

// ─── 3. music bed ─────────────────────────────────────────────────────────────
const musicWav = synthesizeMusic(totalSeconds + 1.5);
writeFileSync(join(assetsDir, "music.wav"), musicWav);
progress("music", 100, "Music bed synthesized");

// ─── 4. bundle + render ───────────────────────────────────────────────────────
const inputProps = { script, schedule, durationInFrames };
const serveUrl = await bundle({
  entryPoint: join(ROOT, "src", "index.ts"),
  publicDir: assetsDir,
  onProgress: (p) => progress("bundle", p * 100, "Bundling composition"),
});

const results = [];
for (const format of formats) {
  const compId = format === "vertical" ? "vectorafriq-promo-job-vertical" : "vectorafriq-promo-job";
  const outFile = join(jobDir, format === "vertical" ? "out-vertical.mp4" : "out.mp4");
  progress("render", 0, `Rendering ${format}…`);

  const composition = await selectComposition({ serveUrl, id: compId, inputProps });
  const browserExecutable =
    process.env.CHROME_PATH || process.env.REMOTION_BROWSER_EXECUTABLE || undefined;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: outFile,
    inputProps,
    concurrency: 4,
    ...(browserExecutable ? { browserExecutable } : {}),
    onProgress: (p) => progress("render", Math.round(p.progress * 100), `Rendering ${format} (${Math.round(p.progress * 100)}%)`),
  });

  results.push({
    format,
    file: outFile,
    filename: outFile.split("/").pop(),
    durationInFrames,
    durationSeconds: Number((durationInFrames / FPS).toFixed(2)),
    width: format === "vertical" ? 1080 : 1920,
    height: format === "vertical" ? 1920 : 1080,
  });
  progress("render", 100, `${format} rendered`);
}

const result = {
  formats: results,
  schedule,
  durationInFrames,
  durationSeconds: Number((durationInFrames / FPS).toFixed(2)),
  scenes: scenes.map((s) => ({ type: s.type, narration: s.narration })),
};
writeFileSync(join(jobDir, "result.json"), JSON.stringify(result, null, 2));
console.log(`PROMO_JOB_DONE\t${JSON.stringify(result)}`);
console.log("[render-job] Finished successfully");
