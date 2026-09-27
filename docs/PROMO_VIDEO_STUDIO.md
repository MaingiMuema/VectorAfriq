# Promo Video Studio (admin)

Admins can type a plain-English brief and get a branded, downloadable promo video —
an AI writes the script, sources imagery, generates a voice-over + music bed and
renders an mp4 via the existing `promo-video` Remotion package.

Admin page: **/admin/promo-video**

## Pipeline (per job)

```
queued → script → assets → render → completed
```

1. **script** — the selected OpenRouter chat model writes a structured script
   (scenes, narration lines, copy, image requests). Models (switchable in the UI,
   persisted in `.promo-video/model.json`):
   - `openai/gpt-5.6-luna` (flagship)
   - `deepseek/deepseek-v4-flash-0731` (fast)
2. **assets** — every image the script needs is resolved from the first
   available source:
   1. Admin-uploaded assets (priority)
   2. Pexels free stock (needs `PEXELS_API_KEY`)
   3. Unsplash free stock (needs `UNSPLASH_ACCESS_KEY`)
   4. Real platform property photos (this app's own image service — always works)
   5. AI-generated via OpenRouter (`qwen/qwen-image-3-pro`)
   6. Bundled fallback image (a render never breaks)
3. **render** — a child process (`promo-video/scripts/render-job.mjs`) does
   TTS narration (Python `edge-tts`, no key), synthesizes the music bed,
   measures narration with `ffprobe`, bundles the Remotion composition and
   renders h264 mp4 (landscape 1920×1080 and/or vertical 1080×1920).

Jobs are stored in MySQL (`promo_video_job`), artifacts in `.promo-videos/`
(gitignored), and processed by an in-process worker started from
`src/instrumentation.ts` (same pattern as the SEO agent worker).

## One-time setup

```bash
# 1. Promo-video package: npm deps + TTS venv (Python edge-tts CLI)
cd promo-video
npm install
npm run tts:setup            # creates .tts-venv with edge-tts

# 2. (Optional) Remotion headless browser shell — avoids relying on system Chrome
npx remotion browser ensure
#    Or point at system Chrome: export CHROME_PATH=/Applications/Google Chrome.app/...

# 3. Main app: create the job table
cd ..
npm run init-promo-video

# 4. Restart the Next server so instrumentation starts the promo worker
```

## Environment variables

| Var | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | ✅ | Script generation + AI image generation |
| `IMAGE_SERVICE_URL` | depends | Platform photos + asset uploads (defaults localhost:3001) |
| `PEXELS_API_KEY` | optional | Free stock photo source |
| `UNSPLASH_ACCESS_KEY` | optional | Free stock photo source |
| `CHROME_PATH` / `REMOTION_BROWSER_EXECUTABLE` | optional | Chrome for rendering (defaults to Remotion headless shell) |
| `EDGE_TTS_BIN` | optional | Path to an edge-tts CLI (defaults to `promo-video/.tts-venv/bin/edge-tts`, then PATH) |
| `PROMO_VOICE` | optional | TTS voice (default `en-GB-SoniaNeural`) |

## Notes

- Rendering is CPU-heavy; jobs are queued and run one at a time by the worker.
- The worker spawns `promo-video/scripts/render-job.mjs` as a child process. Its
  path is round-tripped through `.promo-video/render-script-path.txt` (rewritten
  each render) so Turbopack's build-time `spawn` analysis doesn't try to resolve
  the script as a module ("server relative imports are not implemented yet").
  Don't remove that indirection — a statically-known path breaks `next build`.
- `promo-video/` must exist next to the server at runtime (scripts, assets, and
  the Remotion package are read from disk); it isn't traced into the standalone
  output.
- A job can be cancelled between pipeline stages; cancellation always wins over
  completion.
- The original hardcoded `vectorafriq-promo` compositions are untouched —
  scenes fall back to their classic content when no job script is present.
- Reinstall caveat: if `promo-video`'s `npm install` is ever interrupted, native
  binaries (`@rspack/binding-*`, `mediabunny`) can arrive truncated — delete
  `promo-video/node_modules` and reinstall from a fresh npm cache before
  debugging render failures.
