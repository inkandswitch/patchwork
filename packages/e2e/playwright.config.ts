import { availableParallelism } from "node:os";
import path from "node:path";
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

// The `patchwork-e2e` bin sets these so the suite can run from the root of a
// site repo (see bin/patchwork-e2e.js). Run directly, the defaults apply.
const PORT = Number(process.env.PORT ?? 5173);
const EXTERNAL_BASE_URL = process.env.PATCHWORK_E2E_BASE_URL;
const BASE_URL = EXTERNAL_BASE_URL ?? `http://localhost:${PORT}`;
const SITE_DIR = process.env.PATCHWORK_E2E_SITE_DIR ?? process.cwd();
const PREVIEW_COMMAND = process.env.PATCHWORK_E2E_PREVIEW_COMMAND ?? "pnpm preview";
// Reports and traces belong next to whoever invoked us, not inside the
// installed package. Relative paths would resolve against this file.
const OUTPUT_DIR = process.env.PATCHWORK_E2E_OUTPUT_DIR;
const output = (name: string) =>
  OUTPUT_DIR ? path.join(OUTPUT_DIR, name) : name;
// A site repo can point us at its own specs; they get the same fixtures,
// baseURL and preview server, as a project per browser named "<browser>:extra".
const EXTRA_TESTS_DIR = process.env.PATCHWORK_E2E_EXTRA_TESTS_DIR;

const browsers = [
  { name: "chromium", use: devices["Desktop Chrome"] },
  { name: "firefox", use: devices["Desktop Firefox"] },
  { name: "webkit", use: devices["Desktop Safari"] },
];

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

  outputDir: output("test-results"),
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never", outputFolder: output("playwright-report") }]]
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

  projects: browsers.flatMap(({ name, use }) => [
    { name, use: { ...use } },
    ...(EXTRA_TESTS_DIR
      ? [{ name: `${name}:extra`, testDir: EXTRA_TESTS_DIR, use: { ...use } }]
      : []),
  ]),

  // Build is expected to have run already (see e2e README / CI). We only
  // start the preview server here so the harness boots quickly and
  // deterministically. `reuseExistingServer` lets you keep a `vite preview`
  // running locally during iteration. `--base-url` points the suite at a
  // server someone else is running, so we start nothing.
  webServer: EXTERNAL_BASE_URL
    ? undefined
    : {
        command: PREVIEW_COMMAND,
        cwd: SITE_DIR,
        url: BASE_URL,
        timeout: 120_000,
        reuseExistingServer: !process.env.CI,
        env: { PORT: String(PORT) },
      },
});
