import { test, type BrowserContext, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { waitForRepoReady, waitForServiceWorkerActive } from "./helpers.js";

/**
 * A/B bench: subduction WebSocket on the automerge SharedWorker thread
 * ("inline", the pre-worker behaviour) vs proxied through a dedicated io
 * SharedWorker via port donation ("worker").
 *
 * Metrics per arm:
 *  - driftMs      — how late the worker thread's 1s timer fired under load
 *                   (probe in automerge-worker.ts → window.__driftSamples).
 *                   This is "how late an in-thread keepalive would be", and
 *                   should be IDENTICAL across arms (same thread, same load);
 *                   it quantifies the hazard, not the arms' difference.
 *  - propagationMs — edit-visibility latency between two tabs sharing the
 *                   worker, sampled during load. Differentiates the arms if
 *                   socket handling competes with sync work.
 *  - wsEvents     — console lines from the worker mentioning socket
 *                   close/reconnect during the run (server-dependent, noisy).
 *  - boot         — patchwork-level boot timing per arm: cold (first tab:
 *                   SW controlled → repo ready → root rendered) and second
 *                   tab (SharedWorker already warm). The worker arm adds a
 *                   port-donation round-trip on this path; this shows its
 *                   cost (or lack thereof).
 *
 * Excluded from `pnpm test:e2e` runs: set RUN_BENCH=1 (root: pnpm bench:ws).
 * Results land in e2e/bench-results/<timestamp>-<mode>.json — run each arm
 * several times and compare percentiles across runs.
 */

const RUN_BENCH = !!process.env.RUN_BENCH;
const LOAD_SECONDS = Number(process.env.BENCH_LOAD_SECONDS ?? 60);
const ITERATIONS = Number(process.env.BENCH_ITERATIONS ?? 3);
const LOAD_DOCS = Number(process.env.BENCH_LOAD_DOCS ?? 4);
const SYNC_DOCS = Number(process.env.BENCH_SYNC_DOCS ?? 40);
const SYNC_DOC_KB = Number(process.env.BENCH_SYNC_DOC_KB ?? 25);
// Optional WorkerWebSocketEndpoint windowFrames override (worker arm only;
// endpoint default 128). Set e.g. BENCH_WS_WINDOW=16 to A/B the io proxy's
// credit window.
const WS_WINDOW = process.env.BENCH_WS_WINDOW ?? "";
const RESULTS_DIR = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "bench-results"
);

const WS_EVENT_RE =
  /websocket|socket.*(clos|disconnect|reconnect)|(clos|disconnect|reconnect).*socket/i;

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(
    sorted.length - 1,
    Math.ceil((p / 100) * sorted.length) - 1
  );
  return sorted[Math.max(0, idx)];
}

function summarize(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    n: sorted.length,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    p99: percentile(sorted, 99),
    max: sorted[sorted.length - 1] ?? NaN,
  };
}

/** Patchwork boot phases, all relative to navigation start. renderMs keys on
 * the site's "root element mounted" log — the app shell is up (full frame
 * render additionally needs module docs from the sync server). */
async function measureBoot(
  page: Page,
  url: string
): Promise<{ swMs: number; repoMs: number; renderMs: number }> {
  const t0 = Date.now();
  const rendered = page
    .waitForEvent("console", {
      predicate: (msg) => msg.text().includes("root element mounted"),
      timeout: 90_000,
    })
    .then(() => Date.now() - t0)
    .catch(() => NaN);
  await page.goto(url);
  await waitForServiceWorkerActive(page, 60_000);
  const swMs = Date.now() - t0;
  await waitForRepoReady(page, 60_000);
  const repoMs = Date.now() - t0;
  return { swMs, repoMs, renderMs: await rendered };
}

/** Heavy Automerge churn in this tab: several docs, paced bursts of 1KB
 * appends round-robined across them. Appends go into an array so each op
 * stores only its chunk — NOT the whole field (a scalar-string rewrite
 * stores the entire string per edit and OOMs the renderer within minutes;
 * ask us how we know). ~200 edits/s → ~12MB history per 60s iteration,
 * shared by tab, SharedWorker, and reader. The worker-side wasm apply +
 * storage + server sync + (inline arm) socket handling share one thread. */
async function startLoad(
  page: Page,
  seconds: number,
  docs: number
): Promise<void> {
  await page.evaluate(
    ([secs, docCount]) => {
      const handles = Array.from({ length: docCount }, () => {
        const handle = (window as any).repo.create();
        handle.change((d: any) => {
          d.log = [];
          d.n = 0;
        });
        return handle;
      });
      const end = Date.now() + secs * 1000;
      (window as any).__loadDone = new Promise<number>((resolve) => {
        let edits = 0;
        const BURST = 5;
        const TICK_MS = 25;
        const CHUNK = "y".repeat(1_024);
        const tick = () => {
          if (Date.now() >= end) return resolve(edits);
          for (let i = 0; i < BURST; i++) {
            const handle = handles[edits % handles.length];
            handle.change((d: any) => {
              d.log.push(CHUNK);
              d.n++;
            });
            edits++;
          }
          setTimeout(tick, TICK_MS);
        };
        tick();
      });
    },
    [seconds, docs] as const
  );
}

/** Sample edit→visibility latency from tab A (writer) to tab B (reader). */
async function sampleProbePropagation(
  writer: Page,
  reader: Page,
  probeUrl: string,
  rounds: number
): Promise<number[]> {
  const samples: number[] = [];
  for (let round = 1; round <= rounds; round++) {
    const started = Date.now();
    await writer.evaluate(
      async ([url, value]) => {
        const handle = await (window as any).repo.find(url);
        handle.change((d: any) => {
          d.marker = value;
        });
      },
      [probeUrl, round] as const
    );
    await reader.waitForFunction(
      async ([url, value]) => {
        // Swallow find() rejections ("unavailable" before the doc arrives)
        // so polling continues instead of failing the wait.
        try {
          const handle = await (window as any).repo.find(url);
          return handle.doc()?.marker === value;
        } catch {
          return false;
        }
      },
      [probeUrl, round] as const,
      { timeout: 30_000, polling: 100 }
    );
    samples.push(Date.now() - started);
    await reader.waitForTimeout(1_000);
  }
  return samples;
}

for (const mode of ["inline", "worker"] as const) {
  test(`ws bench: ${mode}`, async ({ browser }) => {
    test.skip(!RUN_BENCH, "bench only runs with RUN_BENCH=1 (pnpm bench:ws)");
    test.setTimeout(
      ITERATIONS * (LOAD_SECONDS + 40) * 1000 +
        SYNC_DOCS * 3_000 +
        240_000
    );

    // Fresh context per arm: SharedWorkers outlive pages, and the ws-mode
    // query param means each arm gets its own worker instance anyway.
    const context: BrowserContext = await browser.newContext();
    await context.addInitScript(
      ([m, win]) => {
        localStorage.setItem("patchwork:ws-mode", m);
        if (win) localStorage.setItem("patchwork:ws-window", win);
      },
      [mode, WS_WINDOW] as const
    );

    const wsEvents: string[] = [];
    const watchConsole = (page: Page) => {
      page.on("console", (msg) => {
        if (WS_EVENT_RE.test(msg.text())) wsEvents.push(msg.text());
      });
      // A crashed renderer otherwise surfaces as an opaque "Channel closed"
      // from whatever evaluate was in flight — name the real culprit.
      page.on("crash", () => {
        throw new Error(
          "page crashed (renderer OOM?) — lower BENCH_LOAD_DOCS / edit volume"
        );
      });
    };

    const writer = await context.newPage();
    watchConsole(writer);
    const bootCold = await measureBoot(writer, "/");

    const reader = await context.newPage();
    watchConsole(reader);
    const bootSecondTab = await measureBoot(reader, "/");

    // Warm-up: let boot-time churn (module sync, SW install) settle so the
    // measurement window reflects steady-state contention, not first-load.
    await writer.waitForTimeout(10_000);
    await writer.evaluate(() => {
      (window as any).__driftSamples = [];
    });

    // Probe doc, created before load so both repos already have it.
    const probeUrl = await writer.evaluate(() => {
      const handle = (window as any).repo.create();
      handle.change((d: any) => {
        d.marker = 0;
      });
      return handle.url as string;
    });
    await reader.evaluate(async (url) => {
      await (window as any).repo.find(url);
    }, probeUrl);

    // ── Many-doc sync: publish a batch from the writer, then time a FRESH
    // context (own IndexedDB, own SharedWorker — everything must round-trip
    // through the sync server) resolving all of them. Runs BEFORE the churn
    // phase: churn leaves tens of MB of history still uploading, and the
    // batch would queue behind that backlog.
    const syncUrls: string[] = await writer.evaluate(
      ([count, kb]) =>
        Array.from({ length: count }, (_, i) => {
          const handle = (window as any).repo.create();
          handle.change((d: any) => {
            d.i = i;
            d.payload = "z".repeat(kb * 1024);
          });
          return handle.url as string;
        }),
      [SYNC_DOCS, SYNC_DOC_KB] as const
    );
    // Grace for the writer's worker to push the batch to the server; the
    // fresh context can only pull what has arrived there.
    await writer.waitForTimeout(10_000);

    const syncContext = await browser.newContext();
    await syncContext.addInitScript(
      ([m, win]) => {
        localStorage.setItem("patchwork:ws-mode", m);
        if (win) localStorage.setItem("patchwork:ws-window", win);
      },
      [mode, WS_WINDOW] as const
    );
    const syncPage = await syncContext.newPage();
    watchConsole(syncPage);
    await syncPage.goto("/");
    await waitForRepoReady(syncPage);

    const syncStarted = Date.now();
    const syncDocMs: number[] = await syncPage.evaluate(async (urls) => {
      const t0 = Date.now();
      // Bare find() can reject "unavailable" if the server hasn't caught up
      // (known DocumentQuery behaviour) — retry with backoff like production
      // does (findWithRetry, ADR-008). Delay caps at 8s; ~10 attempts ≈ 1min.
      const findWithRetry = async (url: string) => {
        for (let attempt = 0; ; attempt++) {
          try {
            return await (window as any).repo.find(url);
          } catch (err) {
            if (attempt >= 10) throw err;
            await new Promise((r) =>
              setTimeout(r, Math.min(8_000, 250 * 2 ** attempt))
            );
          }
        }
      };
      return Promise.all(
        urls.map(async (u: string) => {
          await findWithRetry(u);
          return Date.now() - t0;
        })
      );
    }, syncUrls);
    const syncAllMs = Date.now() - syncStarted;
    await syncContext.close();

    let edits = 0;
    const propagationMs: number[] = [];
    for (let iter = 1; iter <= ITERATIONS; iter++) {
      await startLoad(writer, LOAD_SECONDS, LOAD_DOCS);
      propagationMs.push(
        ...(await sampleProbePropagation(
          writer,
          reader,
          probeUrl,
          Math.max(3, Math.floor(LOAD_SECONDS / 5))
        ))
      );
      edits += await writer.evaluate(() => (window as any).__loadDone);
      // Brief cooldown between iterations so reconnect fallout (if any)
      // surfaces in wsEvents while we're still watching.
      await writer.waitForTimeout(5_000);
    }

    // Drift batches flush every 5s; give the last one time to arrive.
    await writer.waitForTimeout(6_000);
    const driftMs: number[] = await writer.evaluate(
      () => (window as any).__driftSamples ?? []
    );

    const result = {
      mode,
      when: new Date().toISOString(),
      loadSeconds: LOAD_SECONDS,
      iterations: ITERATIONS,
      loadDocs: LOAD_DOCS,
      wsWindow: WS_WINDOW || "default(128)",
      edits,
      boot: { cold: bootCold, secondTab: bootSecondTab },
      syncDocs: {
        count: SYNC_DOCS,
        docKb: SYNC_DOC_KB,
        allMs: syncAllMs,
        perDocMs: summarize(syncDocMs),
      },
      driftMs: summarize(driftMs),
      propagationMs: summarize(propagationMs),
      wsEvents: { count: wsEvents.length, lines: wsEvents.slice(0, 50) },
      raw: { driftMs, propagationMs, syncDocMs },
    };

    mkdirSync(RESULTS_DIR, { recursive: true });
    const file = join(
      RESULTS_DIR,
      `${result.when.replace(/[:.]/g, "-")}-${mode}.json`
    );
    writeFileSync(file, JSON.stringify(result, null, 2));

    console.log(
      `[bench:${mode}] edits=${edits} ` +
        `boot cold sw/repo/render=${bootCold.swMs}/${bootCold.repoMs}/${bootCold.renderMs}ms ` +
        `tab2 repo=${bootSecondTab.repoMs}ms ` +
        `drift p50/p95/p99=${result.driftMs.p50}/${result.driftMs.p95}/${result.driftMs.p99}ms ` +
        `propagation p50/p95=${result.propagationMs.p50}/${result.propagationMs.p95}ms ` +
        `sync ${SYNC_DOCS}×${SYNC_DOC_KB}KB all=${syncAllMs}ms p95=${result.syncDocs.perDocMs.p95}ms ` +
        `wsEvents=${wsEvents.length} → ${file}`
    );

    await context.close();
  });
}
