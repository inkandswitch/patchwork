import { availableParallelism } from "node:os";
import { defineConfig, devices } from "@playwright/test";

/**
 * E2E harness for the real Patchwork browser + Service-Worker boot path.
 *
 * Unlike the in-process Vitest sync tests (which simulate Tab <-> SW with
 * two Node Repos over a MessageChannel), these tests drive an actual
 * Chromium instance against a built `patchwork.inkandswitch.com` site served by
 * `vite preview`. That exercises SW registration, Wasm init, IndexedDB,
 * and the MessageChannel relay end to end.
 *
 * Stage B1 scope: scenarios that route only through the SW relay +
 * IndexedDB (no external Subduction server). Cross-device/server tests
 * arrive in B3 once a local sync server is wired in.
 *
 * Resource note: every test gets its own browser context (own IndexedDB,
 * own service worker), so tests are independent and run in parallel.
 * CI runs one browser project per job; locally `playwright test` runs all
 * three, so we keep the local worker count lower to bound memory.
 */

const PORT = Number(process.env.PORT ?? 5173);
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  // Service-worker boot + sync is inherently timing-sensitive; give each
  // test room but keep it bounded so hangs fail loudly.
  timeout: 60_000,
  expect: { timeout: 15_000 },

  fullyParallel: true,
  workers: process.env.CI
    ? availableParallelism()
    : Math.ceil(availableParallelism() / 2),
  forbidOnly: !!process.env.CI,
  // One retry everywhere: cross-tab find() can wedge permanently (see
  // README "known flake"), and a retried pass reports as "flaky" so the
  // signal stays visible without failing the run.
  retries: 1,

  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],

  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    // COOP/COEP from the preview server require a secure-ish context;
    // localhost is treated as secure, so SharedArrayBuffer works.
    serviceWorkers: "allow",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],

  // Build is expected to have run already (see e2e README / CI). We only
  // start the preview server here so the harness boots quickly and
  // deterministically. `reuseExistingServer` lets you keep a `vite preview`
  // running locally during iteration.
  webServer: {
    command: "pnpm preview",
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: { PORT: String(PORT) },
  },
});
