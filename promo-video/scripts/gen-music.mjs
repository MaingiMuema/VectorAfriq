// Synthesizes an original ambient-electronic music bed (pure Node, no deps)
// and writes it to assets/music.wav.
// Usage: node scripts/gen-music.mjs [durationSeconds]
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { synthesizeMusic } from "./lib/music.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "assets", "music.wav");
mkdirSync(dirname(OUT), { recursive: true });

const DUR = Number(process.argv[2] || 64);
const wav = synthesizeMusic(DUR);
writeFileSync(OUT, wav);
console.log(`Music bed written: ${OUT} (${DUR}s, 44.1kHz stereo wav)`);
