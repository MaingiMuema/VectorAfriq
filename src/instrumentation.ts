/**
 * Next.js instrumentation hook — runs once when a server instance boots
 * (`next dev`, `next start`, and this repo's custom `server.js` alike).
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Starts the SEO agent job worker (src/lib/seo/worker.ts, Phase 1.1) and the
 * promo video job worker (src/lib/promo-video/worker.ts) so queued jobs get
 * processed without a separate process to manage.
 *
 * NOTE: instrumentation only runs at server boot — editing these workers
 * requires a full server restart (Next dev does not hot-reload them).
 */
export async function register() {
  // Guard against the edge runtime (middleware) — the workers use mysql2 and
  // other Node-only APIs, and register() is invoked there too.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const startWithGuard = async (name: string, loader: () => Promise<void>) => {
    try {
      await loader();
      console.log(`[instrumentation] ${name} worker started`);
    } catch (err) {
      // A failing worker must never take the server (or its sibling worker)
      // down — log loudly instead so the issue is visible in the console.
      console.error(`[instrumentation] Failed to start ${name} worker:`, err);
    }
  };

  // Start both workers concurrently so a slow import in one never delays the other.
  await Promise.allSettled([
    startWithGuard("SEO agent", async () => {
      const { startWorker } = await import("@/lib/seo/worker");
      startWorker();
    }),
    startWithGuard("PromoVideo", async () => {
      const { startPromoVideoWorker } = await import("@/lib/promo-video/worker");
      startPromoVideoWorker();
    }),
  ]);
}
